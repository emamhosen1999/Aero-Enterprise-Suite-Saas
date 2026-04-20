<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGrievanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['nullable', 'exists:employees,id'],
            'category_id' => ['nullable', 'exists:grievance_categories,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'is_anonymous' => ['nullable', 'boolean'],
            'desired_resolution' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:submitted,under_review,investigating,resolved,closed'],
            'investigator_id' => ['nullable', 'exists:users,id'],
            'resolution' => ['nullable', 'string', 'max:2000'],
            'resolution_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.exists' => 'Selected employee does not exist.',
            'category_id.exists' => 'Selected grievance category does not exist.',
            'subject.required' => 'Subject is required.',
            'subject.max' => 'Subject must not exceed 255 characters.',
            'description.max' => 'Description must not exceed 5000 characters.',
            'priority.in' => 'Priority must be one of: low, medium, high, urgent.',
            'desired_resolution.max' => 'Desired resolution must not exceed 2000 characters.',
            'status.in' => 'Status must be one of: submitted, under_review, investigating, resolved, closed.',
            'investigator_id.exists' => 'Selected investigator does not exist.',
            'resolution.max' => 'Resolution must not exceed 2000 characters.',
            'resolution_date.date' => 'Resolution date must be a valid date.',
        ];
    }
}
