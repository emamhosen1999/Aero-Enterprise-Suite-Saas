<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['sometimes', 'integer', 'exists:employees,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'reason' => ['sometimes', 'string'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', 'string', 'in:draft,active,completed,extended,terminated'],
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
            'employee_id.exists' => 'The selected employee does not exist.',
            'title.max' => 'The PIP title may not exceed 255 characters.',
            'end_date.after_or_equal' => 'The end date must be on or after the start date.',
            'status.in' => 'Status must be one of: draft, active, completed, extended, terminated.',
            'manager_id.exists' => 'The selected manager does not exist.',
            'goals.*.title.required_with' => 'Each goal must have a title.',
            'goals.*.target_date.required_with' => 'Each goal must have a target date.',
            'goals.*.target_date.date' => 'Each goal target date must be a valid date.',
        ];
    }
}
