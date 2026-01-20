<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Public;

use Aero\Platform\Services\Marketing\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;

/**
 * Public Social Auth Controller
 *
 * Handles OAuth redirects and callbacks.
 */
class SocialAuthController extends Controller
{
    public function __construct(
        protected SocialAuthService $socialAuthService
    ) {}

    /**
     * Redirect to OAuth provider.
     */
    public function redirect(string $provider): RedirectResponse
    {
        if (! $this->socialAuthService->isProviderEnabled($provider)) {
            abort(404, 'OAuth provider not available.');
        }

        try {
            $redirectUrl = $this->socialAuthService->getRedirectUrl(
                $provider,
                session('url.intended', '/')
            );

            return redirect()->away($redirectUrl);
        } catch (\Throwable $e) {
            return redirect('/login')->withErrors([
                'oauth' => "Unable to connect to {$provider}. Please try again.",
            ]);
        }
    }

    /**
     * Handle OAuth callback.
     */
    public function callback(string $provider): RedirectResponse
    {
        if (! $this->socialAuthService->isProviderEnabled($provider)) {
            abort(404, 'OAuth provider not available.');
        }

        $result = $this->socialAuthService->handleCallback($provider);

        if (! $result['success']) {
            return redirect('/login')->withErrors([
                'oauth' => $result['error'] ?? 'Authentication failed.',
            ]);
        }

        if ($result['type'] === 'login') {
            // Existing user - log them in
            auth()->login($result['user']);

            $redirectTo = session()->pull('social_auth_redirect', route('dashboard'));

            return redirect($redirectTo)->with('success', 'Logged in successfully!');
        }

        // New user - redirect to registration with pending token
        return redirect()->route('register', [
            'oauth_token' => $result['pending_token'],
            'provider' => $provider,
        ])->with([
            'oauth_email' => $result['email'],
            'oauth_name' => $result['name'],
            'oauth_avatar' => $result['avatar'],
        ]);
    }

    /**
     * Link social account to existing user.
     */
    public function link(string $provider): RedirectResponse
    {
        if (! auth()->check()) {
            return redirect('/login');
        }

        if (! $this->socialAuthService->isProviderEnabled($provider)) {
            abort(404, 'OAuth provider not available.');
        }

        $result = $this->socialAuthService->linkAccount($provider, auth()->user());

        if (! $result['success']) {
            return redirect()->back()->withErrors([
                'oauth' => $result['error'] ?? 'Failed to link account.',
            ]);
        }

        return redirect()->back()->with(
            'success',
            ucfirst($provider) . ' account linked successfully!'
        );
    }

    /**
     * Unlink social account from current user.
     */
    public function unlink(string $provider): JsonResponse|RedirectResponse
    {
        if (! auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $success = $this->socialAuthService->unlinkAccount($provider, auth()->user());

        if (request()->wantsJson()) {
            return response()->json([
                'success' => $success,
                'message' => $success
                    ? ucfirst($provider) . ' account unlinked successfully.'
                    : 'Failed to unlink account.',
            ]);
        }

        return redirect()->back()->with(
            $success ? 'success' : 'error',
            $success
                ? ucfirst($provider) . ' account unlinked successfully.'
                : 'Failed to unlink account.'
        );
    }

    /**
     * Get enabled providers (API endpoint).
     */
    public function providers(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'providers' => $this->socialAuthService->getEnabledProviders(),
        ]);
    }
}
