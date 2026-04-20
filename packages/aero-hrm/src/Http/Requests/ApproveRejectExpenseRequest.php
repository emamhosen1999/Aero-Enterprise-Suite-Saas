<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveRejectExpenseRequest extends FormRequest
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
            'approved_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'The approval status is required.',
            'status.in' => 'The status must be either approved or rejected.',
            'rejection_reason.required_if' => 'A rejection reason is required when rejecting an expense.',
            'approved_amount.min' => 'The approved amount must be at least 0.',
        ];
    }
}
