<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDisciplinaryCaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'type_id' => ['required', 'exists:disciplinary_action_types,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'incident_date' => ['required', 'date'],
            'severity' => ['required', 'in:low,medium,high,critical'],
            'witnesses' => ['nullable', 'array'],
            'witnesses.*' => ['string', 'max:255'],
            'evidence' => ['nullable', 'array'],
            'evidence.*' => ['file', 'max:10240'],
            'status' => ['nullable', 'in:reported,under_investigation,hearing,action_taken,closed,appealed'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'type_id.required' => 'Disciplinary action type is required.',
            'type_id.exists' => 'Selected disciplinary action type does not exist.',
            'subject.required' => 'Subject is required.',
            'subject.max' => 'Subject must not exceed 255 characters.',
            'description.required' => 'Description is required.',
            'description.max' => 'Description must not exceed 5000 characters.',
            'incident_date.required' => 'Incident date is required.',
            'incident_date.date' => 'Incident date must be a valid date.',
            'severity.required' => 'Severity level is required.',
            'severity.in' => 'Severity must be one of: low, medium, high, critical.',
            'witnesses.*.max' => 'Each witness name must not exceed 255 characters.',
            'evidence.*.file' => 'Each evidence item must be a valid file.',
            'evidence.*.max' => 'Each evidence file must not exceed 10MB.',
            'status.in' => 'Status must be one of: reported, under_investigation, hearing, action_taken, closed, appealed.',
        ];
    }
}
