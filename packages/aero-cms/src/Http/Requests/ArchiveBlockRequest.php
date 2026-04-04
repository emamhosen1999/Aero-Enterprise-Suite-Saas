<?php

namespace Aero\Cms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ArchiveBlockRequest extends FormRequest
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
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'reason.string' => 'Reason must be a string',
            'reason.max' => 'Reason cannot exceed 500 characters',
        ];
    }
}
