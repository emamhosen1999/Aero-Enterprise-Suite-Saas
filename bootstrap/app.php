<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\TrackSecurityActivity::class,
            \App\Http\Middleware\CheckSessionExpiry::class, // Add session expiry check
        ]);        // Register custom middleware aliases
        $middleware->alias([
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'custom_permission' => \App\Http\Middleware\CheckPermission::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'api_security' => \App\Http\Middleware\ApiSecurityMiddleware::class,
            'security_headers' => \App\Http\Middleware\SecurityHeaders::class,
            'enhanced_rate_limit' => \App\Http\Middleware\EnhancedRateLimit::class,
            'role_permission_sync' => \App\Http\Middleware\EnsureRolePermissionSync::class,
            'track_security' => \App\Http\Middleware\TrackSecurityActivity::class,
            'session_expiry' => \App\Http\Middleware\CheckSessionExpiry::class, // Register alias
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle authentication exceptions
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            // For Inertia requests (SPA/AJAX)
            if ($request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Authentication required. Please login to continue.',
                    'redirect' => route('login'),
                    'session_expired' => true,
                ], 401);
            }

            // For API requests
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error' => 'authentication_required',
                    'redirect' => route('login'),
                ], 401);
            }

            // For regular web requests
            return redirect()->guest(route('login'))
                ->with('status', 'Please login to access this page.')
                ->with('session_expired', true);
        });

        // Handle session expired exceptions
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, $request) {
            // For Inertia requests (SPA/AJAX)
            if ($request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Your session has expired. Please refresh the page and login again.',
                    'redirect' => route('login'),
                    'session_expired' => true,
                ], 419);
            }

            // For API requests
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Session expired due to token mismatch.',
                    'error' => 'token_mismatch',
                    'redirect' => route('login'),
                ], 419);
            }

            // For regular web requests
            return redirect()->route('login')
                ->with('status', 'Your session has expired. Please login again.')
                ->with('session_expired', true);
        });
    })->create();
