<?php

namespace Aero\Platform\Http\Requests;

use Aero\Platform\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegistrationDetailsRequest extends FormRequest
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
     * Email and subdomain uniqueness is validated against non-pending tenants only.
     * This allows users to resume incomplete registrations with the same credentials.
     * Pending/failed tenants can be "taken over" by the new registration attempt.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => [
                'required',
                'email:filter',
                'max:150',
                Rule::unique('tenants', 'email')
                    ->where(function ($query) {
                        // Only block if there's an active/provisioning/suspended tenant
                        // Allow pending/failed tenants to be resumed
                        $query->whereNotIn('status', [
                            Tenant::STATUS_PENDING,
                            Tenant::STATUS_FAILED,
                        ]);
                    }),
            ],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^\+?[1-9]\d{1,14}$/'],
            'subdomain' => [
                'required',
                'string',
                'max:40',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('tenants', 'subdomain')
                    ->where(function ($query) {
                        // Only block if there's an active/provisioning/suspended tenant
                        // Allow pending/failed tenants to be resumed
                        $query->whereNotIn('status', [
                            Tenant::STATUS_PENDING,
                            Tenant::STATUS_FAILED,
                        ]);
                    }),
            ],
            'team_size' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ];
    }

    public function messages(): array
    {
        return [
            'subdomain.regex' => 'Subdomain may only contain lowercase letters, numbers, and single hyphens.',
            'email.unique' => 'This email is already registered with an active workspace.',
            'subdomain.unique' => 'This subdomain is already in use by an active workspace.',
            'phone.regex' => 'Please enter a valid phone number in international format (e.g., +1234567890).',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('subdomain')) {
            $this->merge([
                'subdomain' => strtolower((string) $this->input('subdomain')),
            ]);
        }
    }
}
