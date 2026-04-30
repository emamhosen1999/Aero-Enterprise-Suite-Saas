<?php

namespace Aero\Core\Providers;

use Aero\Core\Services\PlatformErrorReporter;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Exception Handler Service Provider
 *
 * Registers exception rendering logic for the application.
 * This allows the host application to have a minimal bootstrap/app.php
 * while keeping all exception handling logic in the package.
 */
class ExceptionHandlerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Register exception handlers for the application.
     * This method is called from the host app's bootstrap/app.php withExceptions() callback.
     */
    public static function registerExceptionHandlers(Exceptions $exceptions): void
    {
        /**
         * Helper to check if request expects JSON/Inertia response
         */
        $expectsJson = fn ($request) => $request->expectsJson() ||
            $request->header('X-Inertia') ||
            $request->is('api/*') ||
            $request->ajax();

        // =========================================================================
        // AUTHENTICATION EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (AuthenticationException $e, $request) use ($expectsJson) {
            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 401,
                        'type' => 'AuthenticationException',
                        'message' => 'Authentication required',
                    ],
                ], 401);
            }

            // Redirect to login for Inertia requests
            if ($request->header('X-Inertia')) {
                return Inertia::location('/login');
            }

            return redirect()->guest('/login')
                ->with('status', 'Please login to access this page.');
        });

        // =========================================================================
        // SESSION/TOKEN MISMATCH EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (TokenMismatchException $e, $request) use ($expectsJson) {
            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 419,
                        'type' => 'TokenMismatchException',
                        'message' => 'Session expired',
                    ],
                ], 419);
            }

            if ($request->header('X-Inertia')) {
                return Inertia::location('/login');
            }

            return redirect('/login')
                ->with('status', 'Your session has expired. Please login again.');
        });

        // =========================================================================
        // VALIDATION EXCEPTIONS (Don't report these to platform - not errors)
        // =========================================================================
        $exceptions->render(function (ValidationException $e, $request) use ($expectsJson) {
            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 422,
                        'type' => 'ValidationException',
                        'message' => 'Validation failed',
                    ],
                    'errors' => $e->errors(),
                    'message' => $e->getMessage(),
                ], 422);
            }

            // Let Laravel handle regular validation redirects
            return null;
        });

        // =========================================================================
        // AUTHORIZATION EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (AuthorizationException $e, $request) use ($expectsJson) {
            $reporter = app(PlatformErrorReporter::class);
            $errorData = $reporter->createErrorResponse($e, $request);

            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => $errorData,
                ], 403);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => $errorData,
            ])->toResponse($request)->setStatusCode(403);
        });

        // =========================================================================
        // MODEL NOT FOUND EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (ModelNotFoundException $e, $request) use ($expectsJson) {
            $reporter = app(PlatformErrorReporter::class);
            $errorData = $reporter->createErrorResponse($e, $request);

            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => $errorData,
                ], 404);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => $errorData,
            ])->toResponse($request)->setStatusCode(404);
        });

        // =========================================================================
        // HTTP NOT FOUND EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (NotFoundHttpException $e, $request) use ($expectsJson) {
            $reporter = app(PlatformErrorReporter::class);
            $errorData = $reporter->createErrorResponse($e, $request);

            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => $errorData,
                ], 404);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => $errorData,
            ])->toResponse($request)->setStatusCode(404);
        });

        // =========================================================================
        // RATE LIMIT EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (TooManyRequestsHttpException $e, $request) use ($expectsJson) {
            $reporter = app(PlatformErrorReporter::class);
            $errorData = $reporter->createErrorResponse($e, $request);
            $errorData['retryAfter'] = $e->getHeaders()['Retry-After'] ?? 60;

            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => $errorData,
                ], 429);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => $errorData,
            ])->toResponse($request)->setStatusCode(429);
        });

        // =========================================================================
        // DATABASE EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (QueryException $e, $request) use ($expectsJson) {
            $reporter = app(PlatformErrorReporter::class);
            $errorData = $reporter->createErrorResponse($e, $request);

            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => $errorData,
                ], 500);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => $errorData,
            ])->toResponse($request)->setStatusCode(500);
        });

        // =========================================================================
        // GENERIC HTTP EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (HttpException $e, $request) use ($expectsJson) {
            $statusCode = $e->getStatusCode();
            $reporter = app(PlatformErrorReporter::class);
            $errorData = $reporter->createErrorResponse($e, $request);

            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => $errorData,
                ], $statusCode);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => $errorData,
            ])->toResponse($request)->setStatusCode($statusCode);
        });

        // =========================================================================
        // CATCH-ALL: ANY OTHER THROWABLE
        // =========================================================================
        $exceptions->render(function (\Throwable $e, $request) use ($expectsJson) {
            $reporter = app(PlatformErrorReporter::class);
            $errorData = $reporter->createErrorResponse($e, $request);

            if ($expectsJson($request)) {
                return response()->json([
                    'success' => false,
                    'error' => $errorData,
                ], 500);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => $errorData,
            ])->toResponse($request)->setStatusCode(500);
        });
    }
}
