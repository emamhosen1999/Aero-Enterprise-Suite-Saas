<?php

namespace Aero\Crm\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDealRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'exists:customers,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'value' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'expected_close_date' => ['nullable', 'date'],
            'source' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
        ];
    }

    /**
     * Get custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Please enter a deal title.',
            'title.max' => 'The deal title cannot exceed 255 characters.',
            'value.min' => 'The deal value cannot be negative.',
        ];
    }
}
