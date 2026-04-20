<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'employee_code' => ['nullable', 'string', 'unique:employees,employee_code'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'designation_id' => ['nullable', 'exists:designations,id'],
            'date_of_joining' => ['required', 'date'],
            'employment_type' => ['required', 'in:full_time,part_time,contract,intern'],
            'basic_salary' => ['nullable', 'numeric', 'min:0'],
            'manager_id' => ['nullable', 'exists:employees,id'],
            'gender' => ['nullable', 'in:male,female,other'],
            'birthday' => ['nullable', 'date'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'marital_status' => ['nullable', 'in:single,married,divorced,widowed'],
            'blood_group' => ['nullable', 'string', 'max:5'],
            'work_location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required.',
            'first_name.max' => 'First name must not exceed 100 characters.',
            'last_name.required' => 'Last name is required.',
            'last_name.max' => 'Last name must not exceed 100 characters.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already in use.',
            'employee_code.unique' => 'This employee code is already assigned.',
            'department_id.exists' => 'The selected department does not exist.',
            'designation_id.exists' => 'The selected designation does not exist.',
            'date_of_joining.required' => 'Date of joining is required.',
            'date_of_joining.date' => 'Please provide a valid date of joining.',
            'employment_type.required' => 'Employment type is required.',
            'employment_type.in' => 'Employment type must be full time, part time, contract, or intern.',
            'basic_salary.numeric' => 'Salary must be a number.',
            'basic_salary.min' => 'Salary cannot be negative.',
            'manager_id.exists' => 'The selected manager does not exist.',
            'gender.in' => 'Gender must be male, female, or other.',
            'birthday.date' => 'Please provide a valid birthday.',
            'marital_status.in' => 'Invalid marital status.',
            'phone.max' => 'Phone number must not exceed 20 characters.',
        ];
    }
}
