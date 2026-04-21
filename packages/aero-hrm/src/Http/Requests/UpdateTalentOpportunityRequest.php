<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTalentOpportunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'department_id' => ['sometimes', 'required', 'exists:departments,id'],
            'type' => ['sometimes', 'required', 'in:promotion,transfer,project,training'],
            'status' => ['nullable', 'in:open,closed,on_hold'],
            'application_deadline' => ['nullable', 'date'],
            'required_skills' => ['nullable', 'array'],
            'required_skills.*' => ['string', 'max:120'],
            'requirements' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'department_id.exists' => 'Selected department does not exist.',
            'type.in' => 'Opportunity type must be one of: promotion, transfer, project, training.',
            'status.in' => 'Status must be one of: open, closed, on_hold.',
            'application_deadline.date' => 'Application deadline must be a valid date.',
            'required_skills.array' => 'Required skills must be an array.',
            'required_skills.*.string' => 'Each required skill must be text.',
            'required_skills.*.max' => 'Each required skill must not exceed 120 characters.',
        ];
    }
}
