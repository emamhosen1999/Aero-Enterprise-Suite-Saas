<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Affiliate Settings Request
 */
class UpdateAffiliateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enabled' => ['boolean'],
            'default_commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'default_commission_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'cookie_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'minimum_payout' => ['nullable', 'numeric', 'min:0'],
            'payout_methods' => ['nullable', 'array'],
            'payout_methods.*' => ['string', 'in:paypal,bank_transfer,stripe'],
            'auto_approve_affiliates' => ['boolean'],
            'terms_url' => ['nullable', 'url', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'default_commission_rate.min' => 'Commission rate cannot be negative.',
            'default_commission_rate.max' => 'Commission rate cannot exceed 100%.',
            'cookie_days.min' => 'Cookie duration must be at least 1 day.',
            'cookie_days.max' => 'Cookie duration cannot exceed 365 days.',
            'minimum_payout.min' => 'Minimum payout cannot be negative.',
            'terms_url.url' => 'Please enter a valid URL for the affiliate terms.',
        ];
    }
}
