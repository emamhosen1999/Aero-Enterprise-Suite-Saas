<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update SEO Settings Request
 */
class UpdateSeoSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_meta_title' => ['nullable', 'string', 'max:60'],
            'default_meta_description' => ['nullable', 'string', 'max:160'],
            'default_meta_keywords' => ['nullable', 'string', 'max:255'],
            'canonical_domain' => ['nullable', 'url', 'max:255'],
            'sitemap_enabled' => ['boolean'],
            'robots_txt' => ['nullable', 'string', 'max:5000'],
            'og_site_name' => ['nullable', 'string', 'max:100'],
            'og_default_image' => ['nullable', 'url', 'max:500'],
            'twitter_site' => ['nullable', 'string', 'max:50'],
            'twitter_creator' => ['nullable', 'string', 'max:50'],
            'schema_organization' => ['nullable', 'array'],
            'schema_organization.name' => ['nullable', 'string', 'max:255'],
            'schema_organization.url' => ['nullable', 'url', 'max:500'],
            'schema_organization.logo' => ['nullable', 'url', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'default_meta_title.max' => 'Meta title should be under 60 characters for optimal SEO.',
            'default_meta_description.max' => 'Meta description should be under 160 characters for optimal SEO.',
            'canonical_domain.url' => 'Please enter a valid URL for the canonical domain.',
            'og_default_image.url' => 'Please enter a valid URL for the Open Graph image.',
        ];
    }
}
