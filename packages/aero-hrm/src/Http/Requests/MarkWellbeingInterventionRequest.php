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
            'note' => ['required', 'string', 'max:2000'],
            'follow_up_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'note.required' => 'Intervention note is required.',
            'note.max' => 'Intervention note must not exceed 2000 characters.',
            'follow_up_date.date' => 'Follow-up date must be a valid date.',
        ];
    }
}
