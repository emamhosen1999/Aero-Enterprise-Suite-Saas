<?php

namespace App\Traits;

use Illuminate\Support\Facades\Request;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Enhanced activity logging trait that extends Spatie's LogsActivity
 * with additional context like IP address, user agent, and device ID.
 */
trait LogsActivityEnhanced
{
    use LogsActivity;

    /**
     * Get the default activity log options.
     * Override this in individual models to customize logging behavior.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName($this->getLogName());
    }

    /**
     * Get the log name for this model.
     * Override in models that need a custom log name.
     */
    protected function getLogName(): string
    {
        return strtolower(class_basename($this));
    }

    /**
     * Tap into the activity before it's saved to add enhanced properties.
     */
    public function tapActivity(\Spatie\Activitylog\Contracts\Activity $activity, string $eventName): void
    {
        // Add request context to the activity
        $activity->properties = $activity->properties->merge([
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'device_id' => Request::header('X-Device-ID'),
            'request_id' => Request::header('X-Request-ID'),
            'event' => $eventName,
        ]);
    }

    /**
     * Get attributes that should be excluded from logging.
     * Override in models to customize.
     */
    protected function getExcludedAttributes(): array
    {
        return [
            'password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
        ];
    }
}
