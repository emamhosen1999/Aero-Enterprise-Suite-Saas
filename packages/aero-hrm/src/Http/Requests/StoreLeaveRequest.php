<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'leave_type_id' => ['required', 'exists:leave_settings,id'],
            'from_date' => ['required', 'date', 'after_or_equal:today'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
            'half_day' => ['nullable', 'boolean'],
            'half_day_type' => ['nullable', 'required_if:half_day,true', 'in:first_half,second_half'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'User is required.',
            'user_id.exists' => 'The selected user does not exist.',
            'leave_type_id.required' => 'Leave type is required.',
            'leave_type_id.exists' => 'The selected leave type does not exist.',
            'from_date.required' => 'Start date is required.',
            'from_date.date' => 'Please provide a valid start date.',
            'from_date.after_or_equal' => 'Start date must be today or later.',
            'to_date.required' => 'End date is required.',
            'to_date.date' => 'Please provide a valid end date.',
            'to_date.after_or_equal' => 'End date must be on or after the start date.',
            'reason.required' => 'Reason for leave is required.',
            'reason.min' => 'Reason must be at least 5 characters.',
            'reason.max' => 'Reason must not exceed 1000 characters.',
            'half_day.boolean' => 'Half day must be true or false.',
            'half_day_type.required_if' => 'Half day type is required when applying for a half day.',
            'half_day_type.in' => 'Half day type must be first half or second half.',
        ];
    }
}
