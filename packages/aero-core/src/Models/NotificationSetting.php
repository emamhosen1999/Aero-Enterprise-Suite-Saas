<?php

namespace Aero\Core\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    protected $casts = [
        'value' => 'json',
    ];

    /**
     * Get a setting value by key.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function setValue(string $key, mixed $value, ?string $description = null): static
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'description' => $description,
            ]
        );
    }

    /**
     * Check if a channel is enabled.
     */
    public static function isChannelEnabled(string $channel): bool
    {
        return (bool) static::getValue("channels.{$channel}.enabled", true);
    }

    /**
     * Get all settings as a keyed array.
     */
    public static function getAllAsArray(): array
    {
        return static::all()->pluck('value', 'key')->toArray();
    }

    /**
     * Get retry configuration.
     */
    public static function getRetryConfig(): array
    {
        return [
            'max_attempts' => static::getValue('retry.max_attempts', 3),
            'backoff_minutes' => static::getValue('retry.backoff_minutes', [5, 15, 60]),
        ];
    }
}
