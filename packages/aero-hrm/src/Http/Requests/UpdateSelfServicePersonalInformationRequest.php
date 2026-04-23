<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSelfServicePersonalInformationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'birthday' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female,other,prefer_not_to_say'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'marital_status' => ['nullable', 'in:single,married,divorced,widowed'],
            'passport_no' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'birthday.date' => 'Please provide a valid birthday date.',
            'gender.in' => 'Please select a valid gender option.',
            'nationality.max' => 'Nationality must not exceed 100 characters.',
            'marital_status.in' => 'Please select a valid marital status.',
            'passport_no.max' => 'Passport number must not exceed 100 characters.',
        ];
    }
}
