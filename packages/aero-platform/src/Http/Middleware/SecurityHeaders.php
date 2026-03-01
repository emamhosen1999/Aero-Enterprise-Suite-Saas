<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enhanced Security Headers Middleware
 * Implements comprehensive security headers for ERP application
 */
class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Content Security Policy
        // Fix #5:  Removed hardcoded client-specific domain (https://api.erp.dhakabypass.com)
        //          from connect-src — it has no place in a shared platform package.
        // Fix #32: Removed 'unsafe-eval' (enables JS eval() attacks). Kept 'unsafe-inline' for
        //          now because Inertia/React hydration requires it; a nonce-based approach is
        //          recommended as a follow-up once the frontend ships Content-Security-Policy nonces.
        $appUrl = rtrim(config('app.url', ''), '/');
        $response->headers->set('Content-Security-Policy',
            "default-src 'self'; ".
            "script-src 'self' 'unsafe-inline' https://www.gstatic.com; ".
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ".
            "font-src 'self' https://fonts.gstatic.com; ".
            "img-src 'self' data: https:; ".
            "connect-src 'self' {$appUrl}; ".
            "frame-ancestors 'none';"
        );

        // Additional security headers
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // HSTS (only for HTTPS)
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
