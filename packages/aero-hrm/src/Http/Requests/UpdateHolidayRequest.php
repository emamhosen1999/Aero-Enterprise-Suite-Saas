<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'type' => ['nullable', 'in:public,optional,restricted'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_recurring' => ['nullable', 'boolean'],
            'applicable_departments' => ['nullable', 'array'],
            'applicable_departments.*' => ['nullable', 'exists:departments,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Holiday name is required.',
            'name.max' => 'Holiday name must not exceed 255 characters.',
            'date.required' => 'Holiday date is required.',
            'date.date' => 'Please provide a valid date.',
            'type.in' => 'Holiday type must be public, optional, or restricted.',
            'description.max' => 'Description must not exceed 500 characters.',
            'is_recurring.boolean' => 'Recurring must be true or false.',
            'applicable_departments.array' => 'Applicable departments must be a list.',
            'applicable_departments.*.exists' => 'One or more selected departments do not exist.',
        ];
    }
}
