<?php

namespace Aero\Platform\Jobs;

use Aero\Platform\Models\Webhook;
use Aero\Platform\Services\WebhookDeliveryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Process Webhook Delivery Job
 * 
 * Asynchronously delivers webhooks to registered endpoints
 */
class ProcessWebhookDeliveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Webhook $webhook,
        public array $payload,
        public string $event
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WebhookDeliveryService $deliveryService): void
    {
        try {
            Log::info("Processing webhook delivery", [
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
            ]);

            $result = $deliveryService->deliver($this->webhook, $this->payload, $this->event);

            if (!$result['success']) {
                Log::warning("Webhook delivery failed", [
                    'webhook_id' => $this->webhook->id,
                    'event' => $this->event,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Webhook delivery job exception: {$e->getMessage()}", [
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e; // Re-throw to trigger retry
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Webhook delivery job failed permanently", [
            'webhook_id' => $this->webhook->id,
            'event' => $this->event,
            'exception' => $exception->getMessage(),
        ]);

        // Update webhook failure stats
        $this->webhook->increment('failure_count');
    }
}
