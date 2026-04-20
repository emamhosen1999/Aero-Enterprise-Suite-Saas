<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOvertimeRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'hours' => ['required', 'numeric', 'min:0.5', 'max:24'],
            'reason' => ['required', 'string', 'max:1000'],
            'type' => ['nullable', 'in:regular,weekend,holiday'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date.',
            'start_time.required' => 'Start time is required.',
            'start_time.date_format' => 'Start time must be in HH:MM format.',
            'end_time.required' => 'End time is required.',
            'end_time.date_format' => 'End time must be in HH:MM format.',
            'end_time.after' => 'End time must be after the start time.',
            'hours.required' => 'Hours are required.',
            'hours.numeric' => 'Hours must be a number.',
            'hours.min' => 'Hours must be at least 0.5.',
            'hours.max' => 'Hours must not exceed 24.',
            'reason.required' => 'Reason is required.',
            'reason.max' => 'Reason must not exceed 1000 characters.',
            'type.in' => 'Overtime type must be one of: regular, weekend, holiday.',
        ];
    }
}
