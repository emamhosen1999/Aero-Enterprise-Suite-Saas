<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Aero\Core\Services\Auth\TwoFactorAuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Require Two-Factor Authentication Middleware
 *
 * Ensures user has completed 2FA verification for the current session.
 *
 * Usage:
 * ```php
 * Route::middleware('2fa.required')->group(function () {
 *     // Protected routes requiring 2FA
 * });
 * ```
 */
class RequireTwoFactor
{
    public function __construct(
        protected TwoFactorAuthService $twoFactorService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Check if user has 2FA enabled
        if (! $this->twoFactorService->isEnabled($user)) {
            return $next($request);
        }

        // Check if already verified in this session
        if (session()->get('2fa_verified') === true) {
            return $next($request);
        }

        // Check if device is trusted
        $deviceId = $this->twoFactorService->generateDeviceId();
        if ($this->twoFactorService->isDeviceTrusted($user, $deviceId)) {
            session()->put('2fa_verified', true);

            return $next($request);
        }

        // Redirect to 2FA challenge
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Two-factor authentication required',
                'two_factor_required' => true,
            ], 403);
        }

        // Store intended URL
        session()->put('url.intended', $request->url());

        return redirect()->route('auth.two-factor.challenge');
    }
}
