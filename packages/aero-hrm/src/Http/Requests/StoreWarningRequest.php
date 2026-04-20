<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWarningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'case_id' => ['nullable', 'exists:disciplinary_cases,id'],
            'type' => ['required', 'in:verbal,written,final'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'issued_date' => ['required', 'date'],
            'expiry_date' => ['nullable', 'date', 'after:issued_date'],
            'acknowledged' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'case_id.exists' => 'Selected disciplinary case does not exist.',
            'type.required' => 'Warning type is required.',
            'type.in' => 'Warning type must be one of: verbal, written, final.',
            'subject.required' => 'Subject is required.',
            'subject.max' => 'Subject must not exceed 255 characters.',
            'description.required' => 'Description is required.',
            'description.max' => 'Description must not exceed 2000 characters.',
            'issued_date.required' => 'Issued date is required.',
            'issued_date.date' => 'Issued date must be a valid date.',
            'expiry_date.date' => 'Expiry date must be a valid date.',
            'expiry_date.after' => 'Expiry date must be after the issued date.',
        ];
    }
}
