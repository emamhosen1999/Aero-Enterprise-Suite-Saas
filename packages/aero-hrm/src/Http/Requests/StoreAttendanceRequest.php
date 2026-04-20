<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
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
            'status' => ['required', 'in:present,absent,late,half_day,on_leave'],
            'clock_in' => ['nullable', 'date_format:H:i'],
            'clock_out' => ['nullable', 'date_format:H:i', 'after:clock_in'],
            'notes' => ['nullable', 'string', 'max:500'],
            'work_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'The selected employee does not exist.',
            'date.required' => 'Attendance date is required.',
            'date.date' => 'Please provide a valid date.',
            'status.required' => 'Attendance status is required.',
            'status.in' => 'Status must be present, absent, late, half day, or on leave.',
            'clock_in.date_format' => 'Clock in must be in HH:MM format.',
            'clock_out.date_format' => 'Clock out must be in HH:MM format.',
            'clock_out.after' => 'Clock out must be after clock in.',
            'notes.max' => 'Notes must not exceed 500 characters.',
            'work_hours.numeric' => 'Work hours must be a number.',
            'work_hours.min' => 'Work hours cannot be negative.',
            'work_hours.max' => 'Work hours cannot exceed 24.',
        ];
    }
}
