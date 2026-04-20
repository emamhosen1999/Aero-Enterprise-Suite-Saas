<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTrainingEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'training_id' => ['required', 'exists:trainings,id'],
            'employee_ids' => ['required', 'array', 'min:1'],
            'employee_ids.*' => ['exists:employees,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'training_id.required' => 'The training program is required.',
            'training_id.exists' => 'The selected training program does not exist.',
            'employee_ids.required' => 'At least one employee must be selected.',
            'employee_ids.min' => 'At least one employee must be selected.',
            'employee_ids.*.exists' => 'One or more selected employees do not exist.',
        ];
    }
}
