<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Aero\Auth\Models\SocialAuthAccount;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Social Auth Provider Request
 */
class UpdateSocialAuthProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $provider = $this->route('provider');
        $supportedProviders = array_keys(SocialAuthAccount::getSupportedProviders());

        if (! in_array($provider, $supportedProviders)) {
            return [
                'provider' => ['required', 'in:'.implode(',', $supportedProviders)],
            ];
        }

        return [
            'enabled' => ['boolean'],
            'client_id' => ['nullable', 'string', 'max:255'],
            'client_secret' => ['nullable', 'string', 'max:255'],
            'scopes' => ['nullable', 'array'],
            'scopes.*' => ['string', 'max:100'],
            'options' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'provider.in' => 'The selected OAuth provider is not supported.',
            'client_id.max' => 'Client ID is too long.',
            'client_secret.max' => 'Client Secret is too long.',
        ];
    }
}
