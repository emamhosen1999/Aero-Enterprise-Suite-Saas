<?php

namespace Aero\Core\Services;

use Aero\Core\Jobs\ReportErrorToPlatform;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * PlatformErrorReporter
 *
 * Reports errors from tenant/standalone installations to the central Aero platform.
 * All errors are sent via API to platform.aerosuite.com for:
 * - Centralized monitoring across all installations
 * - Product improvement and bug tracking
 * - Proactive customer support
 *
 * Works in two modes:
 * - SaaS mode: Stores directly in central database (same codebase)
 * - Standalone mode: Sends via HTTP API to platform
 *
 * @package Aero\Core\Services
 */
class PlatformErrorReporter
{
    protected array $config;

    protected ?string $traceId = null;

    public function __construct()
    {
        $this->config = config('aero.error_reporting', []);
    }

    /**
     * Check if error reporting is enabled
     */
    public function isEnabled(): bool
    {
        return ($this->config['enabled'] ?? true) && !empty($this->config['license_key'] ?? '');
    }

    /**
     * Report a backend exception to the platform
     */
    public function reportException(
        Throwable $exception,
        ?Request $request = null,
        ?string $module = null,
        array $additionalContext = []
    ): ?string {
        if (!$this->isEnabled()) {
            return null;
        }

        if (!$this->shouldReport($exception)) {
            return null;
        }

        $request = $request ?? request();
        $this->traceId = (string) Str::uuid();

        $payload = $this->buildPayload($exception, $request, $module, $additionalContext);

        // Send async or sync based on config
        if ($this->config['async'] ?? true) {
            $this->sendAsync($payload);
        } else {
            $this->sendSync($payload);
        }

        // Send email notification for critical errors
        $this->notifyAdminIfNeeded($payload);

        return $this->traceId;
    }

    /**
     * Report a frontend error to the platform
     */
    public function reportFrontendError(array $errorData): ?string
    {
        if (!$this->isEnabled()) {
            return null;
        }

        $this->traceId = $errorData['trace_id'] ?? (string) Str::uuid();

        $payload = [
            'trace_id' => $this->traceId,
            'license_key' => $this->config['license_key'],
            'source_domain' => request()->getHost(),
            'source_url' => request()->fullUrl(),
            'origin' => 'frontend',
            'error_type' => $errorData['error_type'] ?? 'FrontendError',
            'http_code' => $errorData['http_code'] ?? 0,
            'error_message' => $errorData['message'] ?? 'Unknown frontend error',
            'stack_trace' => $errorData['stack'] ?? null,
            'module' => $errorData['module'] ?? null,
            'component' => $errorData['component'] ?? null,
            'request_method' => request()->method(),
            'request_url' => $errorData['url'] ?? request()->fullUrl(),
            'user_agent' => request()->userAgent(),
            'context' => [
                'component_stack' => $errorData['component_stack'] ?? null,
                'viewport' => $errorData['viewport'] ?? null,
                'referrer' => $errorData['referrer'] ?? null,
            ],
            'environment' => $this->getEnvironmentInfo(),
            'timestamp' => now()->toIso8601String(),
        ];

        if ($this->config['async'] ?? true) {
            $this->sendAsync($payload);
        } else {
            $this->sendSync($payload);
        }

        return $this->traceId;
    }

