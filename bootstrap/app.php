<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        // NOTE: web routes are loaded by TenancyServiceProvider with domain constraints
        // Only load API and console routes here
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Configure where guests should be redirected (uses relative URL to work on any domain)
        $middleware->redirectGuestsTo('/login');

        // Exclude payment gateway webhooks and SAML callbacks from CSRF verification
        $middleware->validateCsrfTokens(except: [
            'sslcommerz/*',  // SSLCOMMERZ payment gateway callbacks
            'stripe/*',      // Stripe webhooks (already handled by Cashier but explicit for clarity)
            'saml/*/acs',    // SAML Assertion Consumer Service (POST from IdP)
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\IdentifyDomainContext::class, // Identify domain context first
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\TrackSecurityActivity::class,
            \App\Http\Middleware\CheckSessionExpiry::class, // Add session expiry check
        ]);

        // Register custom middleware aliases
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
            'identify_domain' => \App\Http\Middleware\IdentifyDomainContext::class, // Domain context alias
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle authentication exceptions
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            // For Inertia requests (SPA/AJAX) - use Inertia location redirect
            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::location('/login');
            }

            // For API requests
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error' => 'authentication_required',
                    'redirect' => '/login',
                ], 401);
            }

            // For regular web requests - use relative URL to stay on current domain
            return redirect()->guest('/login')
                ->with('status', 'Please login to access this page.')
                ->with('session_expired', true);
        });

        // Handle session expired exceptions
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, $request) {
            // For Inertia requests (SPA/AJAX) - use Inertia location redirect
            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::location('/login');
            }

            // For API requests
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Session expired due to token mismatch.',
                    'error' => 'token_mismatch',
                    'redirect' => '/login',
                ], 419);
            }

            // For regular web requests - use relative URL to stay on current domain
            return redirect('/login')
                ->with('status', 'Your session has expired. Please login again.')
                ->with('session_expired', true);
        });
    })->create();
