<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Analytics Integrations Request
 */
class UpdateAnalyticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'google_analytics' => ['nullable', 'array'],
            'google_analytics.enabled' => ['boolean'],
            'google_analytics.measurement_id' => ['nullable', 'string', 'max:50', 'regex:/^G-[A-Z0-9]+$/'],

            'google_tag_manager' => ['nullable', 'array'],
            'google_tag_manager.enabled' => ['boolean'],
            'google_tag_manager.container_id' => ['nullable', 'string', 'max:50', 'regex:/^GTM-[A-Z0-9]+$/'],

            'facebook_pixel' => ['nullable', 'array'],
            'facebook_pixel.enabled' => ['boolean'],
            'facebook_pixel.pixel_id' => ['nullable', 'string', 'max:50', 'regex:/^[0-9]+$/'],

            'hotjar' => ['nullable', 'array'],
            'hotjar.enabled' => ['boolean'],
            'hotjar.site_id' => ['nullable', 'string', 'max:50', 'regex:/^[0-9]+$/'],

            'mixpanel' => ['nullable', 'array'],
            'mixpanel.enabled' => ['boolean'],
            'mixpanel.token' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'google_analytics.measurement_id.regex' => 'Invalid GA4 Measurement ID format. Expected: G-XXXXXXX',
            'google_tag_manager.container_id.regex' => 'Invalid GTM Container ID format. Expected: GTM-XXXXXXX',
            'facebook_pixel.pixel_id.regex' => 'Invalid Facebook Pixel ID format. Expected numeric ID.',
            'hotjar.site_id.regex' => 'Invalid Hotjar Site ID format. Expected numeric ID.',
        ];
    }
}
