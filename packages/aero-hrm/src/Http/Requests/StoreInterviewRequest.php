<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'application_id' => ['required', 'exists:job_applications,id'],
            'interviewer_ids' => ['required', 'array', 'min:1'],
            'interviewer_ids.*' => ['exists:users,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['nullable', 'integer', 'between:15,480'],
            'type' => ['required', 'in:phone,video,in_person,panel'],
            'location' => ['nullable', 'string', 'max:255'],
            'meeting_link' => ['nullable', 'url', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'application_id.required' => 'The job application is required.',
            'application_id.exists' => 'The selected job application does not exist.',
            'interviewer_ids.required' => 'At least one interviewer is required.',
            'interviewer_ids.min' => 'At least one interviewer must be selected.',
            'interviewer_ids.*.exists' => 'One or more selected interviewers do not exist.',
            'scheduled_at.required' => 'The interview schedule date is required.',
            'scheduled_at.after' => 'The interview must be scheduled in the future.',
            'duration_minutes.between' => 'The interview duration must be between 15 and 480 minutes.',
            'type.required' => 'The interview type is required.',
            'type.in' => 'The interview type must be one of: phone, video, in person, panel.',
            'meeting_link.url' => 'The meeting link must be a valid URL.',
        ];
    }
}
