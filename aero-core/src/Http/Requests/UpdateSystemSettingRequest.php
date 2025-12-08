<?php

namespace Aero\Core\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSystemSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('company.settings') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'support_email' => ['required', 'email', 'max:255'],
            'support_phone' => ['nullable', 'string', 'max:40'],
            'website_url' => ['nullable', 'url', 'max:255'],
            'timezone' => ['nullable', 'timezone'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:120'],

            'branding' => ['sometimes', 'array'],
            'branding.primary_color' => ['nullable', 'regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/'],
            'branding.accent_color' => ['nullable', 'regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/'],
            'branding.login_background' => ['nullable', 'string', 'max:255'],

            'metadata' => ['sometimes', 'array'],
            'metadata.seo_title' => ['nullable', 'string', 'max:255'],
            'metadata.seo_description' => ['nullable', 'string', 'max:500'],
            'metadata.seo_keywords' => ['nullable', 'array'],
            'metadata.seo_keywords.*' => ['string', 'max:100'],
            'metadata.default_locale' => ['nullable', 'string', 'max:10'],
            'metadata.show_help_center' => ['nullable', 'boolean'],
            'metadata.enable_public_pages' => ['nullable', 'boolean'],

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
            'email_settings.queue' => ['nullable', 'boolean'],

            'notification_channels' => ['sometimes', 'array'],
            'notification_channels.email' => ['nullable', 'boolean'],
            'notification_channels.sms' => ['nullable', 'boolean'],
            'notification_channels.slack' => ['nullable', 'boolean'],

            'integrations' => ['sometimes', 'array'],
            'integrations.slack_webhook' => ['nullable', 'url', 'max:255'],
            'integrations.teams_webhook' => ['nullable', 'url', 'max:255'],
            'integrations.statuspage_url' => ['nullable', 'url', 'max:255'],

            'advanced' => ['sometimes', 'array'],
            'advanced.maintenance_mode' => ['nullable', 'boolean'],
            'advanced.session_timeout' => ['nullable', 'integer', 'min:5', 'max:720'],

            'logo_light' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
            'logo_dark' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/webp', 'max:4096'],
            'favicon' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/svg+xml,image/x-icon,image/webp', 'max:2048'],
            'login_background' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp', 'max:8192'],
        ];
    }
}
