<?php

declare(strict_types=1);

namespace Aero\Core\Services\Notification;

use Aero\Core\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Notification Preference Service
 *
 * Manages user notification preferences across channels and event types.
 *
 * Features:
 * - Per-user notification preferences
 * - Multiple channels (email, push, SMS, in-app)
 * - Quiet hours configuration
 * - Frequency controls (instant, daily, weekly)
 * - Category-based preferences
 *
 * Usage:
 * ```php
 * $prefService = app(NotificationPreferenceService::class);
 *
 * // Check if user wants email notifications for leave approvals
 * if ($prefService->shouldNotify($user, 'leave_approved', 'email')) {
 *     // Send email
 * }
 *
 * // Get all preferences for a user
 * $prefs = $prefService->getPreferences($user);
 *
 * // Update user preferences
 * $prefService->updatePreferences($user, [
 *     'email' => ['leave_approved' => true, 'leave_rejected' => true],
 *     'push' => ['leave_approved' => false],
 * ]);
 * ```
 */
class NotificationPreferenceService
{
    /**
     * Available notification channels.
     */
    public const CHANNELS = ['email', 'push', 'sms', 'in_app'];

    /**
     * Default notification categories and their default states.
     */
    protected array $defaultCategories = [
        // System notifications
        'system' => [
            'security_alert' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'password_changed' => ['email' => true, 'push' => false, 'sms' => false, 'in_app' => true],
            'login_new_device' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'account_update' => ['email' => true, 'push' => false, 'sms' => false, 'in_app' => true],
        ],

        // Leave notifications
        'leave' => [
            'leave_requested' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'leave_approved' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'leave_rejected' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'leave_cancelled' => ['email' => true, 'push' => false, 'sms' => false, 'in_app' => true],
        ],

        // Attendance notifications
        'attendance' => [
            'punch_reminder' => ['email' => false, 'push' => true, 'sms' => false, 'in_app' => true],
            'late_arrival' => ['email' => false, 'push' => true, 'sms' => false, 'in_app' => true],
            'early_departure' => ['email' => false, 'push' => true, 'sms' => false, 'in_app' => true],
            'overtime_alert' => ['email' => true, 'push' => false, 'sms' => false, 'in_app' => true],
        ],

        // Payroll notifications
        'payroll' => [
            'payslip_ready' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'salary_credited' => ['email' => true, 'push' => true, 'sms' => true, 'in_app' => true],
            'tax_document' => ['email' => true, 'push' => false, 'sms' => false, 'in_app' => true],
        ],

        // Workflow notifications
        'workflow' => [
            'approval_pending' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'task_assigned' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'deadline_reminder' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'escalation' => ['email' => true, 'push' => true, 'sms' => true, 'in_app' => true],
        ],

        // RFI notifications
        'rfi' => [
            'rfi_created' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
            'rfi_updated' => ['email' => true, 'push' => false, 'sms' => false, 'in_app' => true],
            'rfi_overdue' => ['email' => true, 'push' => true, 'sms' => true, 'in_app' => true],
            'inspection_scheduled' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
        ],
    ];

    /**
     * Cache TTL in seconds.
     */
    protected int $cacheTtl = 3600; // 1 hour

    /**
     * Check if a user should receive a notification via a specific channel.
     *
     * @param User $user
     * @param string $event The notification event (e.g., 'leave_approved')
     * @param string $channel The channel (email, push, sms, in_app)
     * @return bool
     */
    public function shouldNotify(User $user, string $event, string $channel): bool
    {
        // Check quiet hours first
        if ($this->isInQuietHours($user) && ! $this->isUrgent($event)) {
            return false;
        }

        $preferences = $this->getPreferences($user);

        // Find the event in preferences
        foreach ($preferences['categories'] as $category => $events) {
            if (isset($events[$event][$channel])) {
                return (bool) $events[$event][$channel];
            }
        }

        // Fall back to global channel preference
        return $preferences['channels'][$channel] ?? true;
    }

