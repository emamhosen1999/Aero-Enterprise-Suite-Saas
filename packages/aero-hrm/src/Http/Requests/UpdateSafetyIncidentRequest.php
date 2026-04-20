<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSafetyIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'incident_date' => ['nullable', 'date'],
            'incident_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'severity' => ['nullable', 'in:minor,moderate,major,critical'],
            'type' => ['nullable', 'in:injury,near_miss,property_damage,environmental,illness'],
            'reported_by' => ['nullable', 'exists:employees,id'],
            'involved_employees' => ['nullable', 'array'],
            'involved_employees.*' => ['exists:employees,id'],
            'witnesses' => ['nullable', 'array'],
            'witnesses.*' => ['string', 'max:255'],
            'immediate_action' => ['nullable', 'string', 'max:2000'],
            'root_cause' => ['nullable', 'string', 'max:2000'],
            'corrective_action' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:reported,under_investigation,resolved,closed'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'title.max' => 'Title must not exceed 255 characters.',
            'description.max' => 'Description must not exceed 5000 characters.',
            'incident_date.date' => 'Incident date must be a valid date.',
            'incident_time.date_format' => 'Incident time must be in HH:MM format.',
            'location.max' => 'Location must not exceed 255 characters.',
            'severity.in' => 'Severity must be one of: minor, moderate, major, critical.',
            'type.in' => 'Type must be one of: injury, near_miss, property_damage, environmental, illness.',
            'reported_by.exists' => 'Selected reporter does not exist.',
            'involved_employees.*.exists' => 'Selected involved employee does not exist.',
            'witnesses.*.max' => 'Each witness name must not exceed 255 characters.',
            'immediate_action.max' => 'Immediate action must not exceed 2000 characters.',
            'root_cause.max' => 'Root cause must not exceed 2000 characters.',
            'corrective_action.max' => 'Corrective action must not exceed 2000 characters.',
            'status.in' => 'Status must be one of: reported, under_investigation, resolved, closed.',
        ];
    }
}
