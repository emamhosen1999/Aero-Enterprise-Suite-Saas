<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkBulkAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'employees' => ['required', 'array', 'min:1'],
            'employees.*.employee_id' => ['required', 'exists:employees,id'],
            'employees.*.status' => ['required', 'in:present,absent,late,half_day,on_leave'],
            'employees.*.clock_in' => ['nullable', 'date_format:H:i'],
            'employees.*.clock_out' => ['nullable', 'date_format:H:i'],
            'employees.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'Attendance date is required.',
            'date.date' => 'Please provide a valid date.',
            'employees.required' => 'At least one employee is required.',
            'employees.array' => 'Employees must be a list.',
            'employees.min' => 'At least one employee is required.',
            'employees.*.employee_id.required' => 'Employee ID is required for each entry.',
            'employees.*.employee_id.exists' => 'One or more selected employees do not exist.',
            'employees.*.status.required' => 'Attendance status is required for each employee.',
            'employees.*.status.in' => 'Status must be present, absent, late, half day, or on leave.',
            'employees.*.clock_in.date_format' => 'Clock in must be in HH:MM format.',
            'employees.*.clock_out.date_format' => 'Clock out must be in HH:MM format.',
            'employees.*.notes.max' => 'Notes must not exceed 500 characters.',
        ];
    }
}
