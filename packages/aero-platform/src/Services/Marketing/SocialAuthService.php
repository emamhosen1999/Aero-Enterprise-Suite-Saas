<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Marketing;

use Aero\Platform\Models\PlatformSetting;
use Aero\Platform\Models\SocialAuthAccount;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

/**
 * Social Auth Service
 *
 * Manages OAuth authentication with social providers.
 */
class SocialAuthService
{
    /**
     * Get OAuth redirect URL for a provider.
     */
    public function getRedirectUrl(string $provider, ?string $redirectTo = null): string
    {
        $this->configureProvider($provider);

        $driver = Socialite::driver($provider);

        // Store redirect URL in session
        if ($redirectTo) {
            session(['social_auth_redirect' => $redirectTo]);
        }

        return $driver->stateless()->redirect()->getTargetUrl();
    }

    /**
     * Handle OAuth callback.
     */
    public function handleCallback(string $provider): array
    {
        $this->configureProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => 'Failed to authenticate with '.ucfirst($provider),
                'exception' => $e->getMessage(),
            ];
        }

        // Check if account already exists
        $socialAccount = SocialAuthAccount::findByProvider($provider, $socialUser->getId());

        if ($socialAccount && $socialAccount->authenticatable) {
            // Existing linked account - log them in
            return [
                'success' => true,
                'type' => 'login',
                'user' => $socialAccount->authenticatable,
                'social_account' => $socialAccount,
            ];
        }

        // Create or update social account for registration
        $socialAccount = SocialAuthAccount::updateOrCreateFromOAuth(
            $provider,
            $socialUser->getId(),
            [
                'email' => $socialUser->getEmail(),
                'name' => $socialUser->getName(),
                'avatar' => $socialUser->getAvatar(),
                'access_token' => $socialUser->token,
                'refresh_token' => $socialUser->refreshToken ?? null,
                'token_expires_at' => isset($socialUser->expiresIn)
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null,
                'provider_data' => $this->extractProviderData($socialUser),
                'pending_registration_token' => Str::random(64),
                'pending_expires_at' => now()->addHours(2),
            ]
        );

        return [
            'success' => true,
            'type' => 'register',
            'social_account' => $socialAccount,
            'email' => $socialUser->getEmail(),
            'name' => $socialUser->getName(),
            'avatar' => $socialUser->getAvatar(),
            'pending_token' => $socialAccount->pending_registration_token,
        ];
    }

    /**
     * Link social account to existing user.
     */
    public function linkAccount(string $provider, $authenticatable): array
    {
        $this->configureProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => 'Failed to authenticate with '.ucfirst($provider),
            ];
        }

        // Check if already linked to another account
        $existing = SocialAuthAccount::findByProvider($provider, $socialUser->getId());

        if ($existing && $existing->authenticatable_id !== $authenticatable->getKey()) {
            return [
                'success' => false,
                'error' => 'This '.ucfirst($provider).' account is already linked to another user.',
            ];
        }

        $socialAccount = SocialAuthAccount::updateOrCreateFromOAuth(
            $provider,
            $socialUser->getId(),
            [
                'email' => $socialUser->getEmail(),
                'name' => $socialUser->getName(),
                'avatar' => $socialUser->getAvatar(),
                'access_token' => $socialUser->token,
                'refresh_token' => $socialUser->refreshToken ?? null,
                'token_expires_at' => isset($socialUser->expiresIn)
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null,
                'provider_data' => $this->extractProviderData($socialUser),
                'authenticatable_type' => get_class($authenticatable),
                'authenticatable_id' => $authenticatable->getKey(),
                'pending_registration_token' => null,
                'pending_expires_at' => null,
            ]
        );

        return [
            'success' => true,
            'social_account' => $socialAccount,
        ];
    }

    /**
     * Unlink social account.
     */
    public function unlinkAccount(string $provider, $authenticatable): bool
    {
        return SocialAuthAccount::where('provider', $provider)
            ->where('authenticatable_type', get_class($authenticatable))
            ->where('authenticatable_id', $authenticatable->getKey())
            ->delete() > 0;
    }

    /**
     * Complete registration with pending token.
     */
    public function completePendingRegistration(string $token, $authenticatable): ?SocialAuthAccount
    {
        $socialAccount = SocialAuthAccount::findByPendingToken($token);

        if (! $socialAccount) {
            return null;
        }

        $socialAccount->linkTo($authenticatable);

        return $socialAccount;
    }

    /**
     * Get linked accounts for a user.
     */
    public function getLinkedAccounts($authenticatable): array
    {
        $accounts = SocialAuthAccount::where('authenticatable_type', get_class($authenticatable))
            ->where('authenticatable_id', $authenticatable->getKey())
            ->get();

        $providers = SocialAuthAccount::getSupportedProviders();

        return collect($providers)->map(function ($config, $provider) use ($accounts) {
            $account = $accounts->firstWhere('provider', $provider);

            return [
                'provider' => $provider,
                'name' => $config['name'],
                'icon' => $config['icon'],
                'color' => $config['color'],
                'linked' => $account !== null,
                'email' => $account?->email,
                'linked_at' => $account?->created_at,
            ];
        })->values()->toArray();
    }

    /**
     * Get enabled providers.
     */
    public function getEnabledProviders(): array
    {
        $settings = PlatformSetting::current();
        $providers = $settings->getEnabledSocialAuthProviders();
        $allProviders = SocialAuthAccount::getSupportedProviders();

        return collect($providers)
            ->map(fn ($provider) => array_merge(
                ['provider' => $provider],
                $allProviders[$provider] ?? []
            ))
            ->values()
            ->toArray();
    }

    /**
     * Check if a provider is enabled.
     */
    public function isProviderEnabled(string $provider): bool
    {
        return PlatformSetting::current()->isSocialAuthEnabled($provider);
    }

    /**
     * Configure Socialite provider from platform settings.
     */
    protected function configureProvider(string $provider): void
    {
        $settings = PlatformSetting::current()->getSocialAuthSettings();
        $providerConfig = $settings['providers'][$provider] ?? [];

        if (empty($providerConfig['client_id']) || empty($providerConfig['client_secret'])) {
            throw new \RuntimeException("{$provider} OAuth is not configured.");
        }

        config([
            "services.{$provider}.client_id" => $providerConfig['client_id'],
            "services.{$provider}.client_secret" => $providerConfig['client_secret'],
            "services.{$provider}.redirect" => url("/auth/{$provider}/callback"),
        ]);
    }

    /**
     * Extract provider-specific data.
     */
    protected function extractProviderData(SocialiteUser $user): array
    {
        return [
            'id' => $user->getId(),
            'nickname' => $user->getNickname(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'avatar' => $user->getAvatar(),
            'raw' => $user->getRaw(),
        ];
    }
}
