<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOvertimeRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'date' => ['nullable', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'hours' => ['nullable', 'numeric', 'min:0.5', 'max:24'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'type' => ['nullable', 'in:regular,weekend,holiday'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'date.date' => 'Date must be a valid date.',
            'start_time.date_format' => 'Start time must be in HH:MM format.',
            'end_time.date_format' => 'End time must be in HH:MM format.',
            'end_time.after' => 'End time must be after the start time.',
            'hours.numeric' => 'Hours must be a number.',
            'hours.min' => 'Hours must be at least 0.5.',
            'hours.max' => 'Hours must not exceed 24.',
            'reason.max' => 'Reason must not exceed 1000 characters.',
            'type.in' => 'Overtime type must be one of: regular, weekend, holiday.',
        ];
    }
}
