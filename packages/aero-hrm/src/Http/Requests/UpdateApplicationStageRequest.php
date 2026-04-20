<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stage_id' => ['required', 'exists:job_hiring_stages,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'stage_id.required' => 'Hiring stage is required.',
            'stage_id.exists' => 'Selected hiring stage does not exist.',
            'notes.max' => 'Notes must not exceed 1000 characters.',
        ];
    }
}
