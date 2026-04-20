<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AllocateAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_id' => ['required', 'exists:assets,id'],
            'employee_id' => ['required', 'exists:employees,id'],
            'allocated_date' => ['required', 'date'],
            'expected_return_date' => ['nullable', 'date', 'after:allocated_date'],
            'notes' => ['nullable', 'string', 'max:500'],
            'condition_at_allocation' => ['nullable', 'in:new,good,fair,poor'],
        ];
    }

    public function messages(): array
    {
        return [
            'asset_id.required' => 'The asset is required.',
            'asset_id.exists' => 'The selected asset does not exist.',
            'employee_id.required' => 'The employee is required.',
            'employee_id.exists' => 'The selected employee does not exist.',
            'allocated_date.required' => 'The allocation date is required.',
            'expected_return_date.after' => 'The expected return date must be after the allocation date.',
            'condition_at_allocation.in' => 'The condition must be one of: new, good, fair, poor.',
        ];
    }
}
