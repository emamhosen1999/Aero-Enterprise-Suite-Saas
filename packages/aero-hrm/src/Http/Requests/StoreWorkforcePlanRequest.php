<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkforcePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'fiscal_year' => ['required', 'integer', 'min:2020', 'max:2030'],
            'planned_headcount' => ['required', 'integer', 'min:0'],
            'current_headcount' => ['nullable', 'integer', 'min:0'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'positions' => ['nullable', 'array'],
            'positions.*.designation_id' => ['required', 'exists:designations,id'],
            'positions.*.count' => ['required', 'integer', 'min:1'],
            'positions.*.priority' => ['nullable', 'in:low,medium,high,critical'],
            'positions.*.justification' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'in:draft,submitted,approved,rejected'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'title.max' => 'Title must not exceed 255 characters.',
            'department_id.exists' => 'Selected department does not exist.',
            'fiscal_year.required' => 'Fiscal year is required.',
            'fiscal_year.integer' => 'Fiscal year must be a whole number.',
            'fiscal_year.min' => 'Fiscal year must be at least 2020.',
            'fiscal_year.max' => 'Fiscal year must not exceed 2030.',
            'planned_headcount.required' => 'Planned headcount is required.',
            'planned_headcount.integer' => 'Planned headcount must be a whole number.',
            'planned_headcount.min' => 'Planned headcount must be at least 0.',
            'current_headcount.integer' => 'Current headcount must be a whole number.',
            'current_headcount.min' => 'Current headcount must be at least 0.',
            'budget.numeric' => 'Budget must be a number.',
            'budget.min' => 'Budget must be at least 0.',
            'description.max' => 'Description must not exceed 2000 characters.',
            'positions.*.designation_id.required' => 'Position designation is required.',
            'positions.*.designation_id.exists' => 'Selected designation does not exist.',
            'positions.*.count.required' => 'Position count is required.',
            'positions.*.count.integer' => 'Position count must be a whole number.',
            'positions.*.count.min' => 'Position count must be at least 1.',
            'positions.*.priority.in' => 'Position priority must be one of: low, medium, high, critical.',
            'positions.*.justification.max' => 'Position justification must not exceed 500 characters.',
            'status.in' => 'Status must be one of: draft, submitted, approved, rejected.',
        ];
    }
}
