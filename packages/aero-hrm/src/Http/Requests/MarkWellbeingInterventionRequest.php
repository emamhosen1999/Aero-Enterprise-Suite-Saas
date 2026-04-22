<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkWellbeingInterventionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'note' => ['nullable', 'string', 'max:2000', 'required_without:notes'],
            'notes' => ['nullable', 'string', 'max:2000', 'required_without:note'],
            'intervention_type' => ['nullable', 'string', 'in:counselling,workload_reduction,leave_recommended,manager_meeting,wellness_program'],
            'follow_up_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'note.required_without' => 'Intervention note is required.',
            'notes.required_without' => 'Intervention note is required.',
            'note.max' => 'Intervention note must not exceed 2000 characters.',
            'notes.max' => 'Intervention note must not exceed 2000 characters.',
            'intervention_type.in' => 'Intervention type is invalid.',
            'follow_up_date.date' => 'Follow-up date must be a valid date.',
        ];
    }
}
