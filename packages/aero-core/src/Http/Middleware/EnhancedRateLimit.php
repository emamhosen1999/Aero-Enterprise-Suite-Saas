<?php

namespace Aero\Core\Http\Middleware;

use Aero\Core\Services\Logging\ApplicationLogger;
use Aero\Core\Support\TenantCache;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enhanced Rate Limiting Middleware
 * Implements intelligent rate limiting with user-based rules
 */
class EnhancedRateLimit
{
    protected ApplicationLogger $logger;

    public function __construct(ApplicationLogger $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $maxAttempts = '60', string $decayMinutes = '1'): Response
    {
        $user = $request->user();
        $key = $this->resolveRequestSignature($request, $user);

        // Different limits for different user types
        $limits = $this->getUserLimits($user);
        $maxAttempts = $limits['requests_per_minute'];

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            // Log rate limit violation
            $this->logger->logSecurityEvent('Rate Limit Exceeded', [
                'ip_address' => $request->ip(),
                'user_id' => $user?->id,
                'attempts' => RateLimiter::attempts($key),
                'max_attempts' => $maxAttempts,
                'route' => $request->route()?->getName(),
                'user_agent' => $request->userAgent(),
            ], 'warning');

            return response()->json([
                'message' => 'Too many requests. Please slow down.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }

        RateLimiter::hit($key, (int) $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => max(0, $maxAttempts - RateLimiter::attempts($key)),
            'X-RateLimit-Reset' => RateLimiter::availableIn($key) + time(),
        ]);

        return $response;
    }

    /**
     * Resolve request signature for rate limiting
     */
    protected function resolveRequestSignature(Request $request, $user): string
    {
        if ($user) {
            return 'user:'.$user->id.'|route:'.($request->route()?->getName() ?? 'unknown');
        }

        return 'ip:'.$request->ip().'|route:'.($request->route()?->getName() ?? 'unknown');
    }

    /**
     * Get rate limit rules based on user type
     */
    protected function getUserLimits($user): array
    {
        if (! $user) {
            return ['requests_per_minute' => 20]; // Guest users
        }

        // Cache user limits (tenant-aware)
        return TenantCache::remember("rate_limits_user_{$user->id}", 300, function () use ($user) {
            if ($user->hasRole('Super Administrator')) {
                return ['requests_per_minute' => 200];
            }

            if ($user->hasRole('Administrator')) {
                return ['requests_per_minute' => 150];
            }

            $userWithDesignation = \App\Models\User::with('designation')->find($user->id);
            $userDesignationTitle = $userWithDesignation->designation?->title;

            if ($userDesignationTitle === 'Supervision Engineer') {
                return ['requests_per_minute' => 100];
            }

            // Regular employees
            return ['requests_per_minute' => 60];
        });
    }
}