    /**
     * Get all notification preferences for a user.
     *
     * @param User $user
     * @return array
     */
    public function getPreferences(User $user): array
    {
        $cacheKey = "notification_prefs:{$user->id}";

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($user) {
            $stored = $user->notification_preferences ?? [];

            return array_merge($this->getDefaultPreferences(), $stored);
        });
    }

    /**
     * Get default preferences structure.
     *
     * @return array
     */
    public function getDefaultPreferences(): array
    {
        return [
            'channels' => [
                'email' => true,
                'push' => true,
                'sms' => false,
                'in_app' => true,
            ],
            'categories' => $this->defaultCategories,
            'quiet_hours' => [
                'enabled' => false,
                'start' => '22:00',
                'end' => '08:00',
                'timezone' => config('app.timezone', 'UTC'),
            ],
            'digest' => [
                'enabled' => false,
                'frequency' => 'daily', // daily, weekly
                'time' => '09:00',
                'day' => 'monday', // for weekly
            ],
        ];
    }

    /**
     * Update notification preferences for a user.
     *
     * @param User $user
     * @param array $preferences
     * @return void
     */
    public function updatePreferences(User $user, array $preferences): void
    {
        $current = $this->getPreferences($user);
        $merged = $this->mergePreferences($current, $preferences);

        $user->update(['notification_preferences' => $merged]);

        // Clear cache
        Cache::forget("notification_prefs:{$user->id}");
    }

    /**
     * Enable or disable a specific channel globally.
     *
     * @param User $user
     * @param string $channel
     * @param bool $enabled
     * @return void
     */
    public function setChannelEnabled(User $user, string $channel, bool $enabled): void
    {
        if (! in_array($channel, self::CHANNELS)) {
            throw new \InvalidArgumentException("Invalid channel: {$channel}");
        }

        $prefs = $this->getPreferences($user);
        $prefs['channels'][$channel] = $enabled;

        $this->updatePreferences($user, $prefs);
    }

    /**
     * Set event-specific preference.
     *
     * @param User $user
     * @param string $event
     * @param string $channel
     * @param bool $enabled
     * @return void
     */
    public function setEventPreference(
        User $user,
        string $event,
        string $channel,
        bool $enabled
    ): void {
        $prefs = $this->getPreferences($user);

        foreach ($prefs['categories'] as $category => &$events) {
            if (isset($events[$event])) {
                $events[$event][$channel] = $enabled;
                break;
            }
        }

        $this->updatePreferences($user, $prefs);
    }

    /**
     * Configure quiet hours for a user.
     *
     * @param User $user
     * @param bool $enabled
     * @param string|null $start
     * @param string|null $end
     * @param string|null $timezone
     * @return void
     */
    public function setQuietHours(
        User $user,
        bool $enabled,
        ?string $start = null,
        ?string $end = null,
        ?string $timezone = null
    ): void {
        $prefs = $this->getPreferences($user);

        $prefs['quiet_hours'] = [
            'enabled' => $enabled,
            'start' => $start ?? $prefs['quiet_hours']['start'],
            'end' => $end ?? $prefs['quiet_hours']['end'],
            'timezone' => $timezone ?? $prefs['quiet_hours']['timezone'],
        ];

        $this->updatePreferences($user, $prefs);
    }

    /**
     * Configure digest settings.
     *
     * @param User $user
     * @param bool $enabled
     * @param string $frequency daily|weekly
     * @param string|null $time
     * @param string|null $day
     * @return void
     */
    public function setDigestSettings(
        User $user,
        bool $enabled,
        string $frequency = 'daily',
        ?string $time = null,
        ?string $day = null
    ): void {
        $prefs = $this->getPreferences($user);

        $prefs['digest'] = [
            'enabled' => $enabled,
            'frequency' => $frequency,
            'time' => $time ?? $prefs['digest']['time'],
            'day' => $day ?? $prefs['digest']['day'],
        ];

        $this->updatePreferences($user, $prefs);
    }

    /**
     * Get available notification categories with events.
     *
     * @return array
     */
    public function getAvailableCategories(): array
    {
        return $this->defaultCategories;
    }

    /**
     * Get users who should receive a specific notification.
     *
     * @param array $users Array of User models or IDs
     * @param string $event
     * @param string $channel
     * @return array Filtered array of users
     */
    public function filterUsersForNotification(array $users, string $event, string $channel): array
    {
        return array_filter($users, function ($user) use ($event, $channel) {
            if (is_numeric($user)) {
                $user = User::find($user);
            }

            return $user && $this->shouldNotify($user, $event, $channel);
        });
    }

    /**
     * Check if user is in quiet hours.
     *
     * @param User $user
     * @return bool
     */
    protected function isInQuietHours(User $user): bool
    {
        $prefs = $this->getPreferences($user);

        if (! ($prefs['quiet_hours']['enabled'] ?? false)) {
            return false;
        }

        $timezone = $prefs['quiet_hours']['timezone'] ?? 'UTC';
        $now = now()->setTimezone($timezone);
        $start = \Carbon\Carbon::parse($prefs['quiet_hours']['start'], $timezone);
        $end = \Carbon\Carbon::parse($prefs['quiet_hours']['end'], $timezone);

        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if ($start > $end) {
            return $now >= $start || $now < $end;
        }

        return $now >= $start && $now < $end;
    }

    /**
     * Check if an event is urgent (bypasses quiet hours).
     *
     * @param string $event
     * @return bool
     */
    protected function isUrgent(string $event): bool
    {
        $urgentEvents = [
            'security_alert',
            'login_new_device',
            'escalation',
            'rfi_overdue',
        ];

        return in_array($event, $urgentEvents);
    }

    /**
     * Merge preferences deeply.
     *
     * @param array $current
     * @param array $new
     * @return array
     */
    protected function mergePreferences(array $current, array $new): array
    {
        foreach ($new as $key => $value) {
            if (is_array($value) && isset($current[$key]) && is_array($current[$key])) {
                $current[$key] = $this->mergePreferences($current[$key], $value);
            } else {
                $current[$key] = $value;
            }
        }

        return $current;
    }

    /**
     * Reset preferences to defaults.
     *
     * @param User $user
     * @return void
     */
    public function resetToDefaults(User $user): void
    {
        $user->update(['notification_preferences' => null]);
        Cache::forget("notification_prefs:{$user->id}");
    }
}
