<?php

namespace Aero\Core\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // HRMAC middleware handles authorization
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'type' => ['required', 'string', 'in:info,warning,success,danger'],
            'priority' => ['required', 'string', 'in:low,normal,high,urgent'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'is_pinned' => ['boolean'],
            'is_dismissible' => ['boolean'],
            'target_roles' => ['nullable', 'array'],
            'target_roles.*' => ['integer', 'exists:roles,id'],
            'target_departments' => ['nullable', 'array'],
            'target_departments.*' => ['integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Announcement title is required.',
            'body.required' => 'Announcement body is required.',
            'body.max' => 'Announcement body must not exceed 5000 characters.',
            'type.in' => 'Invalid announcement type.',
            'priority.in' => 'Invalid priority level.',
            'expires_at.after' => 'Expiry date must be after the start date.',
        ];
    }
}
