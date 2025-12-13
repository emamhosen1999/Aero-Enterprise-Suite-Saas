<?php

namespace Aero\Core\Exceptions;

use Aero\Core\Services\PlatformErrorReporter;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Unified Exception Handler
 *
 * Catches all backend exceptions and reports them to the platform API
 * while still maintaining Laravel's default error handling behavior.
 *
 * Features:
 * - Automatic error reporting to platform
 * - Context-aware (tenant/standalone/platform)
 * - Source information included
 * - Non-blocking (errors still work if reporting fails)
 */
class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Report to platform using PlatformErrorReporter service
            try {
                $reporter = app(PlatformErrorReporter::class);
                
                // Only report if enabled
                if ($reporter->isEnabled()) {
                    $traceId = $reporter->reportException($e);
                    
                    // Log locally for reference
                    if ($traceId) {
                        Log::debug("Exception reported to platform", [
                            'trace_id' => $traceId,
                            'type' => get_class($e),
                            'message' => $e->getMessage(),
                        ]);
                    }
                }
            } catch (\Throwable $reportError) {
                // Never let reporting break the application
                // Just log the failure silently
                Log::warning('Failed to report exception to platform', [
                    'error' => $reportError->getMessage(),
                    'original_exception' => get_class($e),
                ]);
            }
        });
    }
}
