<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShiftScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'break_duration' => ['nullable', 'integer', 'min:0', 'max:120'],
            'grace_period' => ['nullable', 'integer', 'min:0', 'max:60'],
            'is_night_shift' => ['nullable', 'boolean'],
            'applicable_days' => ['nullable', 'array'],
            'applicable_days.*' => ['in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Shift name is required.',
            'name.max' => 'Shift name must not exceed 255 characters.',
            'start_time.required' => 'Start time is required.',
            'start_time.date_format' => 'Start time must be in HH:MM format.',
            'end_time.required' => 'End time is required.',
            'end_time.date_format' => 'End time must be in HH:MM format.',
            'break_duration.integer' => 'Break duration must be a whole number.',
            'break_duration.min' => 'Break duration cannot be negative.',
            'break_duration.max' => 'Break duration cannot exceed 120 minutes.',
            'grace_period.integer' => 'Grace period must be a whole number.',
            'grace_period.min' => 'Grace period cannot be negative.',
            'grace_period.max' => 'Grace period cannot exceed 60 minutes.',
            'is_night_shift.boolean' => 'Night shift must be true or false.',
            'applicable_days.array' => 'Applicable days must be a list.',
            'applicable_days.*.in' => 'Each day must be a valid day of the week.',
            'status.in' => 'Status must be active or inactive.',
        ];
    }
}
