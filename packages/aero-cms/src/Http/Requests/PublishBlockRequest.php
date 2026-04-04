<?php

namespace Aero\Cms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublishBlockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('landlord')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'visibility' => ['required', 'in:public,internal,private,draft_only'],
            'is_featured' => ['nullable', 'boolean'],
            'version_summary' => ['nullable', 'string', 'max:255'],
            'version_description' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:500'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'visibility.required' => 'Visibility is required',
            'visibility.in' => 'Visibility must be public, internal, private, or draft_only',
            'is_featured.boolean' => 'Featured flag must be a boolean',
            'version_summary.max' => 'Version summary cannot exceed 255 characters',
            'version_description.max' => 'Version description cannot exceed 1000 characters',
            'notes.max' => 'Publishing notes cannot exceed 500 characters',
            'reason.max' => 'Reason cannot exceed 500 characters',
        ];
    }
}
