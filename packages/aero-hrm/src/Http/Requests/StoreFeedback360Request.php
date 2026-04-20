<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeedback360Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'review_cycle' => ['required', 'string', 'max:100'],
            'reviewers' => ['required', 'array', 'min:1'],
            'reviewers.*.user_id' => ['required', 'exists:users,id'],
            'reviewers.*.relationship' => ['required', 'in:manager,peer,direct_report,self,external'],
            'deadline' => ['required', 'date', 'after:today'],
            'questions' => ['nullable', 'array'],
            'questions.*' => ['string', 'max:500'],
            'status' => ['nullable', 'in:draft,active,completed'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'review_cycle.required' => 'Review cycle is required.',
            'review_cycle.max' => 'Review cycle must not exceed 100 characters.',
            'reviewers.required' => 'At least one reviewer is required.',
            'reviewers.min' => 'At least one reviewer is required.',
            'reviewers.*.user_id.required' => 'Reviewer user is required.',
            'reviewers.*.user_id.exists' => 'Selected reviewer does not exist.',
            'reviewers.*.relationship.required' => 'Reviewer relationship is required.',
            'reviewers.*.relationship.in' => 'Reviewer relationship must be one of: manager, peer, direct_report, self, external.',
            'deadline.required' => 'Deadline is required.',
            'deadline.date' => 'Deadline must be a valid date.',
            'deadline.after' => 'Deadline must be after today.',
            'questions.*.max' => 'Each question must not exceed 500 characters.',
            'status.in' => 'Status must be one of: draft, active, completed.',
        ];
    }
}
