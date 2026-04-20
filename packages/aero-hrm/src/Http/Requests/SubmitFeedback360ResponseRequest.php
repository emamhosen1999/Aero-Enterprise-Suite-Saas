<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFeedback360ResponseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'feedback_id' => ['required', 'exists:feedback_360s,id'],
            'responses' => ['required', 'array', 'min:1'],
            'responses.*.question' => ['required', 'string', 'max:500'],
            'responses.*.rating' => ['required', 'integer', 'min:1', 'max:5'],
            'responses.*.comment' => ['nullable', 'string', 'max:1000'],
            'overall_comment' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'feedback_id.required' => 'Feedback ID is required.',
            'feedback_id.exists' => 'Selected feedback does not exist.',
            'responses.required' => 'At least one response is required.',
            'responses.min' => 'At least one response is required.',
            'responses.*.question.required' => 'Question is required for each response.',
            'responses.*.question.max' => 'Question must not exceed 500 characters.',
            'responses.*.rating.required' => 'Rating is required for each response.',
            'responses.*.rating.integer' => 'Rating must be a whole number.',
            'responses.*.rating.min' => 'Rating must be at least 1.',
            'responses.*.rating.max' => 'Rating must not exceed 5.',
            'responses.*.comment.max' => 'Comment must not exceed 1000 characters.',
            'overall_comment.max' => 'Overall comment must not exceed 2000 characters.',
        ];
    }
}
