<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:expense_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', 'string', 'max:3'],
            'expense_date' => ['required', 'date', 'before_or_equal:today'],
            'description' => ['nullable', 'string', 'max:1000'],
            'receipt' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'is_billable' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'The expense title is required.',
            'category_id.required' => 'The expense category is required.',
            'category_id.exists' => 'The selected expense category does not exist.',
            'amount.required' => 'The amount is required.',
            'amount.min' => 'The amount must be at least 0.01.',
            'currency.max' => 'The currency code must be 3 characters or less.',
            'expense_date.required' => 'The expense date is required.',
            'expense_date.before_or_equal' => 'The expense date cannot be in the future.',
            'receipt.mimes' => 'The receipt must be a PDF, JPG, JPEG, or PNG file.',
            'receipt.max' => 'The receipt must not exceed 5MB.',
        ];
    }
}
