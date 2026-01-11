<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Services\HrmNotificationChannelResolver;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Base HRM Notification
 *
 * All HRM notifications extend this class to get:
 * - Preference-aware channel resolution
 * - Common FCM and SMS channel support
 * - Consistent queue configuration
 *
 * This class has no dependency on aero-core package.
 */
abstract class BaseHrmNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The notification event type for preference lookup.
     */
    protected string $eventType = '';

    /**
     * Retry settings.
     */
    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        $resolver = app(HrmNotificationChannelResolver::class);

        return $resolver->resolve($notifiable, $this->eventType);
    }

    /**
     * Get the FCM representation of the notification.
     *
     * @return array{title: string, body: string, data: array}
     */
    public function toFcm(object $notifiable): array
    {
        return [
            'title' => $this->getFcmTitle(),
            'body' => $this->getFcmBody(),
            'data' => $this->getFcmData(),
        ];
    }

    /**
     * Get the SMS representation of the notification.
     */
    public function toSms(object $notifiable): string
    {
        return $this->getSmsMessage();
    }

    /**
     * Get FCM notification title.
     */
    abstract protected function getFcmTitle(): string;

    /**
     * Get FCM notification body.
     */
    abstract protected function getFcmBody(): string;

    /**
     * Get FCM notification data payload.
     */
    protected function getFcmData(): array
    {
        return [
            'type' => $this->eventType,
            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
        ];
    }

    /**
     * Get SMS message content.
     */
    protected function getSmsMessage(): string
    {
        return $this->getFcmBody();
    }

    /**
     * Handle a failed notification.
     */
    public function failed(\Throwable $exception): void
    {
        \Illuminate\Support\Facades\Log::error("HRM Notification failed: {$this->eventType}", [
            'exception' => $exception->getMessage(),
            'notification' => static::class,
        ]);
    }
}
