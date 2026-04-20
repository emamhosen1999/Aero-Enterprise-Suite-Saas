<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveRejectLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:approved,rejected'],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be approved or rejected.',
            'rejection_reason.required_if' => 'Rejection reason is required when rejecting a leave request.',
            'rejection_reason.max' => 'Rejection reason must not exceed 1000 characters.',
        ];
    }
}
