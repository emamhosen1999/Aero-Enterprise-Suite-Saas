<?php

namespace Aero\Platform\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Aero\Core\Support\TenantCache;
use Illuminate\Support\Facades\Crypt;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Throwable;

class PlatformSetting extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    /**
     * Platform settings are stored in the central (landlord) database.
     * Ensure tenant requests do not look for this table in the tenant schema.
     */
    protected $connection = 'central';

    public const DEFAULT_SLUG = 'platform';

    public const MEDIA_LOGO = 'platform_logo';

    public const MEDIA_LOGO_LIGHT = 'platform_logo_light';

    public const MEDIA_LOGO_DARK = 'platform_logo_dark';

    public const MEDIA_SQUARE_LOGO = 'platform_square_logo';

    public const MEDIA_FAVICON = 'platform_favicon';

    public const MEDIA_SOCIAL = 'platform_social_image';

    /**
     * Cache key for maintenance mode status.
     */
    public const CACHE_KEY_MAINTENANCE = 'platform:maintenance_mode';

    /**
     * Cache TTL for maintenance mode status (in seconds).
     */
    public const CACHE_TTL_MAINTENANCE = 60;

    /**
     * HTTP header name for bypass secret.
     */
    public const BYPASS_HEADER = 'X-Maintenance-Bypass';

    protected $fillable = [
        'slug',
        'site_name',
        'legal_name',
        'tagline',
        'support_email',
        'support_phone',
        'marketing_url',
        'status_page_url',
        'branding',
        'metadata',
        'email_settings',
        'sms_settings',
        'legal',
        'integrations',
        'admin_preferences',
        // Maintenance mode fields
        'maintenance_mode',
        'maintenance_message',
        'maintenance_bypass_ips',
        'maintenance_bypass_secret',
        'maintenance_allowed_paths',
        'scheduled_maintenance_at',
        'maintenance_ends_at',
        'maintenance_skip_verification',
    ];

    protected $casts = [
        'branding' => 'array',
        'metadata' => 'array',
        'email_settings' => 'array',
        'sms_settings' => 'array',
        'legal' => 'array',
        'integrations' => 'array',
        'admin_preferences' => 'array',
        // Maintenance mode casts
        'maintenance_mode' => 'boolean',
        'maintenance_bypass_ips' => 'array',
        'maintenance_allowed_paths' => 'array',
        'scheduled_maintenance_at' => 'datetime',
        'maintenance_ends_at' => 'datetime',
        'maintenance_skip_verification' => 'boolean',
    ];

    protected $attributes = [
        'branding' => '[]',
        'metadata' => '[]',
        'email_settings' => '[]',
        'sms_settings' => '[]',
        'legal' => '[]',
        'integrations' => '[]',
        'admin_preferences' => '[]',
        'maintenance_mode' => false,
        'maintenance_bypass_ips' => '[]',
        'maintenance_allowed_paths' => '[]',
        'maintenance_skip_verification' => false,
    ];

    /**
     * Boot the model and register event listeners.
     */
    protected static function booted(): void
    {
        // Clear maintenance cache when settings are updated
        static::saved(function (self $setting) {
            TenantCache::forget(self::CACHE_KEY_MAINTENANCE);
        });
    }

    public static function current(): self
    {
        return static::firstOrCreate(
            ['slug' => self::DEFAULT_SLUG],
            ['site_name' => config('app.name', 'aeos365')]
        );
    }

    /**
     * Get cached maintenance mode status for high-performance middleware checks.
     *
     * Returns an array with all maintenance-related settings to avoid
     * multiple database queries per request.
     */
    public static function getMaintenanceStatus(): array
    {
        return TenantCache::remember(
            self::CACHE_KEY_MAINTENANCE,
            self::CACHE_TTL_MAINTENANCE,
            function () {
                $setting = static::current();

                return [
                    'enabled' => $setting->maintenance_mode,
                    'message' => $setting->maintenance_message ?? 'The platform is currently undergoing scheduled maintenance. We\'ll be back shortly.',
                    'bypass_ips' => $setting->maintenance_bypass_ips ?? [],
                    'bypass_secret' => $setting->maintenance_bypass_secret,
                    'allowed_paths' => $setting->maintenance_allowed_paths ?? [],
                    'scheduled_at' => $setting->scheduled_maintenance_at?->toIso8601String(),
                    'ends_at' => $setting->maintenance_ends_at?->toIso8601String(),
                ];
            }
        );
    }

    /**
     * Check if global maintenance mode is currently active.
     */
    public static function isMaintenanceModeEnabled(): bool
    {
        return self::getMaintenanceStatus()['enabled'];
    }

    /**
     * Enable global maintenance mode.
     */
    public function enableMaintenanceMode(?string $message = null, ?\DateTimeInterface $endsAt = null): bool
    {
        $updated = $this->update([
            'maintenance_mode' => true,
            'maintenance_message' => $message,
            'maintenance_ends_at' => $endsAt,
        ]);

        TenantCache::forget(self::CACHE_KEY_MAINTENANCE);

        return $updated;
    }

    /**
     * Disable global maintenance mode.
     */
    public function disableMaintenanceMode(): bool
    {
        $updated = $this->update([
            'maintenance_mode' => false,
            'maintenance_ends_at' => null,
        ]);

        TenantCache::forget(self::CACHE_KEY_MAINTENANCE);

        return $updated;
    }

    /**
     * Check if an IP address is in the bypass list.
     */
    public static function isIpBypassed(string $ip): bool
    {
        $status = self::getMaintenanceStatus();
        $bypassIps = $status['bypass_ips'];

        if (empty($bypassIps)) {
            return false;
        }

        return in_array($ip, $bypassIps, true);
    }

    /**
     * Check if a secret matches the bypass secret.
     */
    public static function isSecretValid(?string $secret): bool
    {
        if (empty($secret)) {
            return false;
        }

        $status = self::getMaintenanceStatus();

        return ! empty($status['bypass_secret']) && hash_equals($status['bypass_secret'], $secret);
    }

    /**
     * Check if a path is in the allowed paths during maintenance.
     */
    public static function isPathAllowed(string $path): bool
    {
        $status = self::getMaintenanceStatus();
        $allowedPaths = $status['allowed_paths'];

        if (empty($allowedPaths)) {
            return false;
        }

        $path = '/'.ltrim($path, '/');

        foreach ($allowedPaths as $allowed) {
            $pattern = '/'.ltrim($allowed, '/');

            // Exact match
            if ($path === $pattern) {
                return true;
            }

            // Wildcard match (e.g., /api/health/*)
            if (str_ends_with($pattern, '*')) {
                $prefix = rtrim($pattern, '*');
                if (str_starts_with($path, $prefix)) {
                    return true;
                }
            }
        }

        return false;
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_LOGO)->singleFile();
        $this->addMediaCollection(self::MEDIA_SQUARE_LOGO)->singleFile();
        $this->addMediaCollection(self::MEDIA_FAVICON)->singleFile();
        $this->addMediaCollection(self::MEDIA_SOCIAL)->singleFile();
    }

    public function getBrandingPayload(): array
    {
        $branding = $this->branding ?? [];

        return array_merge([
            'logo' => $this->getFirstMediaUrl(self::MEDIA_LOGO) ?: data_get($branding, 'logo'),
            'logo_light' => $this->getFirstMediaUrl(self::MEDIA_LOGO_LIGHT) ?: data_get($branding, 'logo_light'),
            'logo_dark' => $this->getFirstMediaUrl(self::MEDIA_LOGO_DARK) ?: data_get($branding, 'logo_dark'),
            'square_logo' => $this->getFirstMediaUrl(self::MEDIA_SQUARE_LOGO) ?: data_get($branding, 'square_logo'),
            'favicon' => $this->getFirstMediaUrl(self::MEDIA_FAVICON) ?: data_get($branding, 'favicon'),
            'social' => $this->getFirstMediaUrl(self::MEDIA_SOCIAL) ?: data_get($branding, 'social'),
            'primary_color' => data_get($branding, 'primary_color', '#0f172a'),
            'accent_color' => data_get($branding, 'accent_color', '#818cf8'),
        ], $branding);
    }

    public function getSanitizedEmailSettings(): array
    {
        $email = $this->email_settings ?? [];

        if (! empty($email['password'])) {
            $email['password_set'] = true;
            unset($email['password']);
        }

        return $email;
    }

    public function getEmailPassword(): ?string
    {
        $value = data_get($this->email_settings, 'password');

        if (! $value) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (Throwable $exception) {
            report($exception);

            return null;
        }
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('web')
            ->width(512)
            ->optimize()
            ->nonQueued();
    }
}
