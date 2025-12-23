<?php

use Aero\Core\Providers\ExceptionHandlerServiceProvider;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

/**
 * Aero Enterprise Suite - Standalone Host Bootstrap
 *
 * This is a minimal host application bootstrap file.
 * All routing, middleware, and exception handling logic is provided by packages:
 * - aero/core: Core functionality, authentication, user management
 * - aero/ui: Frontend components and layouts
 * - aero/hrm: Human Resource Management (optional)
 *
 * The host application should remain as thin as possible, acting only as a container.
 */
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Inertia middleware is registered by aero-core package automatically
        // HandleInertiaRequests from \Aero\Core\Http\Middleware is used

        // Exclude error-log API from CSRF verification (used by frontend error reporting)
        $middleware->validateCsrfTokens(except: [
            'api/error-log',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // All exception handling logic is provided by aero-core package
        // This keeps the host application minimal and ensures consistency across all installations
        ExceptionHandlerServiceProvider::registerExceptionHandlers($exceptions);
    })->create();
