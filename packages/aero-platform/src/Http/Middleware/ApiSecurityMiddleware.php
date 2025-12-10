<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Advanced API Security Middleware
 *
 * Provides comprehensive security controls for API endpoints
 * including rate limiting, input validation, and audit logging
 */
class ApiSecurityMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$guards): Response
    {
        // Rate limiting by user and IP
        $this->applyRateLimiting($request);

        // Input sanitization and validation
        $this->sanitizeInput($request);

        // Security headers
        $this->validateSecurityHeaders($request);

        // Audit logging for sensitive operations
        $this->auditRequest($request);

        $response = $next($request);

        // Add security headers to response
        $this->addSecurityHeaders($response);

        return $response;
    }

    /**
     * Apply rate limiting based on user and endpoint
     */
    private function applyRateLimiting(Request $request): void
    {
        $key = $this->getRateLimitKey($request);
        $maxAttempts = $this->getMaxAttempts($request);
        $decayMinutes = $this->getDecayMinutes($request);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            Log::warning('Rate limit exceeded', [
                'user_id' => auth()->id(),
                'ip' => $request->ip(),
                'endpoint' => $request->path(),
                'user_agent' => $request->userAgent(),
            ]);

            abort(429, 'Too many requests. Please slow down.');
        }

        RateLimiter::hit($key, $decayMinutes * 60);
    }

    /**
     * Get rate limit key for the request
     */
    private function getRateLimitKey(Request $request): string
    {
        $userId = auth()->id() ?? 'guest';
        $ip = $request->ip();
        $endpoint = $request->path();

        return "api_rate_limit:{$userId}:{$ip}:{$endpoint}";
    }

    /**
     * Get maximum attempts based on endpoint sensitivity
     */
    private function getMaxAttempts(Request $request): int
    {
        $path = $request->path();

        // Sensitive endpoints get stricter limits
        if (str_contains($path, 'roles') || str_contains($path, 'users') || str_contains($path, 'permissions')) {
            return 30; // 30 requests per window
        }

        if (str_contains($path, 'admin')) {
            return 60; // 60 requests per window
        }

        return 120; // Default limit
    }

    /**
     * Get decay minutes based on endpoint
     */
    private function getDecayMinutes(Request $request): int
    {
        $path = $request->path();

        // Sensitive endpoints get longer decay periods
        if (str_contains($path, 'roles') || str_contains($path, 'permissions')) {
            return 15; // 15 minute window
        }

        return 5; // 5 minute window
    }

    /**
     * Sanitize request input
     */
    private function sanitizeInput(Request $request): void
    {
        $input = $request->all();
        $sanitized = $this->recursiveSanitize($input);
        $request->merge($sanitized);
    }

    /**
     * Recursively sanitize input data
     */
    private function recursiveSanitize($data)
    {
        if (is_array($data)) {
            return array_map([$this, 'recursiveSanitize'], $data);
        }

        if (is_string($data)) {
            // Remove potentially dangerous characters
            $data = strip_tags($data);
            $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');

            // Check for SQL injection patterns
            $sqlPatterns = [
                '/(\bunion\b.*\bselect\b)/i',
                '/(\bselect\b.*\bfrom\b)/i',
                '/(\binsert\b.*\binto\b)/i',
                '/(\bupdate\b.*\bset\b)/i',
                '/(\bdelete\b.*\bfrom\b)/i',
                '/(\bdrop\b.*\btable\b)/i',
            ];

            foreach ($sqlPatterns as $pattern) {
                if (preg_match($pattern, $data)) {
                    Log::critical('Potential SQL injection attempt detected', [
                        'user_id' => auth()->id(),
                        'ip' => request()->ip(),
                        'data' => $data,
                        'endpoint' => request()->path(),
                    ]);

                    abort(400, 'Invalid input detected');
                }
            }

            // Check for XSS patterns
            $xssPatterns = [
                '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi',
                '/javascript:/i',
                '/on\w+\s*=/i',
            ];

            foreach ($xssPatterns as $pattern) {
                if (preg_match($pattern, $data)) {
                    Log::warning('Potential XSS attempt detected', [
                        'user_id' => auth()->id(),
                        'ip' => request()->ip(),
                        'data' => $data,
                        'endpoint' => request()->path(),
                    ]);

                    abort(400, 'Invalid input detected');
                }
            }
        }

        return $data;
    }

    /**
     * Validate security headers
     */
    private function validateSecurityHeaders(Request $request): void
    {
        // Check for required headers in API requests
        if ($request->isJson()) {
            if (! $request->hasHeader('Content-Type') ||
                ! str_contains($request->header('Content-Type'), 'application/json')) {

                Log::warning('Missing or invalid Content-Type header', [
                    'user_id' => auth()->id(),
                    'ip' => $request->ip(),
                    'content_type' => $request->header('Content-Type'),
                ]);
            }
        }

        // Check for suspicious user agents
        $userAgent = $request->userAgent();
        $suspiciousPatterns = [
            '/bot/i',
            '/spider/i',
            '/crawler/i',
            '/curl/i',
            '/wget/i',
            '/python/i',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if ($userAgent && preg_match($pattern, $userAgent)) {
                Log::info('Suspicious user agent detected', [
                    'user_id' => auth()->id(),
                    'ip' => $request->ip(),
                    'user_agent' => $userAgent,
                    'endpoint' => $request->path(),
                ]);
                break;
            }
        }
    }

    /**
     * Audit sensitive requests
     */
    private function auditRequest(Request $request): void
    {
        $sensitiveEndpoints = [
            'admin/roles',
            'admin/users',
            'roles/update-permission',
            'roles/update-module',
            'users/update-role',
        ];

        $path = $request->path();
        $isSensitive = collect($sensitiveEndpoints)->contains(function ($endpoint) use ($path) {
            return str_contains($path, $endpoint);
        });

        if ($isSensitive) {
            Log::info('Sensitive operation attempted', [
                'user_id' => auth()->id(),
                'user_name' => auth()->user()?->name,
                'ip' => $request->ip(),
                'method' => $request->method(),
                'endpoint' => $path,
                'input' => $request->except(['password', 'password_confirmation']),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
        }
    }

    /**
     * Add security headers to response
     */
    private function addSecurityHeaders(Response $response): void
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Only add HSTS in production with HTTPS
        if (app()->environment('production') && request()->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // CSP header for additional XSS protection
        $csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:";
        $response->headers->set('Content-Security-Policy', $csp);
    }
}
