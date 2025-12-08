<?php

namespace Aero\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegistrationTrialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'accept_terms' => ['accepted'],
            'notify_updates' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'accept_terms.accepted' => 'You must accept the terms of service to continue.',
        ];
    }
}
