<?php

declare(strict_types=1);

namespace Aero\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Upload Project Attachment Request
 */
class UploadProjectAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'max:10'],
            'files.*' => ['file', 'max:51200'], // 50MB max per file
            'attachable_type' => ['required', 'string'],
            'attachable_id' => ['required', 'integer'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please select at least one file to upload.',
            'files.max' => 'You can upload a maximum of 10 files at once.',
            'files.*.max' => 'Each file must be less than 50MB.',
            'attachable_type.required' => 'Attachment target type is required.',
            'attachable_id.required' => 'Attachment target ID is required.',
        ];
    }
}
