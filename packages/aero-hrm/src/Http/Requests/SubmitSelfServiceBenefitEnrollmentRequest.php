<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitSelfServiceBenefitEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'benefit_plan_id' => ['required', 'integer', 'exists:benefit_plans,id'],
            'coverage_level' => ['required', 'in:employee_only,employee_spouse,employee_children,family'],
            'effective_date' => ['nullable', 'date'],
            'dependents' => ['nullable', 'array'],
            'beneficiaries' => ['nullable', 'array'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'benefit_plan_id.required' => 'Please select a benefit plan.',
            'benefit_plan_id.exists' => 'The selected benefit plan is invalid.',
            'coverage_level.required' => 'Please choose a coverage level.',
            'coverage_level.in' => 'The selected coverage level is invalid.',
            'effective_date.date' => 'Please provide a valid effective date.',
            'dependents.array' => 'Dependents must be provided as a list.',
            'beneficiaries.array' => 'Beneficiaries must be provided as a list.',
            'notes.max' => 'Notes may not be greater than 1000 characters.',
        ];
    }
}
