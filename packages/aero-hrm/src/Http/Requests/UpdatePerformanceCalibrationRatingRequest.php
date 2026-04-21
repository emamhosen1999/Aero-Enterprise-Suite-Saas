<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePerformanceCalibrationRatingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:users,id'],
            'overall_rating' => ['required', 'numeric', 'min:1', 'max:5'],
            'comments' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'overall_rating.required' => 'Rating is required.',
            'overall_rating.numeric' => 'Rating must be a numeric value.',
            'overall_rating.min' => 'Rating must be at least 1.',
            'overall_rating.max' => 'Rating must not exceed 5.',
            'comments.max' => 'Comments must not exceed 2000 characters.',
        ];
    }
}
