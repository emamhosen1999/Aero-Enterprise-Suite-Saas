<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveAccrualRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'leave_type_id' => ['required', 'integer', 'exists:leave_settings,id'],
            'accrual_frequency' => ['required', 'in:monthly,bi-weekly,weekly,annually'],
            'accrual_rate' => ['required', 'numeric', 'min:0.01', 'max:365'],
            'max_balance' => ['nullable', 'numeric', 'min:0'],
            'min_service_months' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'carry_forward' => ['boolean'],
            'max_carry_forward_days' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Rule name is required.',
            'name.max' => 'Rule name must not exceed 255 characters.',
            'leave_type_id.required' => 'Leave type is required.',
            'leave_type_id.exists' => 'The selected leave type does not exist.',
            'accrual_frequency.required' => 'Accrual frequency is required.',
            'accrual_frequency.in' => 'Accrual frequency must be monthly, bi-weekly, weekly, or annually.',
            'accrual_rate.required' => 'Accrual rate is required.',
            'accrual_rate.numeric' => 'Accrual rate must be a number.',
            'accrual_rate.min' => 'Accrual rate must be at least 0.01 days.',
            'accrual_rate.max' => 'Accrual rate must not exceed 365 days.',
            'max_balance.numeric' => 'Maximum balance must be a number.',
            'max_balance.min' => 'Maximum balance must be at least 0.',
            'min_service_months.integer' => 'Minimum service months must be a whole number.',
            'min_service_months.min' => 'Minimum service months must be at least 0.',
            'max_carry_forward_days.numeric' => 'Maximum carry-forward days must be a number.',
            'max_carry_forward_days.min' => 'Maximum carry-forward days must be at least 0.',
            'notes.max' => 'Notes must not exceed 1000 characters.',
        ];
    }
}
