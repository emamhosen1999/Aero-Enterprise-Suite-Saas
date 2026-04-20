<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:leave_settings,code'],
            'days_allowed' => ['required', 'integer', 'min:0', 'max:365'],
            'carry_forward' => ['nullable', 'boolean'],
            'max_carry_forward' => ['nullable', 'required_if:carry_forward,true', 'integer', 'min:0'],
            'applicable_gender' => ['nullable', 'in:all,male,female'],
            'is_paid' => ['nullable', 'boolean'],
            'requires_approval' => ['nullable', 'boolean'],
            'min_days' => ['nullable', 'integer', 'min:1'],
            'max_days' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Leave type name is required.',
            'name.max' => 'Leave type name must not exceed 255 characters.',
            'code.required' => 'Leave type code is required.',
            'code.max' => 'Leave type code must not exceed 50 characters.',
            'code.unique' => 'This leave type code is already in use.',
            'days_allowed.required' => 'Days allowed is required.',
            'days_allowed.integer' => 'Days allowed must be a whole number.',
            'days_allowed.min' => 'Days allowed cannot be negative.',
            'days_allowed.max' => 'Days allowed cannot exceed 365.',
            'max_carry_forward.required_if' => 'Maximum carry forward days is required when carry forward is enabled.',
            'max_carry_forward.integer' => 'Maximum carry forward must be a whole number.',
            'max_carry_forward.min' => 'Maximum carry forward cannot be negative.',
            'applicable_gender.in' => 'Applicable gender must be all, male, or female.',
            'min_days.integer' => 'Minimum days must be a whole number.',
            'min_days.min' => 'Minimum days must be at least 1.',
            'max_days.integer' => 'Maximum days must be a whole number.',
            'max_days.min' => 'Maximum days must be at least 1.',
            'description.max' => 'Description must not exceed 1000 characters.',
            'status.in' => 'Status must be active or inactive.',
        ];
    }
}
