<?php

declare(strict_types=1);

namespace Aero\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Store Project Sprint Request
 */
class StoreProjectSprintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'goal' => ['nullable', 'string', 'max:2000'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'capacity_points' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Sprint name is required.',
            'name.max' => 'Sprint name cannot exceed 255 characters.',
            'start_date.required' => 'Start date is required.',
            'end_date.required' => 'End date is required.',
            'end_date.after' => 'End date must be after start date.',
            'capacity_points.min' => 'Capacity points cannot be negative.',
        ];
    }
}
