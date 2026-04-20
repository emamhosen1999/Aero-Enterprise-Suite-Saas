<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGrievanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'category_id' => ['nullable', 'exists:grievance_categories,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'is_anonymous' => ['nullable', 'boolean'],
            'desired_resolution' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'category_id.exists' => 'Selected grievance category does not exist.',
            'subject.required' => 'Subject is required.',
            'subject.max' => 'Subject must not exceed 255 characters.',
            'description.required' => 'Description is required.',
            'description.max' => 'Description must not exceed 5000 characters.',
            'priority.in' => 'Priority must be one of: low, medium, high, urgent.',
            'desired_resolution.max' => 'Desired resolution must not exceed 2000 characters.',
        ];
    }
}
