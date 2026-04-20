<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:designations,name'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'level' => ['nullable', 'integer', 'min:1', 'max:20'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Designation name is required.',
            'name.max' => 'Designation name must not exceed 255 characters.',
            'name.unique' => 'A designation with this name already exists.',
            'department_id.exists' => 'The selected department does not exist.',
            'description.max' => 'Description must not exceed 1000 characters.',
            'level.integer' => 'Level must be a whole number.',
            'level.min' => 'Level must be at least 1.',
            'level.max' => 'Level must not exceed 20.',
            'status.in' => 'Status must be active or inactive.',
        ];
    }
}
