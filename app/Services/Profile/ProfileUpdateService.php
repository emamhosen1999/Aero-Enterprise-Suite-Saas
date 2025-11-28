<?php

namespace App\Services\Profile;

use App\Models\HRM\Department;
use App\Models\HRM\Designation;
use App\Models\User;

class ProfileUpdateService
{
    /**
     * Field name mappings for human-readable messages
     */
    private array $fieldNames = [
        'employee_id' => 'Employee ID',
        'user_name' => 'User Name',
        'phone' => 'Phone Number',
        'dob' => 'Date of Birth',
        'address' => 'Address',
        'about' => 'About',
        'password' => 'Password',
        'nid' => 'National ID',
        'name' => 'Full Name',
        'date_of_joining' => 'Date of Joining',
        'birthday' => 'Birthday',
        'gender' => 'Gender',
        'passport_no' => 'Passport Number',
        'passport_exp_date' => 'Passport Expiry Date',
        'nationality' => 'Nationality',
        'religion' => 'Religion',
        'marital_status' => 'Marital Status',
        'employment_of_spouse' => 'Employment of Spouse',
        'number_of_children' => 'Number of Children',
        'emergency_contact_primary_name' => 'Primary Emergency Contact Name',
        'emergency_contact_primary_relationship' => 'Primary Emergency Contact Relationship',
        'emergency_contact_primary_phone' => 'Primary Emergency Contact Phone',
        'emergency_contact_secondary_name' => 'Secondary Emergency Contact Name',
        'emergency_contact_secondary_relationship' => 'Secondary Emergency Contact Relationship',
        'emergency_contact_secondary_phone' => 'Secondary Emergency Contact Phone',
        'bank_name' => 'Bank Name',
        'bank_account_no' => 'Bank Account Number',
        'ifsc_code' => 'IFSC Code',
        'pan_no' => 'PAN Number',
        'family_member_name' => 'Family Member Name',
        'family_member_relationship' => 'Family Member Relationship',
        'family_member_dob' => 'Family Member Date of Birth',
        'family_member_phone' => 'Family Member Phone Number',
        'salary_basis' => 'Salary Basis',
        'salary_amount' => 'Salary Amount',
        'payment_type' => 'Payment Type',
        'pf_contribution' => 'PF Contribution',
        'pf_no' => 'PF Number',
        'employee_pf_rate' => 'Employee PF Rate',
        'additional_pf_rate' => 'Additional PF Rate',
        'total_pf_rate' => 'Total PF Rate',
        'esi_contribution' => 'ESI Contribution',
        'esi_no' => 'ESI Number',
        'employee_esi_rate' => 'Employee ESI Rate',
        'additional_esi_rate' => 'Additional ESI Rate',
        'total_esi_rate' => 'Total ESI Rate',
    ];

    /**
     * Update user profile with validated data
     */
    public function updateUserProfile(User $user, array $validated): array
    {
        $messages = [];

        // Handle department change which affects designation and report_to
        if (array_key_exists('department', $validated) && $user->department_id !== $validated['department']) {
            $user->designation_id = null;
            $user->report_to = null;
        }

        // Update user attributes
        foreach ($validated as $key => $value) {
            if ($key !== 'id' && $value !== null && ($user->{$key} !== $value)) {
                $message = $this->updateUserField($user, $key, $value);
                if ($message) {
                    $messages[] = $message;
                }
            }
        }

        return $messages;
    }

    /**
     * Update a specific user field and return appropriate message
     */
    private function updateUserField(User $user, string $key, $value): ?string
    {
        switch ($key) {
            case 'department':
                $user->department_id = $value;

                return 'Department updated to '.Department::find($value)->name;

            case 'designation':
                $user->designation_id = $value;

                return 'Designation updated to '.Designation::find($value)->title;

            case 'report_to':
                $user->report_to = $value;

                return 'Report to updated to '.User::find($value)->name;

            case 'marital_status':
                $user->{$key} = $value;
                if ($value === 'Single') {
                    $user->employment_of_spouse = null;
                    $user->number_of_children = null;
                }

                return $this->getFieldDisplayName($key).' updated to '.$value.'.';

            case 'pf_contribution':
                $user->{$key} = $value;
                $messageValue = $value === 0 ? 'No' : ($value === 1 ? 'Yes' : $value);

                if ($value === 0) {
                    $user->pf_no = null;
                    $user->employee_pf_rate = 0;
                    $user->additional_pf_rate = 0;
                    $user->total_pf_rate = 0;
                }

                return $this->getFieldDisplayName($key).' updated to '.$messageValue.'.';

            case 'esi_contribution':
                $user->{$key} = $value;
                $messageValue = $value === 0 ? 'No' : ($value === 1 ? 'Yes' : $value);

                if ($value === 0) {
                    $user->esi_no = null;
                    $user->employee_esi_rate = 0;
                    $user->additional_esi_rate = 0;
                    $user->total_esi_rate = 0;
                }

                return $this->getFieldDisplayName($key).' updated to '.$messageValue.'.';

            default:
                if (array_key_exists($key, $this->fieldNames) && ($user->{$key} !== $value)) {
                    $user->{$key} = $value;

                    return $this->getFieldDisplayName($key).' updated to '.$value.'.';
                }
                break;
        }

        return null;
    }

    /**
     * Get human-readable field name
     */
    private function getFieldDisplayName(string $key): string
    {
        return $this->fieldNames[$key] ?? $key;
    }
}
