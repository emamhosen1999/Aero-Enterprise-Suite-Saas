<?php

namespace Aero\Platform\Services\Notification;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FcmNotificationService
{
    protected $messaging;

    public function __construct()
    {
        $this->messaging = app('firebase.messaging');
    }

    /**
     * Send a notification to a specific device
     *
     * @param  string  $deviceToken
     * @param  string  $title
     * @param  string  $body
     * @param  array  $data
     * @return bool
     */
    public function sendNotification($deviceToken, $title, $body, $data = [])
    {
        Log::info('Sending FCM notification', [
            'device_token' => $deviceToken,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        if (empty($deviceToken)) {
            Log::error('FCM Notification Error: Device token is empty');

            return false;
        }

        try {
            // Create notification
            $notification = Notification::create($title, $body);

            // Create message
            $message = CloudMessage::withTarget('token', $deviceToken)
                ->withNotification($notification)
                ->withData($data)
                ->withDefaultSounds()
                ->withHighPriority()
                ->withApnsConfig([
                    'headers' => [
                        'apns-priority' => '10',
                    ],
                    'payload' => [
                        'aps' => [
                            'content-available' => 1,
                        ],
                    ],
                ]);

            // Send the message
            $response = $this->messaging->send($message);

            Log::debug('FCM Notification Sent', [
                'message_id' => $response,
                'fcm_token' => $deviceToken,
            ]);

            return true;

        } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
            // Handle invalid/expired tokens
            $this->handleInvalidToken($deviceToken);
            Log::error('FCM Token not found or invalid', [
                'fcm_token' => $deviceToken,
                'error' => $e->getMessage(),
            ]);

            return false;

        } catch (\Kreait\Firebase\Exception\Messaging\InvalidMessage $e) {
            Log::error('FCM Invalid Message', [
                'fcm_token' => $deviceToken,
                'error' => $e->getMessage(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('FCM Notification Error', [
                'fcm_token' => $deviceToken,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Send a multicast notification to multiple devices
     */
    public function sendMulticastNotification(array $deviceTokens, string $title, string $body, array $data = []): array
    {
        if (empty($deviceTokens)) {
            return [];
        }

        try {
            $notification = Notification::create($title, $body);

            $message = CloudMessage::new()
                ->withNotification($notification)
                ->withData($data)
                ->withDefaultSounds()
                ->withHighPriority();

            $report = $this->messaging->sendMulticast($message, $deviceTokens);

            return [
                'successful' => $report->successes()->count(),
                'failed' => $report->failures()->count(),
                'invalid_tokens' => $report->invalidTokens(),
            ];

        } catch (\Exception $e) {
            Log::error('FCM Multicast Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'successful' => 0,
                'failed' => count($deviceTokens),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Handle invalid/expired FCM tokens
     *
     * @param  string  $deviceToken
     * @return void
     */
    protected function handleInvalidToken($deviceToken)
    {
        Log::warning('Invalid FCM token detected', [
            'fcm_token' => $deviceToken,
            'action' => 'Token should be removed from database',
        ]);

        // Example: Remove the token from your database
        // User::where('fcm_token', $deviceToken)->update(['fcm_token' => null]);
    }
}
