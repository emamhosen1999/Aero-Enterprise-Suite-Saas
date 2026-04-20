<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCareerPathRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'milestones' => ['nullable', 'array'],
            'milestones.*.title' => ['required', 'string', 'max:255'],
            'milestones.*.description' => ['nullable', 'string', 'max:1000'],
            'milestones.*.required_skills' => ['nullable', 'array'],
            'milestones.*.required_skills.*' => ['string', 'max:100'],
            'milestones.*.estimated_duration_months' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Career path name is required.',
            'name.max' => 'Career path name must not exceed 255 characters.',
            'description.max' => 'Description must not exceed 2000 characters.',
            'department_id.exists' => 'Selected department does not exist.',
            'milestones.*.title.required' => 'Milestone title is required.',
            'milestones.*.title.max' => 'Milestone title must not exceed 255 characters.',
            'milestones.*.description.max' => 'Milestone description must not exceed 1000 characters.',
            'milestones.*.required_skills.*.max' => 'Each skill must not exceed 100 characters.',
            'milestones.*.estimated_duration_months.integer' => 'Estimated duration must be a whole number.',
            'milestones.*.estimated_duration_months.min' => 'Estimated duration must be at least 1 month.',
            'status.in' => 'Status must be one of: active, inactive.',
        ];
    }
}
