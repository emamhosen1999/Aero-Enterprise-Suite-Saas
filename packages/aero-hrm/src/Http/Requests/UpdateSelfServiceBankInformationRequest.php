<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSelfServiceBankInformationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:100'],
            'account_holder_name' => ['required', 'string', 'max:255'],
            'account_type' => ['nullable', 'string', 'max:50'],
            'branch_name' => ['nullable', 'string', 'max:255'],
            'swift_code' => ['nullable', 'string', 'max:50'],
            'iban' => ['nullable', 'string', 'max:50'],
            'routing_number' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'bank_name.required' => 'Bank name is required.',
            'bank_name.max' => 'Bank name must not exceed 255 characters.',
            'account_number.required' => 'Account number is required.',
            'account_number.max' => 'Account number must not exceed 100 characters.',
            'account_holder_name.required' => 'Account holder name is required.',
            'account_holder_name.max' => 'Account holder name must not exceed 255 characters.',
            'account_type.max' => 'Account type must not exceed 50 characters.',
            'branch_name.max' => 'Branch name must not exceed 255 characters.',
            'swift_code.max' => 'SWIFT code must not exceed 50 characters.',
            'iban.max' => 'IBAN must not exceed 50 characters.',
            'routing_number.max' => 'Routing number must not exceed 50 characters.',
        ];
    }
}
