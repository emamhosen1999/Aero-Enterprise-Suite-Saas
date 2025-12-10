<?php

namespace Aero\HRM\Http\Requests\HR;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Form Request for Employee Profile Update
 *
 * Handles validation for updating bank details and emergency contacts
 * in a single form submission with nested arrays.
 */
class UpdateEmployeeProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $userId = $this->route('user')?->id ?? $this->route('userId');

        return Auth::check() && (
            Auth::user()->can('hr.employees.update') ||
            Auth::user()->can('profile.own.update') ||
            Auth::id() === (int) $userId
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // =========================================================
            // BANK DETAILS (Single bank account - 1:1 relationship)
            // =========================================================
            'bank_details' => ['nullable', 'array'],
            'bank_details.bank_name' => [
                'required_with:bank_details',
                'string',
                'max:255',
            ],
            'bank_details.branch_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'bank_details.account_holder_name' => [
                'required_with:bank_details',
                'string',
                'max:255',
            ],
            'bank_details.account_number' => [
                'required_with:bank_details',
                'string',
                'max:50',
            ],
            'bank_details.swift_code' => [
                'nullable',
                'string',
                'max:20',
            ],
            'bank_details.iban' => [
                'nullable',
                'string',
                'max:50',
            ],
            'bank_details.routing_number' => [
                'nullable',
                'string',
                'max:20',
            ],
            'bank_details.account_type' => [
                'nullable',
                'string',
                Rule::in(['savings', 'current', 'salary']),
            ],
            'bank_details.tax_id' => [
                'nullable',
                'string',
                'max:100',
            ],
            'bank_details.currency' => [
                'nullable',
                'string',
                'size:3', // ISO 4217 currency code
            ],

            // =========================================================
            // EMERGENCY CONTACTS (Multiple contacts - 1:Many relationship)
            // =========================================================
            'emergency_contacts' => ['nullable', 'array', 'max:5'],
            'emergency_contacts.*.id' => [
                'nullable',
                'integer',
                'exists:emergency_contacts,id',
            ],
            'emergency_contacts.*.name' => [
                'required_with:emergency_contacts.*',
                'string',
                'max:255',
            ],
            'emergency_contacts.*.relationship' => [
                'required_with:emergency_contacts.*',
                'string',
                'max:100',
            ],
            'emergency_contacts.*.phone' => [
                'required_with:emergency_contacts.*',
                'string',
                'max:20',
            ],
            'emergency_contacts.*.alternate_phone' => [
                'nullable',
                'string',
                'max:20',
            ],
            'emergency_contacts.*.email' => [
                'nullable',
                'email',
                'max:255',
            ],
            'emergency_contacts.*.address' => [
                'nullable',
                'string',
                'max:500',
            ],
            'emergency_contacts.*.city' => [
                'nullable',
                'string',
                'max:100',
            ],
            'emergency_contacts.*.country' => [
                'nullable',
                'string',
                'size:3', // ISO country code
            ],
            'emergency_contacts.*.priority' => [
                'nullable',
                'integer',
                'min:1',
                'max:5',
            ],
            'emergency_contacts.*.is_primary' => [
                'nullable',
                'boolean',
            ],
            'emergency_contacts.*.notify_on_emergency' => [
                'nullable',
                'boolean',
            ],
            'emergency_contacts.*._delete' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Bank details messages
            'bank_details.bank_name.required_with' => 'Bank name is required when providing bank details.',
            'bank_details.account_holder_name.required_with' => 'Account holder name is required.',
            'bank_details.account_number.required_with' => 'Account number is required.',
            'bank_details.account_type.in' => 'Account type must be savings, current, or salary.',
            'bank_details.currency.size' => 'Please use a valid 3-letter currency code (e.g., USD, BDT, GBP).',

            // Emergency contacts messages
            'emergency_contacts.max' => 'You can add a maximum of 5 emergency contacts.',
            'emergency_contacts.*.name.required_with' => 'Emergency contact name is required.',
            'emergency_contacts.*.relationship.required_with' => 'Relationship is required for emergency contact.',
            'emergency_contacts.*.phone.required_with' => 'Phone number is required for emergency contact.',
            'emergency_contacts.*.email.email' => 'Please provide a valid email address.',
            'emergency_contacts.*.priority.min' => 'Priority must be at least 1.',
            'emergency_contacts.*.priority.max' => 'Priority cannot exceed 5.',
        ];
    }

    /**
     * Get custom attribute names for error messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'bank_details.bank_name' => 'bank name',
            'bank_details.branch_name' => 'branch name',
            'bank_details.account_holder_name' => 'account holder name',
            'bank_details.account_number' => 'account number',
            'bank_details.swift_code' => 'SWIFT code',
            'bank_details.iban' => 'IBAN',
            'bank_details.routing_number' => 'routing number',
            'bank_details.account_type' => 'account type',
            'bank_details.tax_id' => 'tax ID',
            'bank_details.currency' => 'currency',
            'emergency_contacts.*.name' => 'contact name',
            'emergency_contacts.*.relationship' => 'relationship',
            'emergency_contacts.*.phone' => 'phone number',
            'emergency_contacts.*.alternate_phone' => 'alternate phone',
            'emergency_contacts.*.email' => 'email address',
            'emergency_contacts.*.address' => 'address',
            'emergency_contacts.*.city' => 'city',
            'emergency_contacts.*.country' => 'country',
            'emergency_contacts.*.priority' => 'priority',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure boolean fields are properly cast
        if ($this->has('emergency_contacts')) {
            $contacts = $this->input('emergency_contacts', []);

            foreach ($contacts as $index => $contact) {
                if (isset($contact['is_primary'])) {
                    $contacts[$index]['is_primary'] = filter_var($contact['is_primary'], FILTER_VALIDATE_BOOLEAN);
                }
                if (isset($contact['notify_on_emergency'])) {
                    $contacts[$index]['notify_on_emergency'] = filter_var($contact['notify_on_emergency'], FILTER_VALIDATE_BOOLEAN);
                }
                if (isset($contact['_delete'])) {
                    $contacts[$index]['_delete'] = filter_var($contact['_delete'], FILTER_VALIDATE_BOOLEAN);
                }
            }

            $this->merge(['emergency_contacts' => $contacts]);
        }
    }
}
