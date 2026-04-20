<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSuccessionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'position' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'current_holder_id' => ['nullable', 'exists:employees,id'],
            'criticality' => ['nullable', 'in:low,medium,high,critical'],
            'candidates' => ['nullable', 'array'],
            'candidates.*.employee_id' => ['required', 'exists:employees,id'],
            'candidates.*.readiness' => ['required', 'in:ready_now,ready_1_year,ready_2_years,development_needed'],
            'candidates.*.development_notes' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'in:draft,active,archived'],
        ];
    }

    public function messages(): array
    {
        return [
            'position.required' => 'Position is required.',
            'position.max' => 'Position must not exceed 255 characters.',
            'department_id.exists' => 'Selected department does not exist.',
            'current_holder_id.exists' => 'Selected current holder does not exist.',
            'criticality.in' => 'Criticality must be one of: low, medium, high, critical.',
            'candidates.*.employee_id.required' => 'Candidate employee is required.',
            'candidates.*.employee_id.exists' => 'Selected candidate does not exist.',
            'candidates.*.readiness.required' => 'Candidate readiness is required.',
            'candidates.*.readiness.in' => 'Readiness must be one of: ready_now, ready_1_year, ready_2_years, development_needed.',
            'candidates.*.development_notes.max' => 'Development notes must not exceed 1000 characters.',
            'status.in' => 'Status must be one of: draft, active, archived.',
        ];
    }
}
