<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExitInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'interviewer_id' => ['required', 'exists:users,id'],
            'scheduled_date' => ['required', 'date'],
            'interview_type' => ['nullable', 'in:in_person,video,phone,written'],
            'overall_satisfaction' => ['nullable', 'integer', 'min:1', 'max:5'],
            'reason_for_leaving' => ['nullable', 'in:better_opportunity,compensation,management,work_life_balance,career_growth,relocation,personal,other'],
            'would_recommend' => ['nullable', 'boolean'],
            'feedback' => ['nullable', 'string', 'max:5000'],
            'improvements' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:scheduled,completed,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'interviewer_id.required' => 'Interviewer is required.',
            'interviewer_id.exists' => 'Selected interviewer does not exist.',
            'scheduled_date.required' => 'Scheduled date is required.',
            'scheduled_date.date' => 'Scheduled date must be a valid date.',
            'interview_type.in' => 'Interview type must be one of: in_person, video, phone, written.',
            'overall_satisfaction.integer' => 'Overall satisfaction must be a whole number.',
            'overall_satisfaction.min' => 'Overall satisfaction must be at least 1.',
            'overall_satisfaction.max' => 'Overall satisfaction must not exceed 5.',
            'reason_for_leaving.in' => 'Reason for leaving must be a valid option.',
            'feedback.max' => 'Feedback must not exceed 5000 characters.',
            'improvements.max' => 'Improvements must not exceed 2000 characters.',
            'status.in' => 'Status must be one of: scheduled, completed, cancelled.',
        ];
    }
}
