<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessPayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'in:process,lock,rollback,approve'],
            'payroll_id' => ['required', 'exists:payrolls,id'],
            'reason' => ['nullable', 'required_if:action,rollback', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'Payroll action is required.',
            'action.in' => 'Action must be process, lock, rollback, or approve.',
            'payroll_id.required' => 'Payroll ID is required.',
            'payroll_id.exists' => 'Selected payroll does not exist.',
            'reason.required_if' => 'A reason is required when rolling back payroll.',
            'reason.max' => 'Reason must not exceed 1000 characters.',
        ];
    }
}
