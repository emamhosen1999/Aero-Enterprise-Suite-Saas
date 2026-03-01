<?php

namespace Aero\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlatformSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Authorization is handled by route middleware (auth:landlord + module:).
     * No hardcoded role names here — roles are managed via the module access system.
     */
    public function authorize(): bool
    {
        return true;
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

            // Infrastructure / Hosting mode
            'hosting_settings'                       => ['sometimes', 'array'],
            'hosting_settings.mode'                  => ['sometimes', 'string', 'in:shared,dedicated'],
            'hosting_settings.cpanel_host'           => ['nullable', 'string', 'max:255'],
            'hosting_settings.cpanel_port'           => ['nullable', 'integer', 'min:1', 'max:65535'],
            'hosting_settings.cpanel_username'       => ['nullable', 'string', 'max:64'],
            'hosting_settings.cpanel_api_token'      => ['nullable', 'string', 'max:512'],
            'hosting_settings.cpanel_db_user'        => ['nullable', 'string', 'max:64'],

            'logo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
            'square_logo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
            'favicon' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/x-icon,image/webp', 'max:2048'],
            'social' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
        ];
    }
}
