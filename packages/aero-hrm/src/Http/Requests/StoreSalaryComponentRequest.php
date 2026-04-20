<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalaryComponentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:salary_components,code'],
            'type' => ['required', 'in:earning,deduction'],
            'calculation_type' => ['required', 'in:fixed,percentage,formula'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_taxable' => ['nullable', 'boolean'],
            'is_mandatory' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Component name is required.',
            'name.max' => 'Component name must not exceed 255 characters.',
            'code.required' => 'Component code is required.',
            'code.max' => 'Component code must not exceed 50 characters.',
            'code.unique' => 'This component code is already in use.',
            'type.required' => 'Component type is required.',
            'type.in' => 'Type must be earning or deduction.',
            'calculation_type.required' => 'Calculation type is required.',
            'calculation_type.in' => 'Calculation type must be fixed, percentage, or formula.',
            'amount.numeric' => 'Amount must be a valid number.',
            'amount.min' => 'Amount cannot be negative.',
            'percentage.numeric' => 'Percentage must be a valid number.',
            'percentage.min' => 'Percentage cannot be negative.',
            'percentage.max' => 'Percentage cannot exceed 100.',
            'description.max' => 'Description must not exceed 500 characters.',
            'status.in' => 'Status must be active or inactive.',
        ];
    }
}
