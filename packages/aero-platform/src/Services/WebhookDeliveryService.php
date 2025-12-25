<?php

namespace Aero\Platform\Services;

use Aero\Platform\Models\Webhook;
use Aero\Platform\Models\WebhookLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Webhook Delivery Service
 * 
 * Handles webhook delivery with retry logic, timeout, and logging
 */
class WebhookDeliveryService
{
    /**
     * Deliver webhook payload
     *
     * @param Webhook $webhook
     * @param array $payload
     * @param string $event
     * @return array
     */
    public function deliver(Webhook $webhook, array $payload, string $event): array
    {
        if (!$webhook->is_active) {
            return [
                'success' => false,
                'message' => 'Webhook is not active',
            ];
        }

        $startTime = microtime(true);
        $attempt = 1;
        $maxAttempts = $webhook->retry_attempts ?? 3;
        $timeout = $webhook->timeout ?? 30;

        while ($attempt <= $maxAttempts) {
            try {
                $response = $this->sendRequest($webhook, $payload, $timeout);
                $duration = round((microtime(true) - $startTime) * 1000, 2);

                if ($response['success']) {
                    $this->logDelivery($webhook, $event, $payload, $response, $attempt, $duration, true);
                    $this->updateWebhookStats($webhook, true);
                    
                    return [
                        'success' => true,
                        'status_code' => $response['status_code'],
                        'response' => $response['body'],
                        'duration_ms' => $duration,
                        'attempts' => $attempt,
                    ];
                }

                // Retry on 5xx errors or network issues
                if ($attempt < $maxAttempts && $this->shouldRetry($response)) {
                    $this->sleep($attempt);
                    $attempt++;
                    continue;
                }

                // Failed after all attempts
                $this->logDelivery($webhook, $event, $payload, $response, $attempt, $duration, false);
                $this->updateWebhookStats($webhook, false);

                return [
                    'success' => false,
                    'status_code' => $response['status_code'] ?? 0,
                    'error' => $response['error'] ?? 'Unknown error',
                    'attempts' => $attempt,
                ];

            } catch (Exception $e) {
                Log::error("Webhook delivery exception: {$e->getMessage()}", [
                    'webhook_id' => $webhook->id,
                    'attempt' => $attempt,
                ]);

                if ($attempt >= $maxAttempts) {
                    $duration = round((microtime(true) - $startTime) * 1000, 2);
                    $this->logDelivery($webhook, $event, $payload, [
                        'success' => false,
                        'error' => $e->getMessage(),
                    ], $attempt, $duration, false);
                    $this->updateWebhookStats($webhook, false);

                    return [
                        'success' => false,
                        'error' => $e->getMessage(),
                        'attempts' => $attempt,
                    ];
                }

                $this->sleep($attempt);
                $attempt++;
            }
        }

        return [
            'success' => false,
            'error' => 'Max retry attempts exceeded',
            'attempts' => $maxAttempts,
        ];
    }

    /**
     * Send HTTP request to webhook URL
     *
     * @param Webhook $webhook
     * @param array $payload
     * @param int $timeout
     * @return array
     */
    protected function sendRequest(Webhook $webhook, array $payload, int $timeout): array
    {
        try {
            $headers = array_merge(
                $webhook->headers ?? [],
                [
                    'Content-Type' => 'application/json',
                    'User-Agent' => 'Aero-Webhook/1.0',
                    'X-Webhook-Signature' => $this->generateSignature($webhook->secret, $payload),
                ]
            );

            $response = Http::timeout($timeout)
                ->withHeaders($headers)
                ->post($webhook->url, $payload);

            return [
                'success' => $response->successful(),
                'status_code' => $response->status(),
                'body' => $response->body(),
                'headers' => $response->headers(),
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'status_code' => 0,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generate HMAC signature for webhook payload
     *
     * @param string|null $secret
     * @param array $payload
     * @return string
     */
    protected function generateSignature(?string $secret, array $payload): string
    {
        if (!$secret) {
            return '';
        }

        return hash_hmac('sha256', json_encode($payload), $secret);
    }

    /**
     * Determine if request should be retried
     *
     * @param array $response
     * @return bool
     */
    protected function shouldRetry(array $response): bool
    {
        $statusCode = $response['status_code'] ?? 0;
        
        // Retry on 5xx errors or network issues
        return $statusCode === 0 || $statusCode >= 500;
    }

    /**
     * Exponential backoff sleep
     *
     * @param int $attempt
     * @return void
     */
    protected function sleep(int $attempt): void
    {
        // Exponential backoff: 1s, 2s, 4s, 8s, etc.
        $seconds = pow(2, $attempt - 1);
        sleep(min($seconds, 60)); // Cap at 60 seconds
    }

    /**
     * Log webhook delivery attempt
     *
     * @param Webhook $webhook
     * @param string $event
     * @param array $payload
     * @param array $response
     * @param int $attempt
     * @param float $duration
     * @param bool $success
     * @return void
     */
    protected function logDelivery(
        Webhook $webhook,
        string $event,
        array $payload,
        array $response,
        int $attempt,
        float $duration,
        bool $success
    ): void {
        WebhookLog::create([
            'webhook_id' => $webhook->id,
            'event' => $event,
            'payload' => $payload,
            'response_status' => $response['status_code'] ?? null,
            'response_body' => $response['body'] ?? $response['error'] ?? null,
            'attempt' => $attempt,
            'duration_ms' => $duration,
            'success' => $success,
            'error_message' => $response['error'] ?? null,
        ]);
    }

    /**
     * Update webhook statistics
     *
     * @param Webhook $webhook
     * @param bool $success
     * @return void
     */
    protected function updateWebhookStats(Webhook $webhook, bool $success): void
    {
        if ($success) {
            $webhook->increment('success_count');
        } else {
            $webhook->increment('failure_count');
        }

        $webhook->update(['last_triggered_at' => now()]);
    }

    /**
     * Test webhook with sample payload
     *
     * @param Webhook $webhook
     * @return array
     */
    public function test(Webhook $webhook): array
    {
        $samplePayload = [
            'event' => 'test.webhook',
            'timestamp' => now()->toIso8601String(),
            'data' => [
                'message' => 'This is a test webhook from Aero Platform',
                'webhook_id' => $webhook->id,
                'webhook_name' => $webhook->name,
            ],
        ];

        return $this->deliver($webhook, $samplePayload, 'test.webhook');
    }
}
