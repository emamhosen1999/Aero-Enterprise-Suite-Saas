<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'designation_id' => ['nullable', 'exists:designations,id'],
            'job_type' => ['nullable', 'in:full_time,part_time,contract,internship,freelance'],
            'experience_min' => ['nullable', 'integer', 'min:0'],
            'experience_max' => ['nullable', 'integer', 'min:0', 'gte:experience_min'],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0', 'gte:salary_min'],
            'positions' => ['nullable', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'requirements' => ['nullable', 'string', 'max:5000'],
            'benefits' => ['nullable', 'string', 'max:2000'],
            'deadline' => ['nullable', 'date', 'after:today'],
            'status' => ['nullable', 'in:draft,published,closed'],
            'is_remote' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Job title is required.',
            'title.max' => 'Job title must not exceed 255 characters.',
            'department_id.exists' => 'Selected department does not exist.',
            'designation_id.exists' => 'Selected designation does not exist.',
            'job_type.in' => 'Job type must be full time, part time, contract, internship, or freelance.',
            'experience_min.integer' => 'Minimum experience must be a whole number.',
            'experience_min.min' => 'Minimum experience cannot be negative.',
            'experience_max.integer' => 'Maximum experience must be a whole number.',
            'experience_max.min' => 'Maximum experience cannot be negative.',
            'experience_max.gte' => 'Maximum experience must be greater than or equal to minimum experience.',
            'salary_min.numeric' => 'Minimum salary must be a valid number.',
            'salary_min.min' => 'Minimum salary cannot be negative.',
            'salary_max.numeric' => 'Maximum salary must be a valid number.',
            'salary_max.min' => 'Maximum salary cannot be negative.',
            'salary_max.gte' => 'Maximum salary must be greater than or equal to minimum salary.',
            'positions.integer' => 'Number of positions must be a whole number.',
            'positions.min' => 'At least one position is required.',
            'location.max' => 'Location must not exceed 255 characters.',
            'description.max' => 'Job description must not exceed 5000 characters.',
            'requirements.max' => 'Requirements must not exceed 5000 characters.',
            'benefits.max' => 'Benefits must not exceed 2000 characters.',
            'deadline.date' => 'Deadline must be a valid date.',
            'deadline.after' => 'Deadline must be a future date.',
            'status.in' => 'Status must be draft, published, or closed.',
        ];
    }
}
