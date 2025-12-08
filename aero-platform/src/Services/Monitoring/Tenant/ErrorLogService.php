<?php

namespace Aero\Platform\Services\Monitoring\Tenant;

use Aero\Platform\Models\ErrorLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * ErrorLogService
 *
 * Unified service for logging errors from both backend and frontend.
 * All errors flow through this service to maintain consistency.
 */
class ErrorLogService
{
    /**
     * Sensitive fields to redact from payloads
     */
    private array $sensitiveFields = [
        'password', 'password_confirmation', 'current_password',
        'token', 'api_token', 'access_token', 'refresh_token',
        'secret', 'api_secret', 'client_secret', 'bearer',
        'credit_card', 'card_number', 'cvv', 'cvc', 'card_cvc',
        'ssn', 'social_security', 'pin',
        'authorization', 'cookie', 'session',
    ];

    /**
     * Log a backend exception
     */
    public function logException(
        Throwable $exception,
        ?Request $request = null,
        ?string $module = null,
        array $additionalContext = []
    ): ErrorLog {
        $request = $request ?? request();
        $traceId = (string) Str::uuid();

        try {
            $errorLog = ErrorLog::create([
                'trace_id' => $traceId,
                'tenant_id' => $this->getTenantId(),
                'user_id' => $this->getUserId(),
                'error_type' => $this->getExceptionType($exception),
                'http_code' => $this->getHttpCode($exception),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
                'request_payload' => $this->sanitizePayload($request->all()),
                'error_message' => $exception->getMessage(),
                'stack_trace' => $exception->getTraceAsString(),
                'origin' => 'backend',
                'module' => $module ?? $this->detectModule($request),
                'component' => null,
                'context' => array_merge([
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'exception_class' => get_class($exception),
                ], $additionalContext),
                'user_agent' => $request->userAgent(),
                'ip_address' => $request->ip(),
            ]);

            // Also log to Laravel's standard logging
            Log::error('Error logged', [
                'trace_id' => $traceId,
                'error_type' => $this->getExceptionType($exception),
                'message' => $exception->getMessage(),
            ]);

            return $errorLog;
        } catch (Throwable $e) {
            // If logging fails, at least log to file
            Log::critical('Failed to log error to database', [
                'original_error' => $exception->getMessage(),
                'logging_error' => $e->getMessage(),
            ]);

            // Return a mock ErrorLog for response purposes
            return new ErrorLog([
                'trace_id' => $traceId,
                'error_type' => $this->getExceptionType($exception),
                'http_code' => $this->getHttpCode($exception),
                'error_message' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Log a frontend error (from API call)
     */
    public function logFrontendError(array $data): ErrorLog
    {
        $traceId = $data['trace_id'] ?? (string) Str::uuid();

        try {
            return ErrorLog::create([
                'trace_id' => $traceId,
                'tenant_id' => $this->getTenantId(),
                'user_id' => $this->getUserId(),
                'error_type' => $data['error_type'] ?? 'FrontendError',
                'http_code' => $data['http_code'] ?? 0,
                'request_method' => $data['request_method'] ?? request()->method(),
                'request_url' => $data['url'] ?? request()->fullUrl(),
                'request_payload' => $this->sanitizePayload($data['payload'] ?? []),
                'error_message' => $data['message'] ?? 'Unknown frontend error',
                'stack_trace' => $data['stack'] ?? null,
                'origin' => 'frontend',
                'module' => $data['module'] ?? null,
                'component' => $data['component'] ?? null,
                'context' => [
                    'component_stack' => $data['component_stack'] ?? null,
                    'user_agent' => request()->userAgent(),
                    'viewport' => $data['viewport'] ?? null,
                    'referrer' => $data['referrer'] ?? null,
                ],
                'user_agent' => request()->userAgent(),
                'ip_address' => request()->ip(),
            ]);
        } catch (Throwable $e) {
            Log::critical('Failed to log frontend error', [
                'error' => $e->getMessage(),
                'frontend_error' => $data['message'] ?? 'Unknown',
            ]);

            return new ErrorLog(['trace_id' => $traceId]);
        }
    }

    /**
     * Create unified error response structure
     */
    public function createErrorResponse(
        Throwable $exception,
        ?Request $request = null,
        ?string $module = null
    ): array {
        $errorLog = $this->logException($exception, $request, $module);

        return [
            'success' => false,
            'error' => [
                'code' => $errorLog->http_code,
                'type' => $errorLog->error_type,
                'message' => $this->getPublicMessage($exception, $errorLog->http_code),
                'trace_id' => $errorLog->trace_id,
                'context' => $this->getPublicContext($exception),
            ],
        ];
    }

    /**
     * Get user-friendly error message
     */
    public function getPublicMessage(Throwable $exception, int $httpCode): string
    {
        // In production, hide internal error details
        if (app()->environment('production')) {
            return match ($httpCode) {
                400 => 'Bad request. Please check your input.',
                401 => 'Authentication required. Please log in.',
                403 => 'You do not have permission to perform this action.',
                404 => 'The requested resource was not found.',
                419 => 'Your session has expired. Please refresh the page.',
                422 => 'Validation failed. Please check your input.',
                429 => 'Too many requests. Please try again later.',
                500, 501, 502, 503 => 'An internal error occurred. Our team has been notified.',
                default => 'Something went wrong. Please try again.',
            };
        }

        // In development, show actual message
        return $exception->getMessage() ?: 'An unexpected error occurred.';
    }

    /**
     * Get public-safe context (for validation errors, etc.)
     */
    private function getPublicContext(Throwable $exception): array
    {
        // For validation exceptions, include field errors
        if ($exception instanceof \Illuminate\Validation\ValidationException) {
            return [
                'validation_errors' => $exception->errors(),
            ];
        }

        // For model not found
        if ($exception instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            return [
                'model' => class_basename($exception->getModel()),
            ];
        }

        return [];
    }

    /**
     * Get the HTTP status code for an exception
     */
    public function getHttpCode(Throwable $exception): int
    {
        // Handle specific exception types
        return match (true) {
            $exception instanceof \Illuminate\Validation\ValidationException => 422,
            $exception instanceof \Illuminate\Auth\AuthenticationException => 401,
            $exception instanceof \Illuminate\Auth\Access\AuthorizationException => 403,
            $exception instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 404,
            $exception instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 404,
            $exception instanceof \Illuminate\Session\TokenMismatchException => 419,
            $exception instanceof \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException => 429,
            $exception instanceof \Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedOnDomainException => 404,
            $exception instanceof \Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedById => 404,
            $exception instanceof \Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedByPathException => 404,
            $exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException => $exception->getStatusCode(),
            default => 500,
        };
    }

    /**
     * Get a friendly exception type name
     */
    private function getExceptionType(Throwable $exception): string
    {
        return match (true) {
            $exception instanceof \Illuminate\Validation\ValidationException => 'ValidationException',
            $exception instanceof \Illuminate\Auth\AuthenticationException => 'AuthenticationException',
            $exception instanceof \Illuminate\Auth\Access\AuthorizationException => 'AuthorizationException',
            $exception instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 'ModelNotFoundException',
            $exception instanceof \Illuminate\Database\QueryException => 'DatabaseException',
            $exception instanceof \Illuminate\Session\TokenMismatchException => 'TokenMismatchException',
            $exception instanceof \Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedOnDomainException => 'TenantNotFoundException',
            $exception instanceof \Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedById => 'TenantNotFoundException',
            $exception instanceof \Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedByPathException => 'TenantNotFoundException',
            $exception instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 'NotFoundException',
            $exception instanceof \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException => 'RateLimitException',
            $exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException => 'HttpException',
            default => class_basename($exception),
        };
    }

    /**
     * Get current tenant ID if available
     */
    private function getTenantId(): ?string
    {
        try {
            if (function_exists('tenant') && tenant()) {
                return tenant()->id;
            }
        } catch (Throwable) {
            // Tenant not initialized
        }

        return null;
    }

    /**
     * Get current user ID if available
     */
    private function getUserId(): ?int
    {
        try {
            // Try landlord guard first (platform admin)
            if (Auth::guard('landlord')->check()) {
                return Auth::guard('landlord')->id();
            }
            // Then try web guard (tenant user)
            if (Auth::guard('web')->check()) {
                return Auth::guard('web')->id();
            }
        } catch (Throwable) {
            // Auth not available
        }

        return null;
    }

    /**
     * Detect module from request path
     */
    private function detectModule(?Request $request): ?string
    {
        if (! $request) {
            return null;
        }

        $path = $request->path();
        $segments = explode('/', $path);

        // Skip 'api' prefix if present
        if (($segments[0] ?? '') === 'api') {
            array_shift($segments);
        }

        // Return first meaningful segment as module
        return $segments[0] ?? null;
    }

    /**
     * Sanitize payload by removing sensitive data
     */
    private function sanitizePayload(array $data): array
    {
        return $this->recursiveSanitize($data);
    }

    /**
     * Recursively sanitize array data
     */
    private function recursiveSanitize(array $data): array
    {
        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            // Check if key contains sensitive field name
            $isSensitive = false;
            foreach ($this->sensitiveFields as $field) {
                if (str_contains($lowerKey, $field)) {
                    $isSensitive = true;
                    break;
                }
            }

            if ($isSensitive) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->recursiveSanitize($value);
            } elseif (is_string($value) && strlen($value) > 1000) {
                // Truncate very long strings
                $data[$key] = substr($value, 0, 1000).'... [TRUNCATED]';
            }
        }

        return $data;
    }

    /**
     * Get error statistics for dashboard
     */
    public function getStatistics(?string $tenantId = null, int $days = 7): array
    {
        $query = ErrorLog::query()
            ->where('created_at', '>=', now()->subDays($days));

        if ($tenantId) {
            $query->forTenant($tenantId);
        }

        $total = $query->count();
        $unresolved = (clone $query)->unresolved()->count();
        $serverErrors = (clone $query)->serverErrors()->count();
        $clientErrors = (clone $query)->clientErrors()->count();
        $frontendErrors = (clone $query)->frontend()->count();
        $backendErrors = (clone $query)->backend()->count();

        $byType = ErrorLog::query()
            ->where('created_at', '>=', now()->subDays($days))
            ->when($tenantId, fn ($q) => $q->forTenant($tenantId))
            ->selectRaw('error_type, COUNT(*) as count')
            ->groupBy('error_type')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'error_type')
            ->toArray();

        $byDay = ErrorLog::query()
            ->where('created_at', '>=', now()->subDays($days))
            ->when($tenantId, fn ($q) => $q->forTenant($tenantId))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        return [
            'total' => $total,
            'unresolved' => $unresolved,
            'resolved' => $total - $unresolved,
            'server_errors' => $serverErrors,
            'client_errors' => $clientErrors,
            'frontend_errors' => $frontendErrors,
            'backend_errors' => $backendErrors,
            'by_type' => $byType,
            'by_day' => $byDay,
        ];
    }
}
