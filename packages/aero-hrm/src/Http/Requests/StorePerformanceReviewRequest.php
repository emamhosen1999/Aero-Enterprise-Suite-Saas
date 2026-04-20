<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePerformanceReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'reviewer_id' => ['required', 'exists:users,id'],
            'review_period_start' => ['required', 'date'],
            'review_period_end' => ['required', 'date', 'after:review_period_start'],
            'template_id' => ['nullable', 'exists:performance_review_templates,id'],
            'type' => ['required', 'in:annual,quarterly,probation,project'],
            'overall_rating' => ['nullable', 'numeric', 'between:1,5'],
            'strengths' => ['nullable', 'string', 'max:2000'],
            'improvements' => ['nullable', 'string', 'max:2000'],
            'goals' => ['nullable', 'string', 'max:2000'],
            'comments' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:draft,in_progress,completed,acknowledged'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'The employee is required.',
            'employee_id.exists' => 'The selected employee does not exist.',
            'reviewer_id.required' => 'The reviewer is required.',
            'reviewer_id.exists' => 'The selected reviewer does not exist.',
            'review_period_start.required' => 'The review period start date is required.',
            'review_period_end.required' => 'The review period end date is required.',
            'review_period_end.after' => 'The review period end date must be after the start date.',
            'template_id.exists' => 'The selected review template does not exist.',
            'type.required' => 'The review type is required.',
            'type.in' => 'The review type must be one of: annual, quarterly, probation, project.',
            'overall_rating.between' => 'The overall rating must be between 1 and 5.',
            'status.in' => 'The status must be one of: draft, in progress, completed, acknowledged.',
        ];
    }
}
