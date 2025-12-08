<?php

namespace Aero\Platform\Services\Profile;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProfileValidationService
{
    /**
     * Get validation rules for user creation
     */
    public function getUserCreationRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'user_name' => ['required', 'string', 'unique:users,user_name', function ($attribute, $value, $fail) {
                if (preg_match('/\s/', $value) || strtolower($value) !== $value) {
                    $fail('The '.$attribute.' must not contain spaces and must be all lowercase.');
                }
            }],
            'password' => 'required|string|min:8',
            'confirmPassword' => 'required|string|same:password',
            'gender' => 'nullable|string',
            'birthday' => 'nullable|date',
            'date_of_joining' => 'nullable|date',
            'address' => 'nullable|string',
            'employee_id' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'required|email|unique:users,email',
            'department' => 'nullable|string',
            'designation' => 'nullable|string',
            'report_to' => 'nullable|string',
        ];
    }

    /**
     * Get base validation rules for user updates
     */
    public function getBaseUpdateRules(): array
    {
        return [
            'id' => 'required|exists:users,id',
        ];
    }

    /**
     * Get validation rules based on rule set
     */
    public function getUpdateRulesBySet(string $ruleSet, int $userId): array
    {
        $baseRules = $this->getBaseUpdateRules();

        switch ($ruleSet) {
            case 'profile':
                return $baseRules + [
                    'name' => 'required|string',
                    'gender' => 'required|string',
                    'birthday' => 'nullable|date',
                    'date_of_joining' => 'nullable|date',
                    'address' => 'nullable|string',
                    'employee_id' => 'required|integer',
                    'phone' => 'required|string|unique:users,phone,'.$userId,
                    'email' => 'required|string|email|unique:users,email,'.$userId,
                    'department' => 'required|exists:departments,id',
                    'designation' => 'nullable',
                    'report_to' => 'nullable',
                ];

            case 'personal':
                return $baseRules + [
                    'nid' => 'required|string',
                    'passport_no' => 'nullable|string',
                    'passport_exp_date' => 'nullable|date',
                    'nationality' => 'required|string',
                    'religion' => 'required|string',
                    'marital_status' => 'required|string',
                    'employment_of_spouse' => 'nullable|string',
                    'number_of_children' => 'nullable|integer',
                ];

            case 'emergency':
                return $baseRules + [
                    'emergency_contact_primary_name' => 'required|string',
                    'emergency_contact_primary_relationship' => 'required|string',
                    'emergency_contact_primary_phone' => 'required|string',
                    'emergency_contact_secondary_name' => 'nullable|string',
                    'emergency_contact_secondary_relationship' => 'nullable|string',
                    'emergency_contact_secondary_phone' => 'nullable|string',
                ];

            case 'bank':
                return $baseRules + [
                    'bank_name' => 'required|string',
                    'bank_account_no' => 'required|numeric',
                    'ifsc_code' => 'nullable|string',
                    'pan_no' => 'nullable|string',
                ];

            case 'family':
                return $baseRules + [
                    'family_member_name' => 'required|string',
                    'family_member_relationship' => 'required|string',
                    'family_member_dob' => 'required|date',
                    'family_member_phone' => 'required|string',
                ];

            case 'salary':
                return $baseRules + [
                    'salary_basis' => 'required|string',
                    'salary_amount' => 'required|numeric',
                    'payment_type' => 'required|string',
                    'pf_contribution' => 'nullable|boolean',
                    'pf_no' => 'nullable|string',
                    'employee_pf_rate' => 'nullable|numeric',
                    'additional_pf_rate' => 'nullable|numeric',
                    'total_pf_rate' => 'nullable|numeric',
                    'esi_contribution' => 'nullable|boolean',
                    'esi_no' => 'nullable|string',
                    'employee_esi_rate' => 'nullable|numeric',
                    'additional_esi_rate' => 'nullable|numeric',
                    'total_esi_rate' => 'nullable|numeric',
                ];

            case 'profile_picture':
                return $baseRules + [
                    'profile_image' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
                    'remove_profile_image' => 'nullable|boolean',
                ];

            default:
                return $baseRules;
        }
    }

    /**
     * Get validation messages
     */
    public function getValidationMessages(): array
    {
        return [
            'id.required' => 'The user ID is required.',
            'id.exists' => 'The selected user ID does not exist.',
            'name.required' => 'The name field is required.',
            'name.string' => 'The name must be a string.',
            'gender.required' => 'The gender field is required.',
            'gender.string' => 'The gender must be a string.',
            'birthday.date' => 'The birthday must be a valid date.',
            'date_of_joining.date' => 'The date of joining must be a valid date.',
            'address.string' => 'The address must be a string.',
            'employee_id.required' => 'The employee ID is required.',
            'employee_id.integer' => 'The employee ID must be an integer.',
            'phone.required' => 'The phone number is required.',
            'phone.string' => 'The phone number must be a string.',
            'phone.unique' => 'The phone number has already been taken.',
            'email.required' => 'The email field is required.',
            'email.string' => 'The email must be a string.',
            'email.email' => 'The email must be a valid email address.',
            'email.unique' => 'The email has already been taken.',
            'department.required' => 'The department field is required.',
            'department.exists' => 'The selected department does not exist.',
            'designation.required' => 'The designation field is required.',
            'designation.exists' => 'The selected designation does not exist.',
            'profile_image.string' => 'The profile image must be a string.',
            'profile_image.image' => 'The profile image must be an image file.',
            'profile_image.max' => 'The profile image may not be greater than 1MB.',
            'report_to.required' => 'The report to field is required.',
            'report_to.exists' => 'The selected report to user does not exist.',
            'nid.required' => 'The NID field is required.',
            'nid.string' => 'The NID must be a string.',
            'passport_no.string' => 'The passport number must be a string.',
            'passport_exp_date.date' => 'The passport expiration date must be a valid date.',
            'nationality.required' => 'The nationality field is required.',
            'nationality.string' => 'The nationality must be a string.',
            'religion.required' => 'The religion field is required.',
            'religion.string' => 'The religion must be a string.',
            'marital_status.required' => 'The marital status field is required.',
            'marital_status.string' => 'The marital status must be a string.',
            'employment_of_spouse.string' => 'The employment of spouse must be a string.',
            'number_of_children.integer' => 'The number of children must be an integer.',
            'emergency_contact_primary_name.required' => 'The primary emergency contact name is required.',
            'emergency_contact_primary_name.string' => 'The primary emergency contact name must be a string.',
            'emergency_contact_primary_relationship.required' => 'The primary emergency contact relationship is required.',
            'emergency_contact_primary_relationship.string' => 'The primary emergency contact relationship must be a string.',
            'emergency_contact_primary_phone.required' => 'The primary emergency contact phone number is required.',
            'emergency_contact_primary_phone.string' => 'The primary emergency contact phone number must be a string.',
            'emergency_contact_secondary_name.string' => 'The secondary emergency contact name must be a string.',
            'emergency_contact_secondary_relationship.string' => 'The secondary emergency contact relationship must be a string.',
            'emergency_contact_secondary_phone.string' => 'The secondary emergency contact phone number must be a string.',
            'bank_name.required' => 'The bank name is required.',
            'bank_name.string' => 'The bank name must be a string.',
            'bank_account_no.required' => 'The bank account number is required.',
            'bank_account_no.numeric' => 'The bank account number must be numeric.',
            'ifsc_code.string' => 'The IFSC code must be a string.',
            'pan_no.string' => 'The PAN number must be a string.',
            'family_member_name.required' => 'The family member name is required.',
            'family_member_name.string' => 'The family member name must be a string.',
            'family_member_relationship.required' => 'The family member relationship is required.',
            'family_member_relationship.string' => 'The family member relationship must be a string.',
            'family_member_dob.required' => 'The family member date of birth is required.',
            'family_member_dob.date' => 'The family member date of birth must be a valid date.',
            'family_member_phone.required' => 'The family member phone number is required.',
            'family_member_phone.string' => 'The family member phone number must be a string.',
            'salary_basis.required' => 'The salary basis is required.',
            'salary_basis.string' => 'The salary basis must be a string.',
            'salary_amount.required' => 'The salary amount is required.',
            'salary_amount.numeric' => 'The salary amount must be numeric.',
            'payment_type.required' => 'The payment type is required.',
            'payment_type.string' => 'The payment type must be a string.',
            'pf_contribution.boolean' => 'The PF contribution must be a boolean value.',
            'pf_no.string' => 'The PF number must be a string.',
            'employee_pf_rate.string' => 'The employee PF rate must be a string.',
            'additional_pf_rate.string' => 'The additional PF rate must be a string.',
            'total_pf_rate.string' => 'The total PF rate must be a string.',
            'esi_contribution.boolean' => 'The ESI contribution must be a boolean value.',
            'esi_no.string' => 'The ESI number must be a string.',
            'employee_esi_rate.string' => 'The employee ESI rate must be a string.',
            'additional_esi_rate.string' => 'The additional ESI rate must be a string.',
            'total_esi_rate.string' => 'The total ESI rate must be a string.',
        ];
    }

    /**
     * Validate user creation request
     */
    public function validateUserCreation(Request $request): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($request->all(), $this->getUserCreationRules());
    }

    /**
     * Validate user update request
     */
    public function validateUserUpdate(Request $request): array
    {
        // Default to 'profile' rule set if no ruleSet is specified
        $ruleSet = $request->ruleSet ?? 'profile';

        $rules = $this->getUpdateRulesBySet($ruleSet, $request->id);
        $messages = $this->getValidationMessages();

        return $request->validate($rules, $messages);
    }
}
