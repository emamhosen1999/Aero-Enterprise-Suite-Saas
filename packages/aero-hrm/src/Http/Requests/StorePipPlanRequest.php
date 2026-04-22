<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'title' => ['required', 'string', 'max:255'],
            'reason' => ['required', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'string', 'in:draft,active'],
            'description' => ['nullable', 'string'],
            'expected_outcomes' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'goals' => ['nullable', 'array'],
            'goals.*.title' => ['required_with:goals', 'string', 'max:255'],
            'goals.*.description' => ['nullable', 'string'],
            'goals.*.target_date' => ['required_with:goals', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'An employee must be selected.',
            'employee_id.exists' => 'The selected employee does not exist.',
            'title.required' => 'The PIP title is required.',
            'title.max' => 'The PIP title may not exceed 255 characters.',
            'reason.required' => 'A reason for the PIP is required.',
            'start_date.required' => 'A start date is required.',
            'start_date.date' => 'The start date must be a valid date.',
            'end_date.required' => 'An end date is required.',
            'end_date.date' => 'The end date must be a valid date.',
            'end_date.after_or_equal' => 'The end date must be on or after the start date.',
            'status.in' => 'Status must be either draft or active.',
            'manager_id.exists' => 'The selected manager does not exist.',
            'goals.array' => 'Goals must be provided as a list.',
            'goals.*.title.required_with' => 'Each goal must have a title.',
            'goals.*.target_date.required_with' => 'Each goal must have a target date.',
            'goals.*.target_date.date' => 'Each goal target date must be a valid date.',
        ];
    }
}
