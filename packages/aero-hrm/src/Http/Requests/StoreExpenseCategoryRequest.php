<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:expense_categories,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'max_amount' => ['nullable', 'numeric', 'min:0'],
            'requires_receipt' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The category name is required.',
            'name.unique' => 'This expense category name already exists.',
            'max_amount.min' => 'The maximum amount must be at least 0.',
            'status.in' => 'The status must be either active or inactive.',
        ];
    }
}
