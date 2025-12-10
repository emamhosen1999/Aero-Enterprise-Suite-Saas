<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update-attendance-settings');
    }

    public function rules(): array
    {
        return [
            'office_start_time' => 'required|date_format:H:i',
            'office_end_time' => 'required|date_format:H:i',
            'break_time_duration' => 'required|integer|min:0|max:480',
            'late_mark_after' => 'required|integer|min:0|max:120',
            'early_leave_before' => 'required|integer|min:0|max:120',
            'overtime_after' => 'required|integer|min:0|max:120',
            'allow_punch_from_mobile' => 'required|boolean',
            'auto_punch_out' => 'required|boolean',
            'auto_punch_out_time' => 'nullable|date_format:H:i',
            'attendance_validation_type' => 'required|string|in:location,ip,both',
            'location_radius' => 'nullable|integer|min:10|max:5000',
            'allowed_ips' => 'nullable|string',
            'require_location_services' => 'required|boolean',
            'weekend_days' => 'required|array',
            'weekend_days.*' => 'string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
        ];
    }

    public function messages(): array
    {
        return [
            'office_start_time.required' => 'Office start time is required.',
            'office_end_time.required' => 'Office end time is required.',
            'break_time_duration.required' => 'Break time duration is required.',
            'late_mark_after.required' => 'Late mark threshold is required.',
            'attendance_validation_type.required' => 'Attendance validation type is required.',
            'weekend_days.required' => 'Weekend days selection is required.',
        ];
    }
}
