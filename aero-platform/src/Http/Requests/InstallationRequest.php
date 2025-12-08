<?php

namespace Aero\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InstallationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only authorized if secret code has been verified
        return session('installation_verified', false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // No input validation needed - all data comes from session
        return [];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Verify all required session data exists
            if (! session('db_config')) {
                $validator->errors()->add('session', 'Database configuration is missing. Please complete all steps.');
            }

            if (! session('platform_config')) {
                $validator->errors()->add('session', 'Platform configuration is missing. Please complete all steps.');
            }

            if (! session('admin_config')) {
                $validator->errors()->add('session', 'Admin account configuration is missing. Please complete all steps.');
            }
        });
    }
}
