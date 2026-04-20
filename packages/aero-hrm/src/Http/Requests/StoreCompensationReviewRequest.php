<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompensationReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'review_period_start' => ['required', 'date'],
            'review_period_end' => ['required', 'date', 'after:review_period_start'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'in:draft,in_progress,completed,approved'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'title.max' => 'Title must not exceed 255 characters.',
            'review_period_start.required' => 'Review period start date is required.',
            'review_period_start.date' => 'Review period start must be a valid date.',
            'review_period_end.required' => 'Review period end date is required.',
            'review_period_end.date' => 'Review period end must be a valid date.',
            'review_period_end.after' => 'Review period end must be after the start date.',
            'budget.numeric' => 'Budget must be a number.',
            'budget.min' => 'Budget must be at least 0.',
            'department_id.exists' => 'Selected department does not exist.',
            'description.max' => 'Description must not exceed 1000 characters.',
            'status.in' => 'Status must be one of: draft, in_progress, completed, approved.',
        ];
    }
}
