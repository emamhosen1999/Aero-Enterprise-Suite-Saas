<?php

namespace Aero\Platform\Services;

use Aero\Platform\Models\Webhook;
use Aero\Platform\Jobs\ProcessWebhookDeliveryJob;
use Illuminate\Support\Facades\Log;

/**
 * Webhook Event Dispatcher
 * 
 * Dispatches events to registered webhooks
 */
class WebhookEventDispatcher
{
    protected WebhookDeliveryService $deliveryService;

    public function __construct(WebhookDeliveryService $deliveryService)
    {
        $this->deliveryService = $deliveryService;
    }

    /**
     * Dispatch event to all matching webhooks
     *
     * @param string $event Event name (e.g., 'subscription.created')
     * @param array $payload Event payload data
     * @param bool $async Whether to dispatch asynchronously
     * @return array
     */
    public function dispatch(string $event, array $payload, bool $async = true): array
    {
        $webhooks = $this->getWebhooksForEvent($event);

        if ($webhooks->isEmpty()) {
            Log::info("No webhooks registered for event: {$event}");
            return [
                'dispatched' => 0,
                'message' => 'No webhooks registered for this event',
            ];
        }

        $payload = $this->enrichPayload($payload, $event);

        $dispatched = 0;
        foreach ($webhooks as $webhook) {
            if ($async) {
                ProcessWebhookDeliveryJob::dispatch($webhook, $payload, $event);
            } else {
                $this->deliveryService->deliver($webhook, $payload, $event);
            }
            $dispatched++;
        }

        Log::info("Dispatched event '{$event}' to {$dispatched} webhook(s)");

        return [
            'dispatched' => $dispatched,
            'message' => "Event dispatched to {$dispatched} webhook(s)",
            'async' => $async,
        ];
    }

    /**
     * Get webhooks that are subscribed to a specific event
     *
     * @param string $event
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function getWebhooksForEvent(string $event)
    {
        return Webhook::where('is_active', true)
            ->whereJsonContains('events', $event)
            ->orWhere('events', 'like', '%' . $event . '%')
            ->get();
    }

    /**
     * Enrich payload with metadata
     *
     * @param array $payload
     * @param string $event
     * @return array
     */
    protected function enrichPayload(array $payload, string $event): array
    {
        return array_merge([
            'event' => $event,
            'timestamp' => now()->toIso8601String(),
            'version' => '1.0',
        ], $payload);
    }

    /**
     * Dispatch multiple events in batch
     *
     * @param array $events Array of ['event' => 'name', 'payload' => [...]]
     * @param bool $async
     * @return array
     */
    public function dispatchBatch(array $events, bool $async = true): array
    {
        $totalDispatched = 0;

        foreach ($events as $eventData) {
            $result = $this->dispatch(
                $eventData['event'],
                $eventData['payload'] ?? [],
                $async
            );
            $totalDispatched += $result['dispatched'];
        }

        return [
            'total_events' => count($events),
            'total_dispatched' => $totalDispatched,
            'message' => "Batch dispatch completed: {$totalDispatched} webhook(s) triggered",
        ];
    }

    /**
     * Get available event types
     *
     * @return array
     */
    public function getAvailableEvents(): array
    {
        return [
            'subscription' => [
                'subscription.created',
                'subscription.updated',
                'subscription.cancelled',
                'subscription.renewed',
                'subscription.upgraded',
                'subscription.downgraded',
            ],
            'payment' => [
                'payment.succeeded',
                'payment.failed',
                'payment.refunded',
            ],
            'quota' => [
                'quota.warning',
                'quota.exceeded',
                'quota.reset',
            ],
            'tenant' => [
                'tenant.created',
                'tenant.updated',
                'tenant.suspended',
                'tenant.activated',
                'tenant.deleted',
            ],
            'user' => [
                'user.created',
                'user.updated',
                'user.deleted',
                'user.invited',
            ],
        ];
    }
}