    /**
     * Build the error payload
     */
    protected function buildPayload(
        Throwable $exception,
        Request $request,
        ?string $module,
        array $additionalContext
    ): array {
        return [
            'trace_id' => $this->traceId,
            'license_key' => $this->config['license_key'],
            'source_domain' => $request->getHost(),
            'source_url' => $request->fullUrl(),
            'origin' => 'backend',
            'error_type' => $this->getExceptionType($exception),
            'http_code' => $this->getHttpCode($exception),
            'error_message' => $exception->getMessage(),
            'stack_trace' => $this->sanitizeStackTrace($exception->getTraceAsString()),
            'module' => $module ?? $this->detectModule($request),
            'component' => null,
            'request_method' => $request->method(),
            'request_url' => $request->fullUrl(),
            'request_payload' => $this->sanitizePayload($request->all()),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
            'user_id' => $this->getUserId(),
            'tenant_id' => $this->getTenantId(),
            'context' => array_merge([
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'exception_class' => get_class($exception),
            ], $additionalContext),
            'environment' => $this->getEnvironmentInfo(),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Get environment information for debugging
     */
    protected function getEnvironmentInfo(): array
    {
        return [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'aero_mode' => config('aero.mode', 'standalone'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
        ];
    }

    /**
     * Check if this exception should be reported based on level config
     */
    protected function shouldReport(Throwable $exception): bool
    {
        $level = $this->config['level'] ?? 'all';
        $httpCode = $this->getHttpCode($exception);

        return match ($level) {
            'critical' => in_array($httpCode, [500, 502, 503]),
            'server_only' => $httpCode >= 500,
            'all' => $httpCode >= 400,
            default => true,
        };
    }

    /**
     * Send error report asynchronously via job queue
     */
    protected function sendAsync(array $payload): void
    {
        try {
            // In SaaS mode, store directly to database
            if (config('aero.mode') === 'saas') {
                $this->storeInCentralDatabase($payload);

                return;
            }

            // In standalone mode, dispatch job to send to platform API
            ReportErrorToPlatform::dispatch($payload)
                ->onQueue('error-reporting');
        } catch (Throwable $e) {
            Log::warning('Failed to queue error report', [
                'trace_id' => $this->traceId,
                'error' => $e->getMessage(),
            ]);

            // Fallback to sync if queue fails
            $this->sendSync($payload);
        }
    }

    /**
     * Send error report synchronously
     */
    protected function sendSync(array $payload): void
    {
        try {
            // In SaaS mode, store directly
            if (config('aero.mode') === 'saas') {
                $this->storeInCentralDatabase($payload);

                return;
            }

            // In standalone mode, send to platform API
            $this->sendToApi($payload);
        } catch (Throwable $e) {
            Log::error('Failed to send error report', [
                'trace_id' => $this->traceId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Store error directly in central database (SaaS mode)
     */
    protected function storeInCentralDatabase(array $payload): void
    {
        try {
            // Use the ErrorLog model from aero-platform
            $errorLogClass = 'Aero\\Platform\\Models\\ErrorLog';

            if (!class_exists($errorLogClass)) {
                Log::warning('ErrorLog model not found, falling back to API');
                $this->sendToApi($payload);

                return;
            }

            $errorLogClass::create([
                'trace_id' => $payload['trace_id'],
                'source_domain' => $payload['source_domain'],
                'license_key' => $payload['license_key'],
                'tenant_id' => $payload['tenant_id'] ?? null,
                'user_id' => $payload['user_id'] ?? null,
                'error_type' => $payload['error_type'],
                'http_code' => $payload['http_code'],
                'request_method' => $payload['request_method'],
                'request_url' => $payload['request_url'],
                'request_payload' => $payload['request_payload'],
                'error_message' => $payload['error_message'],
                'stack_trace' => $payload['stack_trace'],
                'origin' => $payload['origin'],
                'module' => $payload['module'],
                'component' => $payload['component'] ?? null,
                'context' => array_merge($payload['context'] ?? [], [
                    'environment' => $payload['environment'],
                ]),
                'user_agent' => $payload['user_agent'],
                'ip_address' => $payload['ip_address'] ?? null,
            ]);

            Log::info('Error logged to central database', ['trace_id' => $this->traceId]);
        } catch (Throwable $e) {
            Log::error('Failed to store error in central database', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send error to platform API (standalone mode)
     */
    public function sendToApi(array $payload): bool
    {
        $apiUrl = rtrim($this->config['api_url'] ?? 'https://platform.aerosuite.com/api/v1', '/');
        $timeout = $this->config['timeout'] ?? 5;
        $retryAttempts = $this->config['retry_attempts'] ?? 3;

        try {
            $response = Http::timeout($timeout)
                ->retry($retryAttempts, 100)
                ->withHeaders([
                    'X-Aero-License-Key' => $payload['license_key'],
                    'X-Aero-Source-Domain' => $payload['source_domain'],
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post("{$apiUrl}/error-logs", $payload);

            if ($response->successful()) {
                Log::info('Error reported to platform', ['trace_id' => $this->traceId]);

                return true;
            }

            Log::warning('Platform API rejected error report', [
                'trace_id' => $this->traceId,
                'status' => $response->status(),
            ]);

            return false;
        } catch (Throwable $e) {
            Log::error('Failed to send error to platform API', [
                'trace_id' => $this->traceId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send email notification for critical errors
     */
    protected function notifyAdminIfNeeded(array $payload): void
    {
        $notifyOn = $this->config['notify_on'] ?? [];
        $adminEmail = $this->config['admin_email'] ?? '';

        if (empty($adminEmail) || !in_array($payload['error_type'], $notifyOn)) {
            return;
        }

        try {
            MailService::make()
                ->to($adminEmail)
                ->subject("[Aero Error] {$payload['error_type']} from {$payload['source_domain']}")
                ->html($this->buildEmailHtml($payload))
                ->send();

            Log::info('Admin notified of error', ['trace_id' => $this->traceId]);
        } catch (Throwable $e) {
            Log::warning('Failed to send admin notification', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build HTML email for error notification
     */
    protected function buildEmailHtml(array $payload): string
    {
        $timestamp = $payload['timestamp'] ?? now()->toIso8601String();

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #DC2626;">🚨 Error Alert</h2>
            
            <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin-bottom: 16px;">
                <strong>Error Type:</strong> {$payload['error_type']}<br>
                <strong>HTTP Code:</strong> {$payload['http_code']}<br>
                <strong>Source:</strong> {$payload['source_domain']}
            </div>
            
            <h3>Error Message</h3>
            <p style="background: #F3F4F6; padding: 12px; border-radius: 4px;">
                {$payload['error_message']}
            </p>
            
            <h3>Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>URL:</strong></td><td>{$payload['request_url']}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Method:</strong></td><td>{$payload['request_method']}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Trace ID:</strong></td><td><code>{$payload['trace_id']}</code></td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Timestamp:</strong></td><td>{$timestamp}</td></tr>
            </table>
            
            <p style="margin-top: 24px; color: #6B7280; font-size: 12px;">
                This is an automated notification from Aero Suite Error Monitoring.
            </p>
        </div>
        HTML;
    }

    /**
     * Get HTTP status code for an exception
     */
    protected function getHttpCode(Throwable $exception): int
    {
        return match (true) {
            $exception instanceof \Illuminate\Validation\ValidationException => 422,
            $exception instanceof \Illuminate\Auth\AuthenticationException => 401,
            $exception instanceof \Illuminate\Auth\Access\AuthorizationException => 403,
            $exception instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 404,
            $exception instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 404,
            $exception instanceof \Illuminate\Session\TokenMismatchException => 419,
            $exception instanceof \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException => 429,
            $exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException => $exception->getStatusCode(),
            default => 500,
        };
    }

    /**
     * Get friendly exception type name
     */
    protected function getExceptionType(Throwable $exception): string
    {
        return match (true) {
            $exception instanceof \Illuminate\Validation\ValidationException => 'ValidationException',
            $exception instanceof \Illuminate\Auth\AuthenticationException => 'AuthenticationException',
            $exception instanceof \Illuminate\Auth\Access\AuthorizationException => 'AuthorizationException',
            $exception instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 'ModelNotFoundException',
            $exception instanceof \Illuminate\Database\QueryException => 'DatabaseException',
            $exception instanceof \Illuminate\Session\TokenMismatchException => 'TokenMismatchException',
            $exception instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 'NotFoundException',
            $exception instanceof \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException => 'RateLimitException',
            $exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException => 'HttpException',
            default => class_basename($exception),
        };
    }

    /**
     * Detect module from request path
     */
    protected function detectModule(?Request $request): ?string
    {
        if (!$request) {
            return null;
        }

        $path = $request->path();
        $segments = explode('/', $path);

        // Skip common prefixes
        $skipPrefixes = ['api', 'tenant', 'admin', 'platform'];
        while (!empty($segments) && in_array($segments[0], $skipPrefixes)) {
            array_shift($segments);
        }

        return $segments[0] ?? null;
    }

    /**
     * Get current tenant ID if available
     */
    protected function getTenantId(): ?string
    {
        try {
            if (function_exists('tenant') && tenant()) {
                return tenant()->id;
            }
        } catch (Throwable) {
        }

        return config('aero.standalone_tenant_id');
    }

    /**
     * Get current user ID if available
     */
    protected function getUserId(): ?int
    {
        try {
            if (auth('landlord')->check()) {
                return auth('landlord')->id();
            }
            if (auth('web')->check()) {
                return auth('web')->id();
            }
        } catch (Throwable) {
        }

        return null;
    }

    /**
     * Sanitize request payload (remove sensitive data)
     */
    protected function sanitizePayload(array $data): array
    {
        $redactFields = $this->config['redact_fields'] ?? [];

        return $this->sanitizeArray($data, $redactFields);
    }

    /**
     * Recursively sanitize array
     */
    protected function sanitizeArray(array $data, array $sensitiveKeys): array
    {
        foreach ($data as $key => $value) {
            $keyLower = strtolower($key);
            if (in_array($keyLower, array_map('strtolower', $sensitiveKeys))) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->sanitizeArray($value, $sensitiveKeys);
            }
        }

        return $data;
    }

    /**
     * Sanitize stack trace (remove sensitive paths if in production)
     */
    protected function sanitizeStackTrace(string $trace): string
    {
        if (config('app.env') === 'production') {
            // Replace full paths with relative paths
            $basePath = base_path();
            $trace = str_replace($basePath, '[APP]', $trace);
        }

        return $trace;
    }

    /**
     * Get the last generated trace ID
     */
    public function getTraceId(): ?string
    {
        return $this->traceId;
    }

    /**
     * Create unified error response for Inertia
     */
    public function createErrorResponse(
        Throwable $exception,
        ?Request $request = null
    ): array {
        $traceId = $this->reportException($exception, $request);
        $httpCode = $this->getHttpCode($exception);

        return [
            'code' => $httpCode,
            'type' => $this->getExceptionType($exception),
            'title' => $this->getErrorTitle($httpCode),
            'message' => $this->getPublicMessage($exception, $httpCode),
            'trace_id' => $traceId,
            'showHomeButton' => true,
            'showRetryButton' => $httpCode >= 500,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Get user-friendly error title
     */
    protected function getErrorTitle(int $httpCode): string
    {
        return match ($httpCode) {
            400 => 'Bad Request',
            401 => 'Authentication Required',
            403 => 'Access Denied',
            404 => 'Not Found',
            419 => 'Session Expired',
            422 => 'Validation Error',
            429 => 'Too Many Requests',
            500 => 'Server Error',
            502 => 'Bad Gateway',
            503 => 'Service Unavailable',
            default => 'Error',
        };
    }

    /**
     * Get user-friendly error message
     */
    protected function getPublicMessage(Throwable $exception, int $httpCode): string
    {
        if (config('app.env') !== 'production') {
            return $exception->getMessage() ?: 'An unexpected error occurred.';
        }

        return match ($httpCode) {
            400 => 'The request could not be processed. Please check your input.',
            401 => 'Please log in to continue.',
            403 => 'You do not have permission to perform this action.',
            404 => 'The requested resource was not found.',
            419 => 'Your session has expired. Please refresh the page and try again.',
            422 => 'Please check your input and try again.',
            429 => 'You have made too many requests. Please wait a moment.',
            500, 502, 503 => 'An error occurred. Our team has been notified and is working on it.',
            default => 'Something went wrong. Please try again later.',
        };
    }
}
