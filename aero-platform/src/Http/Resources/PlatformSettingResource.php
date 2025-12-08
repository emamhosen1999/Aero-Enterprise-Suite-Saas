<?php

namespace Aero\Platform\Http\Resources;

use Aero\Platform\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlatformSettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var PlatformSetting $setting */
        $setting = $this->resource;

        return [
            'id' => $setting->id,
            'slug' => $setting->slug,
            'site' => [
                'name' => $setting->site_name,
                'legal_name' => $setting->legal_name,
                'tagline' => $setting->tagline,
                'support_email' => $setting->support_email,
                'support_phone' => $setting->support_phone,
                'marketing_url' => $setting->marketing_url,
                'status_page_url' => $setting->status_page_url,
            ],
            'branding' => $setting->getBrandingPayload(),
            'metadata' => $setting->metadata ?? [],
            'email_settings' => $setting->getSanitizedEmailSettings(),
            'legal' => $setting->legal ?? [],
            'integrations' => $setting->integrations ?? [],
            'admin_preferences' => $setting->admin_preferences ?? [],
            'created_at' => $setting->created_at,
            'updated_at' => $setting->updated_at,
        ];
    }
}
