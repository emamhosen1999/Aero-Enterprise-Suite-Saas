<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitPulseSurveyResponseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'survey_id' => ['required', 'exists:pulse_surveys,id'],
            'responses' => ['required', 'array', 'min:1'],
            'responses.*.question_id' => ['required', 'integer'],
            'responses.*.answer' => ['required', 'string', 'max:1000'],
            'responses.*.rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ];
    }

    public function messages(): array
    {
        return [
            'survey_id.required' => 'Survey is required.',
            'survey_id.exists' => 'Selected survey does not exist.',
            'responses.required' => 'At least one response is required.',
            'responses.min' => 'At least one response is required.',
            'responses.*.question_id.required' => 'Question ID is required for each response.',
            'responses.*.question_id.integer' => 'Question ID must be an integer.',
            'responses.*.answer.required' => 'Answer is required for each response.',
            'responses.*.answer.max' => 'Answer must not exceed 1000 characters.',
            'responses.*.rating.integer' => 'Rating must be a whole number.',
            'responses.*.rating.min' => 'Rating must be at least 1.',
            'responses.*.rating.max' => 'Rating must not exceed 5.',
        ];
    }
}
