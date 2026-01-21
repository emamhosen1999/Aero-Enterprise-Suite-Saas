<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Aero\Platform\Models\PlatformPage;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Store Platform Page Request
 */
class StorePlatformPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:255', 'unique:platform_pages,slug'],
            'title' => ['required', 'string', 'max:255'],
            'page_type' => ['required', 'string', 'in:'.implode(',', array_keys(PlatformPage::getPageTypes()))],
            'meta_title' => ['nullable', 'string', 'max:60'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
            'og_title' => ['nullable', 'string', 'max:95'],
            'og_description' => ['nullable', 'string', 'max:200'],
            'og_image' => ['nullable', 'url', 'max:500'],
            'twitter_title' => ['nullable', 'string', 'max:70'],
            'twitter_description' => ['nullable', 'string', 'max:200'],
            'content' => ['nullable', 'array'],
            'priority' => ['integer', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.required' => 'Page URL slug is required.',
            'slug.unique' => 'A page with this URL slug already exists.',
            'title.required' => 'Page title is required.',
            'page_type.required' => 'Page type is required.',
            'page_type.in' => 'Please select a valid page type.',
            'meta_title.max' => 'Meta title should be under 60 characters.',
            'meta_description.max' => 'Meta description should be under 160 characters.',
            'og_title.max' => 'OG title should be under 95 characters.',
            'twitter_title.max' => 'Twitter title should be under 70 characters.',
        ];
    }
}
