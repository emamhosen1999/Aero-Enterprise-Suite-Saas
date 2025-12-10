<?php

namespace Aero\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlatformSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        \Log::info('Platform Settings Update - FormRequest authorize() called', [
            'has_site_name' => $this->has('site_name'),
            'site_name_value' => $this->input('site_name'),
            'has_support_email' => $this->has('support_email'),
            'support_email_value' => $this->input('support_email'),
            'all_keys' => array_keys($this->all()),
            'method' => $this->method(),
        ]);

        // Use landlord guard for platform admin
        $user = $this->user('landlord');

        if (! $user) {
            \Log::warning('Platform Settings Update - No landlord user found in request');

            return false;
        }

        // Check for Platform Super Admin role or platform.settings.update permission
        $hasRole = method_exists($user, 'hasRole') && $user->hasRole('Platform Super Admin');
        $hasPermission = $user->can('platform.settings.update');

        \Log::info('Platform Settings Update - Authorization Check in FormRequest', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'has_super_admin_role' => $hasRole,
            'has_update_permission' => $hasPermission,
            'will_authorize' => $hasRole || $hasPermission,
        ]);

        return $hasRole || $hasPermission;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'site_name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'support_email' => ['required', 'email', 'max:255'],
            'support_phone' => ['nullable', 'string', 'max:40'],
            'marketing_url' => ['nullable', 'url', 'max:255'],
            'status_page_url' => ['nullable', 'url', 'max:255'],

            'branding' => ['sometimes', 'array'],
            'branding.primary_color' => ['nullable', 'regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/'],
            'branding.accent_color' => ['nullable', 'regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/'],

            'metadata' => ['sometimes', 'array'],
            'metadata.hero_title' => ['nullable', 'string', 'max:255'],
            'metadata.hero_subtitle' => ['nullable', 'string', 'max:500'],
            'metadata.meta_title' => ['nullable', 'string', 'max:255'],
            'metadata.meta_description' => ['nullable', 'string', 'max:500'],
            'metadata.meta_keywords' => ['nullable', 'array'],
            'metadata.meta_keywords.*' => ['string', 'max:100'],

            'email_settings' => ['sometimes', 'array'],
            'email_settings.driver' => ['nullable', 'string', Rule::in(['smtp', 'ses', 'mailgun', 'postmark', 'sendmail', 'log'])],
            'email_settings.host' => ['nullable', 'string', 'max:255'],
            'email_settings.port' => ['nullable', 'integer'],
            'email_settings.encryption' => ['nullable', 'string', Rule::in(['tls', 'ssl', 'starttls'])],
            'email_settings.username' => ['nullable', 'string', 'max:255'],
            'email_settings.password' => ['nullable', 'string', 'max:255'],
            'email_settings.from_address' => ['nullable', 'email', 'max:255'],
            'email_settings.from_name' => ['nullable', 'string', 'max:255'],
            'email_settings.reply_to' => ['nullable', 'email', 'max:255'],
            'email_settings.verify_peer' => ['nullable', 'boolean'],

            'legal' => ['sometimes', 'array'],
            'legal.terms_url' => ['nullable', 'url', 'max:255'],
            'legal.privacy_url' => ['nullable', 'url', 'max:255'],
            'legal.cookies_url' => ['nullable', 'url', 'max:255'],

            'integrations' => ['sometimes', 'array'],
            'integrations.intercom_app_id' => ['nullable', 'string', 'max:120'],
            'integrations.segment_key' => ['nullable', 'string', 'max:120'],
            'integrations.statuspage_id' => ['nullable', 'string', 'max:120'],

            'admin_preferences' => ['sometimes', 'array'],
            'admin_preferences.show_beta_features' => ['nullable', 'boolean'],
            'admin_preferences.enable_impersonation' => ['nullable', 'boolean'],

            'logo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
            'square_logo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
            'favicon' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/x-icon,image/webp', 'max:2048'],
            'social' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
        ];
    }
}
