<?php

namespace Aero\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'event_type',
        'channel',
        'enabled',
        'quiet_hours_start',
        'quiet_hours_end',
        'digest_frequency',
        'options',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'options' => 'array',
    ];

    /**
     * Get the user that owns this preference.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all preferences for a user as a structured array.
     */
    public static function getForUser(int $userId): array
    {
        $preferences = static::where('user_id', $userId)->get();

        $result = [];
        foreach ($preferences as $pref) {
            if (! isset($result[$pref->event_type])) {
                $result[$pref->event_type] = [];
            }
            $result[$pref->event_type][$pref->channel] = $pref->enabled;
        }

        return $result;
    }

    /**
     * Set a preference for a user.
     */
    public static function setForUser(int $userId, string $eventType, string $channel, bool $enabled): static
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'event_type' => $eventType,
                'channel' => $channel,
            ],
            [
                'enabled' => $enabled,
            ]
        );
    }

    /**
     * Check if a channel is enabled for a user and event type.
     */
    public static function isEnabledForUser(int $userId, string $eventType, string $channel): bool
    {
        $pref = static::where([
            'user_id' => $userId,
            'event_type' => $eventType,
            'channel' => $channel,
        ])->first();

        // Default to enabled for database and mail, disabled for others
        if (! $pref) {
            return in_array($channel, ['database', 'mail']);
        }

        return $pref->enabled;
    }

    /**
     * Get quiet hours for a user.
     */
    public static function getQuietHoursForUser(int $userId): array
    {
        $pref = static::where('user_id', $userId)
            ->whereNotNull('quiet_hours_start')
            ->first();

        return [
            'enabled' => (bool) $pref,
            'start' => $pref?->quiet_hours_start ?? '22:00',
            'end' => $pref?->quiet_hours_end ?? '07:00',
        ];
    }

    /**
     * Get digest frequency for a user.
     */
    public static function getDigestFrequencyForUser(int $userId): string
    {
        $pref = static::where('user_id', $userId)
            ->whereNotNull('digest_frequency')
            ->first();

        return $pref?->digest_frequency ?? 'instant';
    }

    /**
     * Reset all preferences for a user to defaults.
     */
    public static function resetForUser(int $userId): void
    {
        static::where('user_id', $userId)->delete();
    }
}
