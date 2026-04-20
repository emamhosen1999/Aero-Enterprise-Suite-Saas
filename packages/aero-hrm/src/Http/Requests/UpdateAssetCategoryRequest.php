<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssetCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255', 'unique:asset_categories,name,' . $this->route('asset_category')],
            'description' => ['nullable', 'string', 'max:500'],
            'depreciation_rate' => ['nullable', 'numeric', 'between:0,100'],
            'useful_life_years' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'This asset category name already exists.',
            'depreciation_rate.between' => 'The depreciation rate must be between 0 and 100.',
            'useful_life_years.min' => 'The useful life must be at least 1 year.',
            'status.in' => 'The status must be either active or inactive.',
        ];
    }
}
