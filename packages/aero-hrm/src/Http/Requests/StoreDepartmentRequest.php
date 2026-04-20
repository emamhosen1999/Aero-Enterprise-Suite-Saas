<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'exists:departments,id'],
            'head_id' => ['nullable', 'exists:employees,id'],
            'status' => ['nullable', 'in:active,inactive'],
            'code' => ['nullable', 'string', 'max:50', 'unique:departments,code'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Department name is required.',
            'name.max' => 'Department name must not exceed 255 characters.',
            'name.unique' => 'A department with this name already exists.',
            'description.max' => 'Description must not exceed 1000 characters.',
            'parent_id.exists' => 'The selected parent department does not exist.',
            'head_id.exists' => 'The selected department head does not exist.',
            'status.in' => 'Status must be active or inactive.',
            'code.max' => 'Department code must not exceed 50 characters.',
            'code.unique' => 'This department code is already in use.',
        ];
    }
}
