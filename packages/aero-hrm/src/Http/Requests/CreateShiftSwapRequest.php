<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateShiftSwapRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shift_schedule_id' => ['required', 'integer', 'exists:shift_schedules,id'],
            'request_type' => ['required', 'string', 'in:open_pickup,specific_swap'],
            'acceptor_id' => ['nullable', 'integer', 'exists:users,id'],
            'replacement_shift_id' => ['nullable', 'integer', 'exists:shift_schedules,id'],
            'reason' => ['required', 'string', 'max:1000', 'min:10'],
            'manager_approval_required' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'shift_schedule_id.required' => 'A shift schedule is required.',
            'shift_schedule_id.exists' => 'The selected shift schedule does not exist.',
            'request_type.required' => 'Request type is required.',
            'request_type.in' => 'Request type must be either open_pickup or specific_swap.',
            'acceptor_id.exists' => 'The selected acceptor does not exist.',
            'replacement_shift_id.exists' => 'The selected replacement shift does not exist.',
            'reason.required' => 'Please provide a reason for the shift swap.',
            'reason.max' => 'Reason must not exceed 1000 characters.',
            'reason.min' => 'Reason must be at least 10 characters.',
        ];
    }
}
