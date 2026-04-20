<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReturnAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'allocation_id' => ['required', 'exists:asset_allocations,id'],
            'return_date' => ['required', 'date'],
            'condition_at_return' => ['required', 'in:new,good,fair,poor,damaged'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'allocation_id.required' => 'The asset allocation is required.',
            'allocation_id.exists' => 'The selected asset allocation does not exist.',
            'return_date.required' => 'The return date is required.',
            'condition_at_return.required' => 'The condition at return is required.',
            'condition_at_return.in' => 'The condition must be one of: new, good, fair, poor, damaged.',
        ];
    }
}
