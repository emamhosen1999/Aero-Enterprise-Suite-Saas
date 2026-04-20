<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePulseSurveyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.text' => ['required', 'string', 'max:500'],
            'questions.*.type' => ['required', 'in:rating,text,multiple_choice,yes_no'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.is_required' => ['nullable', 'boolean'],
            'target_departments' => ['nullable', 'array'],
            'target_departments.*' => ['exists:departments,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_anonymous' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:draft,active,closed'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Survey title is required.',
            'title.max' => 'Survey title must not exceed 255 characters.',
            'description.max' => 'Description must not exceed 1000 characters.',
            'questions.required' => 'At least one question is required.',
            'questions.min' => 'At least one question is required.',
            'questions.*.text.required' => 'Question text is required.',
            'questions.*.text.max' => 'Question text must not exceed 500 characters.',
            'questions.*.type.required' => 'Question type is required.',
            'questions.*.type.in' => 'Question type must be one of: rating, text, multiple_choice, yes_no.',
            'target_departments.*.exists' => 'Selected department does not exist.',
            'start_date.required' => 'Start date is required.',
            'start_date.date' => 'Start date must be a valid date.',
            'end_date.required' => 'End date is required.',
            'end_date.date' => 'End date must be a valid date.',
            'end_date.after' => 'End date must be after the start date.',
            'status.in' => 'Status must be one of: draft, active, closed.',
        ];
    }
}
