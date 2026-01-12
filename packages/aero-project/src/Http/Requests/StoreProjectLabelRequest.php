<?php

declare(strict_types=1);

namespace Aero\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Store Project Label Request
 */
class StoreProjectLabelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
            'color' => ['required', 'string', 'max:20', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Label name is required.',
            'name.max' => 'Label name cannot exceed 50 characters.',
            'color.required' => 'Label color is required.',
            'color.regex' => 'Color must be a valid hex color (e.g., #6366f1).',
        ];
    }
}
