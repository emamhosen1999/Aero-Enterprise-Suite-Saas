<?php

namespace Aero\Core\Services\Profile;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\Core\Models\User;

/**
 * Profile Update Service
 *
 * Handles profile updates for both User (auth data) and Employee (employment data).
 *
 * Architecture:
 * - User: name, email, phone, password, preferences (auth-only)
 * - Employee: department, designation, salary, personal info (employment data)
 */
class ProfileUpdateService
{
    /**
     * Field name mappings for human-readable messages
     */
    private array $fieldNames = [
        // User fields (auth/identity)
        'name' => 'Full Name',
        'user_name' => 'User Name',
        'email' => 'Email',
        'phone' => 'Phone Number',
        'password' => 'Password',
        'about' => 'About',

        // Employee fields (personal info)
        'birthday' => 'Birthday',
        'gender' => 'Gender',
        'nationality' => 'Nationality',
        'religion' => 'Religion',
        'marital_status' => 'Marital Status',
        'employment_of_spouse' => 'Employment of Spouse',
        'number_of_children' => 'Number of Children',
        'passport_no' => 'Passport Number',
        'passport_exp_date' => 'Passport Expiry Date',
        'blood_group' => 'Blood Group',

        // Employee fields (employment)
        'department' => 'Department',
        'designation' => 'Designation',
        'date_of_joining' => 'Date of Joining',
        'employee_code' => 'Employee Code',
        'basic_salary' => 'Basic Salary',
        'employment_type' => 'Employment Type',
        'work_location' => 'Work Location',
        'shift' => 'Shift',
    ];

    /**
     * Fields that belong to User model (auth/identity)
     */
    private array $userFields = [
        'name',
        'user_name',
        'email',
        'phone',
        'password',
        'about',
        'locale',
        'profile_image',
    ];

    /**
     * Fields that belong to Employee model
     */
    private array $employeeFields = [
        'department_id',
        'designation_id',
        'manager_id',
        'date_of_joining',
        'employee_code',
        'basic_salary',
        'employment_type',
        'work_location',
        'shift',
        'birthday',
        'gender',
        'nationality',
        'religion',
        'marital_status',
        'employment_of_spouse',
        'number_of_children',
        'passport_no',
        'passport_exp_date',
        'blood_group',
        'notes',
    ];

    /**
     * Update user profile with validated data
     *
     * Splits data between User and Employee models appropriately.
     */
    public function updateUserProfile(User $user, array $validated): array
    {
        $messages = [];
        $employee = $user->employee;

        // Separate data for User and Employee models
        $userData = [];
        $employeeData = [];

        foreach ($validated as $key => $value) {
            if ($key === 'id' || $value === null) {
                continue;
            }

            // Map 'department' to 'department_id', 'designation' to 'designation_id'
            $mappedKey = $this->mapFieldName($key);

            if (in_array($mappedKey, $this->userFields)) {
                $userData[$mappedKey] = $value;
            } elseif (in_array($mappedKey, $this->employeeFields)) {
                $employeeData[$mappedKey] = $value;
            }
        }

        // Update User model (auth data)
        foreach ($userData as $key => $value) {
            if ($user->{$key} !== $value) {
                $message = $this->updateUserField($user, $key, $value);
                if ($message) {
                    $messages[] = $message;
                }
            }
        }

        // Update Employee model (employment data)
        if ($employee && ! empty($employeeData)) {
            // Handle department change - reset designation
            if (isset($employeeData['department_id']) && $employee->department_id !== $employeeData['department_id']) {
                $employeeData['designation_id'] = null;
                $employeeData['manager_id'] = null;
            }

            // Handle marital status change
            if (isset($employeeData['marital_status']) && $employeeData['marital_status'] === 'single') {
                $employeeData['employment_of_spouse'] = null;
                $employeeData['number_of_children'] = null;
            }

            foreach ($employeeData as $key => $value) {
                if ($employee->{$key} !== $value) {
                    $message = $this->updateEmployeeField($employee, $key, $value);
                    if ($message) {
                        $messages[] = $message;
                    }
                }
            }
        }

        return $messages;
    }

    /**
     * Map frontend field names to model field names
     */
    private function mapFieldName(string $key): string
    {
        $mappings = [
            'department' => 'department_id',
            'designation' => 'designation_id',
            'report_to' => 'manager_id',
            'dob' => 'birthday',
        ];

        return $mappings[$key] ?? $key;
    }

    /**
     * Update a specific User field
     */
    private function updateUserField(User $user, string $key, mixed $value): ?string
    {
        $user->{$key} = $value;

        return $this->getFieldDisplayName($key).' updated.';
    }

    /**
     * Update a specific Employee field
     */
    private function updateEmployeeField(Employee $employee, string $key, mixed $value): ?string
    {
        switch ($key) {
            case 'department_id':
                $employee->department_id = $value;
                $dept = Department::find($value);

                return $dept ? 'Department updated to '.$dept->name : null;

            case 'designation_id':
                $employee->designation_id = $value;
                if ($value) {
                    $desig = Designation::find($value);

                    return $desig ? 'Designation updated to '.$desig->title : null;
                }

                return 'Designation cleared.';

            case 'manager_id':
                $employee->manager_id = $value;
                if ($value) {
                    $manager = User::find($value);

                    return $manager ? 'Reports to updated to '.$manager->name : null;
                }

                return 'Manager cleared.';

            case 'marital_status':
                $employee->{$key} = $value;

                return $this->getFieldDisplayName($key).' updated to '.$value.'.';

            default:
                $employee->{$key} = $value;

                return $this->getFieldDisplayName($key).' updated.';
        }
    }

    /**
     * Get human-readable field name
     */
    private function getFieldDisplayName(string $key): string
    {
        // Convert field_name to display name
        $key = str_replace('_id', '', $key);

        return $this->fieldNames[$key] ?? ucwords(str_replace('_', ' ', $key));
    }

    /**
     * Save changes to both User and Employee
     */
    public function saveChanges(User $user): void
    {
        $user->save();

        if ($user->employee) {
            $user->employee->save();
        }
    }
}
