<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalaryStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'components' => ['nullable', 'array'],
            'components.*.component_id' => ['required', 'exists:salary_components,id'],
            'components.*.amount' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'basic_salary.required' => 'Basic salary is required.',
            'basic_salary.numeric' => 'Basic salary must be a valid number.',
            'basic_salary.min' => 'Basic salary cannot be negative.',
            'components.array' => 'Components must be an array.',
            'components.*.component_id.required' => 'Salary component is required.',
            'components.*.component_id.exists' => 'Selected salary component does not exist.',
            'components.*.amount.required' => 'Component amount is required.',
            'components.*.amount.numeric' => 'Component amount must be a valid number.',
            'components.*.amount.min' => 'Component amount cannot be negative.',
            'effective_date.required' => 'Effective date is required.',
            'effective_date.date' => 'Effective date must be a valid date.',
        ];
    }
}
