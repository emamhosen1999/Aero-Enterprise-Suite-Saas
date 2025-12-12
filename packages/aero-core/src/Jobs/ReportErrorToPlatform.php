<?php

namespace Aero\Core\Jobs;

use Aero\Core\Services\PlatformErrorReporter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ReportErrorToPlatform Job
 *
 * Queued job to send error reports to the central Aero platform.
 * Used in standalone mode to avoid blocking the request.
 */
class ReportErrorToPlatform implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 10;

    /**
     * The error payload to send
     */
    protected array $payload;

    /**
     * Create a new job instance.
     */
    public function __construct(array $payload)
    {
        $this->payload = $payload;
        $this->onQueue('error-reporting');
    }

    /**
     * Execute the job.
     */
    public function handle(PlatformErrorReporter $reporter): void
    {
        $success = $reporter->sendToApi($this->payload);

        if (!$success) {
            Log::warning('Failed to send error to platform API', [
                'trace_id' => $this->payload['trace_id'] ?? 'unknown',
                'attempt' => $this->attempts(),
            ]);

            // Release back to queue for retry if not at max attempts
            if ($this->attempts() < $this->tries) {
                $this->release($this->backoff);
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Error reporting job failed permanently', [
            'trace_id' => $this->payload['trace_id'] ?? 'unknown',
            'error' => $exception->getMessage(),
        ]);
    }
}
