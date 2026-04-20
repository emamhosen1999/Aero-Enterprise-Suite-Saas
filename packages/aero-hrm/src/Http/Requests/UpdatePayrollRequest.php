<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'year' => ['nullable', 'integer', 'min:2020', 'max:2030'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'description' => ['nullable', 'string', 'max:500'],
            'payment_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'month.integer' => 'Month must be a valid number.',
            'month.min' => 'Month must be between 1 and 12.',
            'month.max' => 'Month must be between 1 and 12.',
            'year.integer' => 'Year must be a valid number.',
            'year.min' => 'Year must be 2020 or later.',
            'year.max' => 'Year must be 2030 or earlier.',
            'department_id.exists' => 'Selected department does not exist.',
            'description.max' => 'Description must not exceed 500 characters.',
            'payment_date.date' => 'Payment date must be a valid date.',
        ];
    }
}
