<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Auth;

use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Landlord Authenticated Session Controller
 *
 * Handles authentication for super admin / platform administrator users.
 * Uses the 'landlord' guard which authenticates against the central database.
 *
 * SECURITY FEATURES:
 * - Rate limiting to prevent brute force attacks
 * - Account active status check
 * - Login event logging
 * - Separate session from tenant users
 */
class AuthenticatedSessionController extends Controller
{
    /**
     * Display the landlord login view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Platform/Admin/Auth/Login', [
            'canResetPassword' => true,
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming landlord authentication request.
     */
    public function store(Request $request): RedirectResponse
    {
        Log::info('Admin login attempt started', ['email' => $request->input('email')]);

        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        // Rate limiting
        $this->ensureIsNotRateLimited($request);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        // Check if user exists and is active BEFORE attempting login
        $user = LandlordUser::where('email', $credentials['email'])->first();

        Log::info('Admin login - user lookup', [
            'email' => $credentials['email'],
            'user_found' => (bool) $user,
            'user_id' => $user?->id,
        ]);

        if ($user && ! $user->isActive()) {
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'email' => 'This account has been deactivated. Please contact support.',
            ]);
        }

        // Attempt authentication using the landlord guard
        if (! Auth::guard('landlord')->attempt($credentials, $remember)) {
            Log::warning('Admin login - auth failed', ['email' => $credentials['email']]);
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        Log::info('Admin login - auth succeeded', [
            'email' => $credentials['email'],
            'guard_check' => Auth::guard('landlord')->check(),
            'user_id' => Auth::guard('landlord')->id(),
        ]);

        // Clear rate limiter on successful login
        RateLimiter::clear($this->throttleKey($request));

        // Regenerate session to prevent fixation attacks
        $request->session()->regenerate();

        Log::info('Admin login - session regenerated', [
            'session_id' => $request->session()->getId(),
        ]);

        // Record login event
        /** @var \App\Models\LandlordUser $user */
        $user = Auth::guard('landlord')->user();
        $user->recordLogin($request->ip());

        // Log the successful login
        Log::info('Landlord user logged in', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'redirect_to' => route('admin.dashboard'),
        ]);

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Destroy an authenticated landlord session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::guard('landlord')->user();

        if ($user) {
            Log::info('Landlord user logged out', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
        }

        Auth::guard('landlord')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    protected function ensureIsNotRateLimited(Request $request): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request), 5)) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey($request));

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    protected function throttleKey(Request $request): string
    {
        return 'landlord-login:'.strtolower($request->input('email')).'|'.$request->ip();
    }
}
