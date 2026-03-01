<?php

declare(strict_types=1);

namespace Aero\HRM\Services;

use Aero\HRM\Contracts\NotifiableUserInterface;
use Illuminate\Notifications\Notifiable;

/**
 * HRM Notification Channel Resolver
 *
 * Resolves which notification channels to use based on user preferences.
 * This service is HRM-specific and has no dependency on aero-core.
 *
 * It works with any user model that implements NotifiableUserInterface
 * or uses the standard Laravel Notifiable trait.
 */
class HrmNotificationChannelResolver
{
    /**
     * Default channel configuration for HRM notifications.
     */
    protected array $defaults = [
        // Leave notifications
        'leave_requested' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],
        'leave_approved' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],
        'leave_rejected' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],
        'leave_cancelled' => ['mail' => true, 'database' => true, 'fcm' => false, 'sms' => false],

        // Attendance notifications
        'late_arrival' => ['mail' => false, 'database' => true, 'fcm' => true, 'sms' => false],
        'punch_reminder' => ['mail' => false, 'database' => true, 'fcm' => true, 'sms' => false],

        // Payroll notifications
        'payslip_ready' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],
        'salary_credited' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => true],

        // Onboarding notifications
        'welcome_employee' => ['mail' => true, 'database' => true, 'fcm' => false, 'sms' => false],
        'onboarding_reminder' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],

        // Recruitment notifications
        'new_application' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],

        // Birthday & Anniversary
        'birthday_reminder' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],
        'work_anniversary' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],

        // Document expiry
        'document_expiring' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],

        // Performance
        'performance_review_due' => ['mail' => true, 'database' => true, 'fcm' => true, 'sms' => false],
    ];

    /**
     * Resolve channels for a notification.
     *
     * @param  object  $notifiable  The user receiving the notification
     * @param  string  $event  The notification event type
     * @return array<string> Array of channel names
     */
    public function resolve(object $notifiable, string $event): array
    {
        $channels = [];
        $defaults = $this->defaults[$event] ?? ['mail' => true, 'database' => true, 'fcm' => false, 'sms' => false];

        // Database channel is always included for in-app notifications
        $channels[] = 'database';

        // Check each channel
        if ($this->shouldUseChannel($notifiable, $event, 'mail', $defaults['mail'] ?? true)) {
            $channels[] = 'mail';
        }

        if ($this->shouldUseChannel($notifiable, $event, 'fcm', $defaults['fcm'] ?? false)) {
            // Only add FCM if user has device tokens
            if ($this->hasFcmTokens($notifiable)) {
                $channels[] = 'fcm';
            }
        }

        if ($this->shouldUseChannel($notifiable, $event, 'sms', $defaults['sms'] ?? false)) {
            // Only add SMS if user has phone number
            if ($this->hasPhoneNumber($notifiable)) {
                $channels[] = 'sms';
            }
        }

        return array_unique($channels);
    }

    /**
     * Check if a specific channel should be used.
     */
    protected function shouldUseChannel(object $notifiable, string $event, string $channel, bool $default): bool
    {
        // If user implements our interface, use their preferences
        if ($notifiable instanceof NotifiableUserInterface) {
            return $notifiable->wantsNotificationVia($event, $channel);
        }

        // Check for notification_preferences attribute (common pattern)
        if (method_exists($notifiable, 'getAttribute')) {
            $preferences = $notifiable->getAttribute('notification_preferences') ?? [];

            if (is_array($preferences)) {
                // Check nested structure: categories.leave.leave_approved.email
                foreach ($preferences as $category => $events) {
                    if (is_array($events) && isset($events[$event][$channel])) {
                        return (bool) $events[$event][$channel];
                    }
                }

                // Check flat structure: leave_approved.email
                if (isset($preferences[$event][$channel])) {
                    return (bool) $preferences[$event][$channel];
                }

                // Check channel-level disable
                if (isset($preferences['channels'][$channel])) {
                    return (bool) $preferences['channels'][$channel];
                }
            }
        }

        return $default;
    }

    /**
     * Check if user has FCM tokens.
     */
    protected function hasFcmTokens(object $notifiable): bool
    {
        if ($notifiable instanceof NotifiableUserInterface) {
            return count($notifiable->getFcmTokens()) > 0;
        }

        // Check for common attribute names
        if (method_exists($notifiable, 'getAttribute')) {
            $tokens = $notifiable->getAttribute('fcm_tokens')
                ?? $notifiable->getAttribute('device_tokens')
                ?? [];

            return is_array($tokens) && count($tokens) > 0;
        }

        // Check for relationship method
        if (method_exists($notifiable, 'deviceTokens')) {
            return $notifiable->deviceTokens()->exists();
        }

        return false;
    }

    /**
     * Check if user has phone number.
     */
    protected function hasPhoneNumber(object $notifiable): bool
    {
        if ($notifiable instanceof NotifiableUserInterface) {
            return $notifiable->getPhoneNumber() !== null;
        }

        if (method_exists($notifiable, 'getAttribute')) {
            $phone = $notifiable->getAttribute('phone')
                ?? $notifiable->getAttribute('phone_number')
                ?? $notifiable->getAttribute('mobile');

            return ! empty($phone);
        }

        return false;
    }

    /**
     * Get default configuration for an event.
     */
    public function getDefaults(string $event): array
    {
        return $this->defaults[$event] ?? ['mail' => true, 'database' => true, 'fcm' => false, 'sms' => false];
    }

    /**
     * Register custom defaults for an event.
     */
    public function setDefaults(string $event, array $channels): void
    {
        $this->defaults[$event] = $channels;
    }
}
