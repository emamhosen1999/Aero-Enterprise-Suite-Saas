<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'asset_code' => ['required', 'string', 'max:100', 'unique:assets,asset_code'],
            'category_id' => ['required', 'exists:asset_categories,id'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'condition' => ['nullable', 'in:new,good,fair,poor,damaged'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'warranty_expiry' => ['nullable', 'date'],
            'status' => ['nullable', 'in:available,allocated,maintenance,retired,disposed'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The asset name is required.',
            'asset_code.required' => 'The asset code is required.',
            'asset_code.unique' => 'This asset code already exists.',
            'category_id.required' => 'The asset category is required.',
            'category_id.exists' => 'The selected asset category does not exist.',
            'purchase_cost.min' => 'The purchase cost must be at least 0.',
            'condition.in' => 'The condition must be one of: new, good, fair, poor, damaged.',
            'status.in' => 'The status must be one of: available, allocated, maintenance, retired, disposed.',
        ];
    }
}
