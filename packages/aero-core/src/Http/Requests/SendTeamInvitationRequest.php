<?php

namespace Aero\Core\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * SendTeamInvitationRequest
 *
 * Validates the request for sending a team member invitation.
 */
class SendTeamInvitationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('users.invite') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'role' => [
                'required',
                'string',
                Rule::exists('roles', 'name')->where('guard_name', 'web'),
            ],
            'department_id' => [
                'nullable',
                'integer',
                Rule::exists('departments', 'id'),
            ],
            'designation_id' => [
                'nullable',
                'integer',
                Rule::exists('designations', 'id'),
            ],
            'message' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Please provide an email address.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'A user with this email already exists.',
            'role.required' => 'Please select a role for the team member.',
            'role.exists' => 'The selected role is invalid.',
            'message.max' => 'The personal message cannot exceed 500 characters.',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'email' => 'email address',
            'role' => 'role',
            'department_id' => 'department',
            'designation_id' => 'designation',
            'message' => 'personal message',
        ];
    }
}
