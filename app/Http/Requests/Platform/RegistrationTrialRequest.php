<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

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
            // Admin user credentials
            'admin_name' => ['nullable', 'string', 'max:255'],
            'admin_email' => ['nullable', 'email:filter', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'password_confirmation' => ['required'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'accept_terms.accepted' => 'You must accept the terms of service to continue.',
            'password.required' => 'Please create a password for your admin account.',
            'password.confirmed' => 'The password confirmation does not match.',
            'password_confirmation.required' => 'Please confirm your password.',
        ];
    }
}
