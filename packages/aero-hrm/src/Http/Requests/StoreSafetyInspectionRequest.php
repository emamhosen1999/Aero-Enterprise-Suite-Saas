<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSafetyInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'inspector_id' => ['required', 'exists:users,id'],
            'scheduled_date' => ['required', 'date'],
            'location' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:routine,follow_up,spot_check,regulatory'],
            'checklist_items' => ['nullable', 'array'],
            'checklist_items.*.description' => ['required', 'string', 'max:500'],
            'checklist_items.*.passed' => ['nullable', 'boolean'],
            'checklist_items.*.notes' => ['nullable', 'string', 'max:500'],
            'findings' => ['nullable', 'string', 'max:5000'],
            'overall_rating' => ['nullable', 'in:pass,fail,conditional'],
            'status' => ['nullable', 'in:scheduled,in_progress,completed'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'title.max' => 'Title must not exceed 255 characters.',
            'inspector_id.required' => 'Inspector is required.',
            'inspector_id.exists' => 'Selected inspector does not exist.',
            'scheduled_date.required' => 'Scheduled date is required.',
            'scheduled_date.date' => 'Scheduled date must be a valid date.',
            'location.required' => 'Location is required.',
            'location.max' => 'Location must not exceed 255 characters.',
            'type.required' => 'Inspection type is required.',
            'type.in' => 'Type must be one of: routine, follow_up, spot_check, regulatory.',
            'checklist_items.*.description.required' => 'Checklist item description is required.',
            'checklist_items.*.description.max' => 'Checklist item description must not exceed 500 characters.',
            'checklist_items.*.notes.max' => 'Checklist item notes must not exceed 500 characters.',
            'findings.max' => 'Findings must not exceed 5000 characters.',
            'overall_rating.in' => 'Overall rating must be one of: pass, fail, conditional.',
            'status.in' => 'Status must be one of: scheduled, in_progress, completed.',
        ];
    }
}
