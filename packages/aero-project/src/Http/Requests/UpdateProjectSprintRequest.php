<?php

declare(strict_types=1);

namespace Aero\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Project Sprint Request
 */
class UpdateProjectSprintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'goal' => ['nullable', 'string', 'max:2000'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after:start_date'],
            'capacity_points' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'retrospective' => ['nullable', 'array'],
            'retrospective.went_well' => ['nullable', 'array'],
            'retrospective.improvements' => ['nullable', 'array'],
            'retrospective.actions' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'Sprint name cannot exceed 255 characters.',
            'end_date.after' => 'End date must be after start date.',
            'capacity_points.min' => 'Capacity points cannot be negative.',
        ];
    }
}
