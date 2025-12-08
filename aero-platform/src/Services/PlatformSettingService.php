<?php

namespace Aero\Platform\Services;

use Aero\Platform\Models\PlatformSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Crypt;

class PlatformSettingService
{
    public function update(PlatformSetting $setting, array $payload, array $files = []): PlatformSetting
    {
        $branding = array_merge($setting->branding ?? [], $payload['branding'] ?? []);
        $metadata = array_merge($setting->metadata ?? [], $payload['metadata'] ?? []);
        $legal = array_merge($setting->legal ?? [], $payload['legal'] ?? []);
        $integrations = array_merge($setting->integrations ?? [], $payload['integrations'] ?? []);
        $adminPreferences = array_merge($setting->admin_preferences ?? [], $payload['admin_preferences'] ?? []);

        $setting->fill(Arr::only($payload, [
            'site_name',
            'legal_name',
            'tagline',
            'support_email',
            'support_phone',
            'marketing_url',
            'status_page_url',
        ]));

        $setting->branding = $branding;
        $setting->metadata = $metadata;
        $setting->legal = $legal;
        $setting->integrations = $integrations;
        $setting->admin_preferences = $adminPreferences;
        $setting->email_settings = $this->mergeEmailSettings($setting, $payload['email_settings'] ?? []);
        $setting->save();

        $this->maybeUpdateBrandingMedia($setting, $files, $branding);

        return $setting->refresh();
    }

    protected function mergeEmailSettings(PlatformSetting $setting, array $email): array
    {
        $existing = $setting->email_settings ?? [];

        if (empty($email)) {
            return $existing;
        }

        if (isset($email['password']) && $email['password']) {
            $email['password'] = Crypt::encryptString($email['password']);
        } else {
            unset($email['password']);
        }

        if (! isset($email['password']) && isset($existing['password'])) {
            $email['password'] = $existing['password'];
        }

        // Handle verify_peer boolean - convert string '0'/'1' to actual boolean
        if (isset($email['verify_peer'])) {
            $email['verify_peer'] = filter_var($email['verify_peer'], FILTER_VALIDATE_BOOLEAN);
        }

        // Filter empty values but preserve boolean false (for verify_peer)
        return array_filter(
            array_merge($existing, $email),
            static fn ($value) => $value !== null && $value !== '' || $value === false
        );
    }

    protected function maybeUpdateBrandingMedia(PlatformSetting $setting, array $files, array &$branding): void
    {
        $map = [
            'logo' => PlatformSetting::MEDIA_LOGO,
            'logo_light' => PlatformSetting::MEDIA_LOGO_LIGHT,
            'logo_dark' => PlatformSetting::MEDIA_LOGO_DARK,
            'square_logo' => PlatformSetting::MEDIA_SQUARE_LOGO,
            'favicon' => PlatformSetting::MEDIA_FAVICON,
            'social' => PlatformSetting::MEDIA_SOCIAL,
        ];

        foreach ($map as $key => $collection) {
            if (! isset($files[$key]) || ! $files[$key] instanceof UploadedFile) {
                continue;
            }

            $setting->clearMediaCollection($collection);
            $setting->addMedia($files[$key])->toMediaCollection($collection);
            $branding[$key] = $setting->getFirstMediaUrl($collection);
        }

        $setting->branding = $branding;
        $setting->save();
    }
}
