<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Store Affiliate Request
 */
class StoreAffiliateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:affiliates,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'auto_approve' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Affiliate name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'An affiliate with this email already exists.',
            'website.url' => 'Please enter a valid website URL.',
            'commission_rate.min' => 'Commission rate cannot be negative.',
            'commission_rate.max' => 'Commission rate cannot exceed 100%.',
        ];
    }
}
