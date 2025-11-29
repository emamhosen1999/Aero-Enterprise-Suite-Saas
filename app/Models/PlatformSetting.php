<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Throwable;

class PlatformSetting extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    public const DEFAULT_SLUG = 'platform';

    public const MEDIA_LOGO = 'platform_logo';

    public const MEDIA_FAVICON = 'platform_favicon';

    public const MEDIA_SOCIAL = 'platform_social_image';

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
        'legal',
        'integrations',
        'admin_preferences',
    ];

    protected $casts = [
        'branding' => 'array',
        'metadata' => 'array',
        'email_settings' => 'array',
        'legal' => 'array',
        'integrations' => 'array',
        'admin_preferences' => 'array',
    ];

    protected $attributes = [
        'branding' => '[]',
        'metadata' => '[]',
        'email_settings' => '[]',
        'legal' => '[]',
        'integrations' => '[]',
        'admin_preferences' => '[]',
    ];

    public static function current(): self
    {
        return static::firstOrCreate(
            ['slug' => self::DEFAULT_SLUG],
            ['site_name' => config('app.name', 'Aero Enterprise Suite')]
        );
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_LOGO)->singleFile();
        $this->addMediaCollection(self::MEDIA_FAVICON)->singleFile();
        $this->addMediaCollection(self::MEDIA_SOCIAL)->singleFile();
    }

    public function getBrandingPayload(): array
    {
        $branding = $this->branding ?? [];

        return array_merge([
            'logo' => $this->getFirstMediaUrl(self::MEDIA_LOGO) ?: data_get($branding, 'logo'),
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
