<?php

namespace Aero\Platform\Services;

use Aero\Core\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Crypt;

class SystemSettingService
{
    public function update(SystemSetting $setting, array $payload, array $files = []): SystemSetting
    {
        $branding = array_merge($setting->branding ?? [], $payload['branding'] ?? []);
        $metadata = array_merge($setting->metadata ?? [], $payload['metadata'] ?? []);
        $notificationChannels = array_merge($setting->notification_channels ?? [], $payload['notification_channels'] ?? []);
        $integrations = array_merge($setting->integrations ?? [], $payload['integrations'] ?? []);
        $advanced = array_merge($setting->advanced ?? [], $payload['advanced'] ?? []);

        $setting->fill(Arr::only($payload, [
            'company_name',
            'legal_name',
            'tagline',
            'contact_person',
            'support_email',
            'support_phone',
            'website_url',
            'timezone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'country',
        ]));

        $setting->branding = $branding;
        $setting->metadata = $metadata;
        $setting->notification_channels = $notificationChannels;
        $setting->integrations = $integrations;
        $setting->advanced = $advanced;
        $setting->email_settings = $this->mergeEmailSettings($setting, $payload['email_settings'] ?? []);
        $setting->save();

        $this->maybeUpdateBrandingMedia($setting, $files, $branding);

        return $setting->refresh();
    }

    protected function mergeEmailSettings(SystemSetting $setting, array $email): array
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

        return array_filter(array_merge($existing, $email), static fn ($value) => $value !== null && $value !== '');
    }

    protected function maybeUpdateBrandingMedia(SystemSetting $setting, array $files, array &$branding): void
    {
        $map = [
            'logo_light' => SystemSetting::MEDIA_LOGO_LIGHT,
            'logo_dark' => SystemSetting::MEDIA_LOGO_DARK,
            'favicon' => SystemSetting::MEDIA_FAVICON,
            'login_background' => SystemSetting::MEDIA_LOGIN_BACKGROUND,
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
