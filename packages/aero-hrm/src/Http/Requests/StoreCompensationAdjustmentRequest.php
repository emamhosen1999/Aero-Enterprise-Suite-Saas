<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompensationAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'review_id' => ['nullable', 'exists:compensation_reviews,id'],
            'adjustment_type' => ['required', 'in:salary_increase,bonus,promotion,market_adjustment,equity'],
            'current_salary' => ['required', 'numeric', 'min:0'],
            'new_salary' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['required', 'date'],
            'reason' => ['required', 'string', 'max:1000'],
            'percentage_change' => ['nullable', 'numeric'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'review_id.exists' => 'Selected compensation review does not exist.',
            'adjustment_type.required' => 'Adjustment type is required.',
            'adjustment_type.in' => 'Adjustment type must be one of: salary_increase, bonus, promotion, market_adjustment, equity.',
            'current_salary.required' => 'Current salary is required.',
            'current_salary.numeric' => 'Current salary must be a number.',
            'current_salary.min' => 'Current salary must be at least 0.',
            'new_salary.required' => 'New salary is required.',
            'new_salary.numeric' => 'New salary must be a number.',
            'new_salary.min' => 'New salary must be at least 0.',
            'effective_date.required' => 'Effective date is required.',
            'effective_date.date' => 'Effective date must be a valid date.',
            'reason.required' => 'Reason is required.',
            'reason.max' => 'Reason must not exceed 1000 characters.',
            'percentage_change.numeric' => 'Percentage change must be a number.',
        ];
    }
}
