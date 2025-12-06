<?php

use App\Services\ErrorLogService;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        // NOTE: web routes are loaded by TenancyServiceProvider with domain constraints
        // Only load API and console routes here
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Load installation routes ONLY on platform domain (not admin subdomain)
            // Note: Installation routes configure file-based sessions internally
            // to avoid database dependency before migrations are run
            $host = request()->getHost();
            $isAdminDomain = str_starts_with($host, 'admin.');

            if (! $isAdminDomain) {
                Route::middleware('web')
                    ->group(base_path('routes/installation.php'));
            }
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Configure where guests should be redirected (uses relative URL to work on any domain)
        $middleware->redirectGuestsTo('/login');

        // Exclude payment gateway webhooks and SAML callbacks from CSRF verification
        $middleware->validateCsrfTokens(except: [
            'sslcommerz/*',  // SSLCOMMERZ payment gateway callbacks
            'stripe/*',      // Stripe webhooks (already handled by Cashier but explicit for clarity)
            'saml/*/acs',    // SAML Assertion Consumer Service (POST from IdP)
            'api/error-log', // Error logging endpoint
        ]);

        // Prepend middleware to run BEFORE StartSession middleware
        $middleware->web(prepend: [
            \App\Http\Middleware\ForceFileSessionForInstallation::class, // Force file sessions for installation routes
            \App\Http\Middleware\CheckInstallation::class, // Check if installation is needed (MUST run before HandleInertiaRequests)
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
            'track_security' => \App\Http\Middleware\TrackSecurityActivity::class,
            'session_expiry' => \App\Http\Middleware\CheckSessionExpiry::class, // Register alias
            'identify_domain' => \App\Http\Middleware\IdentifyDomainContext::class, // Domain context alias
            'require_tenant_onboarding' => \App\Http\Middleware\RequireTenantOnboarding::class, // Tenant onboarding check
            'check_installation' => \App\Http\Middleware\CheckInstallation::class, // Installation check
            // Super Admin Protection Middleware (Compliance: Section 13)
            'platform.super_admin' => \App\Http\Middleware\PlatformSuperAdmin::class,
            'tenant.super_admin' => \App\Http\Middleware\TenantSuperAdmin::class,
            'module' => \App\Http\Middleware\CheckModuleAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // =========================================================================
        // UNIFIED ERROR HANDLING PIPELINE
        // All exceptions are converted to a consistent JSON structure for Inertia/API
        // =========================================================================

        /**
         * Helper to check if request expects JSON/Inertia response
         */
        $expectsJson = fn ($request) => $request->expectsJson() ||
            $request->header('X-Inertia') ||
            $request->is('api/*') ||
            $request->ajax();

        /**
         * Helper to create unified error response
         */
        $createErrorResponse = function ($exception, $request, $httpCode, $errorType, $message) {
            try {
                $errorService = app(ErrorLogService::class);

                return $errorService->createErrorResponse($exception, $request);
            } catch (\Throwable $e) {
                // Fallback if service fails
                return [
                    'success' => false,
                    'error' => [
                        'code' => $httpCode,
                        'type' => $errorType,
                        'message' => $message,
                        'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                        'context' => [],
                    ],
                ];
            }
        };

        // =========================================================================
        // TENANT NOT FOUND ERRORS (Priority handling)
        // =========================================================================
        $exceptions->render(function (\Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedOnDomainException $e, $request) use ($expectsJson, $createErrorResponse) {
            $domain = $request->getHost();

            // Always return unified error response for tenant not found
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 404, 'TenantNotFoundException', 'Tenant not found');

                return response()->json($response, 404);
            }

            // For regular web requests, render the unified error page
            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 404,
                    'type' => 'TenantNotFoundException',
                    'title' => 'Tenant Not Found',
                    'message' => "The requested tenant could not be found on domain: {$domain}",
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => false,
                    'showRetryButton' => true,
                ],
            ])->toResponse($request)->setStatusCode(404);
        });

        $exceptions->render(function (\Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedById $e, $request) use ($expectsJson, $createErrorResponse) {
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 404, 'TenantNotFoundException', 'Tenant not found');

                return response()->json($response, 404);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 404,
                    'type' => 'TenantNotFoundException',
                    'title' => 'Tenant Not Found',
                    'message' => 'The requested tenant could not be identified.',
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => false,
                    'showRetryButton' => true,
                ],
            ])->toResponse($request)->setStatusCode(404);
        });

        // =========================================================================
        // AUTHENTICATION EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) use ($expectsJson, $createErrorResponse) {
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 401, 'AuthenticationException', 'Authentication required');

                return response()->json($response, 401);
            }

            // For Inertia requests - redirect to login
            if ($request->header('X-Inertia')) {
                return Inertia::location('/login');
            }

            return redirect()->guest('/login')
                ->with('status', 'Please login to access this page.')
                ->with('session_expired', true);
        });

        // =========================================================================
        // SESSION/TOKEN MISMATCH EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, $request) use ($expectsJson, $createErrorResponse) {
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 419, 'TokenMismatchException', 'Session expired');

                return response()->json($response, 419);
            }

            if ($request->header('X-Inertia')) {
                return Inertia::location('/login');
            }

            return redirect('/login')
                ->with('status', 'Your session has expired. Please login again.')
                ->with('session_expired', true);
        });

        // =========================================================================
        // VALIDATION EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) use ($expectsJson) {
            if ($expectsJson($request)) {
                try {
                    $errorService = app(ErrorLogService::class);
                    $errorLog = $errorService->logException($e, $request);

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 422,
                            'type' => 'ValidationException',
                            'message' => 'Validation failed',
                            'trace_id' => $errorLog->trace_id,
                            'context' => [
                                'validation_errors' => $e->errors(),
                            ],
                        ],
                        // Also include errors at root for Laravel Precognition compatibility
                        'errors' => $e->errors(),
                        'message' => $e->getMessage(),
                    ], 422);
                } catch (\Throwable) {
                    // Fallback
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 422,
                            'type' => 'ValidationException',
                            'message' => 'Validation failed',
                            'context' => ['validation_errors' => $e->errors()],
                        ],
                        'errors' => $e->errors(),
                        'message' => $e->getMessage(),
                    ], 422);
                }
            }

            // Let Laravel handle regular validation redirects
            return null;
        });

        // =========================================================================
        // AUTHORIZATION EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) use ($expectsJson, $createErrorResponse) {
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 403, 'AuthorizationException', 'Access denied');

                return response()->json($response, 403);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 403,
                    'type' => 'AuthorizationException',
                    'title' => 'Access Denied',
                    'message' => 'You do not have permission to perform this action.',
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => true,
                    'showRetryButton' => false,
                ],
            ])->toResponse($request)->setStatusCode(403);
        });

        // =========================================================================
        // MODEL NOT FOUND EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) use ($expectsJson, $createErrorResponse) {
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 404, 'ModelNotFoundException', 'Resource not found');

                return response()->json($response, 404);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 404,
                    'type' => 'ModelNotFoundException',
                    'title' => 'Not Found',
                    'message' => 'The requested resource could not be found.',
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => true,
                    'showRetryButton' => false,
                ],
            ])->toResponse($request)->setStatusCode(404);
        });

        // =========================================================================
        // HTTP NOT FOUND EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) use ($expectsJson, $createErrorResponse) {
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 404, 'NotFoundException', 'Page not found');

                return response()->json($response, 404);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 404,
                    'type' => 'NotFoundException',
                    'title' => 'Page Not Found',
                    'message' => 'The page you are looking for does not exist.',
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => true,
                    'showRetryButton' => false,
                ],
            ])->toResponse($request)->setStatusCode(404);
        });

        // =========================================================================
        // RATE LIMIT EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException $e, $request) use ($expectsJson, $createErrorResponse) {
            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 429, 'RateLimitException', 'Too many requests');

                return response()->json($response, 429);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 429,
                    'type' => 'RateLimitException',
                    'title' => 'Too Many Requests',
                    'message' => 'You have made too many requests. Please wait a moment and try again.',
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => false,
                    'showRetryButton' => true,
                    'retryAfter' => $e->getHeaders()['Retry-After'] ?? 60,
                ],
            ])->toResponse($request)->setStatusCode(429);
        });

        // =========================================================================
        // DATABASE EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) use ($expectsJson, $createErrorResponse) {
            // Log all database exceptions
            try {
                $errorService = app(ErrorLogService::class);
                $errorService->logException($e, $request, 'database');
            } catch (\Throwable) {
                \Illuminate\Support\Facades\Log::error('Database error', ['message' => $e->getMessage()]);
            }

            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 500, 'DatabaseException', 'A database error occurred');

                return response()->json($response, 500);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 500,
                    'type' => 'DatabaseException',
                    'title' => 'Database Error',
                    'message' => app()->environment('production')
                        ? 'A database error occurred. Our team has been notified.'
                        : $e->getMessage(),
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => true,
                    'showRetryButton' => true,
                ],
            ])->toResponse($request)->setStatusCode(500);
        });

        // =========================================================================
        // GENERIC HTTP EXCEPTIONS
        // =========================================================================
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) use ($expectsJson, $createErrorResponse) {
            $statusCode = $e->getStatusCode();

            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, $statusCode, 'HttpException', $e->getMessage() ?: 'An error occurred');

                return response()->json($response, $statusCode);
            }

            $titles = [
                400 => 'Bad Request',
                401 => 'Unauthorized',
                403 => 'Forbidden',
                404 => 'Not Found',
                405 => 'Method Not Allowed',
                500 => 'Server Error',
                502 => 'Bad Gateway',
                503 => 'Service Unavailable',
            ];

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => $statusCode,
                    'type' => 'HttpException',
                    'title' => $titles[$statusCode] ?? 'Error',
                    'message' => $e->getMessage() ?: 'An unexpected error occurred.',
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => true,
                    'showRetryButton' => $statusCode >= 500,
                ],
            ])->toResponse($request)->setStatusCode($statusCode);
        });

        // =========================================================================
        // CATCH-ALL: ANY OTHER THROWABLE
        // =========================================================================
        $exceptions->render(function (\Throwable $e, $request) use ($expectsJson, $createErrorResponse) {
            // Log all unhandled exceptions
            try {
                $errorService = app(ErrorLogService::class);
                $errorService->logException($e, $request);
            } catch (\Throwable) {
                \Illuminate\Support\Facades\Log::error('Unhandled exception', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            if ($expectsJson($request)) {
                $response = $createErrorResponse($e, $request, 500, 'ServerException', 'An internal error occurred');

                return response()->json($response, 500);
            }

            return Inertia::render('Errors/UnifiedError', [
                'error' => [
                    'code' => 500,
                    'type' => 'ServerException',
                    'title' => 'Server Error',
                    'message' => app()->environment('production')
                        ? 'An internal error occurred. Our team has been notified.'
                        : $e->getMessage(),
                    'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'showHomeButton' => true,
                    'showRetryButton' => true,
                    'debug' => app()->environment('local') ? [
                        'exception' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ] : null,
                ],
            ])->toResponse($request)->setStatusCode(500);
        });
    })->create();
