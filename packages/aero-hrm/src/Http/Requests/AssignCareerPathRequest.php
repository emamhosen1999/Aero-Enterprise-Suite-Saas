<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignCareerPathRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'career_path_id' => ['required', 'exists:career_paths,id'],
            'start_date' => ['required', 'date'],
            'target_completion_date' => ['nullable', 'date', 'after:start_date'],
            'mentor_id' => ['nullable', 'exists:employees,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'career_path_id.required' => 'Career path is required.',
            'career_path_id.exists' => 'Selected career path does not exist.',
            'start_date.required' => 'Start date is required.',
            'start_date.date' => 'Start date must be a valid date.',
            'target_completion_date.date' => 'Target completion date must be a valid date.',
            'target_completion_date.after' => 'Target completion date must be after the start date.',
            'mentor_id.exists' => 'Selected mentor does not exist.',
            'notes.max' => 'Notes must not exceed 1000 characters.',
        ];
    }
}
