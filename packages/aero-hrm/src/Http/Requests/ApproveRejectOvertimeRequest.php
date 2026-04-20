<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveRejectOvertimeRequest extends FormRequest
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
            'approved_hours' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: approved, rejected.',
            'rejection_reason.required_if' => 'Rejection reason is required when rejecting overtime.',
            'rejection_reason.max' => 'Rejection reason must not exceed 1000 characters.',
            'approved_hours.numeric' => 'Approved hours must be a number.',
            'approved_hours.min' => 'Approved hours must be at least 0.',
        ];
    }
}
