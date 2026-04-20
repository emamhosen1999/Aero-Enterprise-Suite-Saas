<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['nullable', 'exists:training_categories,id'],
            'trainer_name' => ['nullable', 'string', 'max:255'],
            'trainer_email' => ['nullable', 'email'],
            'training_type' => ['nullable', 'in:online,classroom,workshop,webinar,on_the_job'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'is_mandatory' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:draft,scheduled,in_progress,completed,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'The training title is required.',
            'category_id.exists' => 'The selected training category does not exist.',
            'trainer_email.email' => 'The trainer email must be a valid email address.',
            'training_type.in' => 'The training type must be one of: online, classroom, workshop, webinar, on the job.',
            'end_date.after_or_equal' => 'The end date must be on or after the start date.',
            'max_participants.min' => 'The maximum participants must be at least 1.',
            'cost.min' => 'The cost must be at least 0.',
            'status.in' => 'The status must be one of: draft, scheduled, in progress, completed, cancelled.',
        ];
    }
}
