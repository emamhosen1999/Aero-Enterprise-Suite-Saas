<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePerformanceCalibrationSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'review_period_end' => ['required', 'date'],
            'employee_ids' => ['required', 'array', 'min:1'],
            'employee_ids.*' => ['required', 'exists:users,id'],
            'target_distribution' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'review_period_end.required' => 'Review cycle end date is required.',
            'review_period_end.date' => 'Review cycle end date must be valid.',
            'employee_ids.required' => 'At least one employee is required.',
            'employee_ids.array' => 'Employees must be provided as a list.',
            'employee_ids.min' => 'At least one employee is required.',
            'employee_ids.*.exists' => 'One or more selected employees do not exist.',
        ];
    }
}
