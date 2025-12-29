<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force Password Reset Middleware
 *
 * Checks if a user has been flagged to reset their password and redirects
 * them to the password reset page if they haven't completed the reset.
 *
 * This is typically used when:
 * - Admin force-resets a user's password
 * - Password expires based on policy
 * - Security incident requires password change
 *
 * Usage in routes:
 * Route::middleware(['auth', 'check.force.password.reset'])->group(...)
 */
class CheckForcePasswordReset
{
    /**
     * Routes that should be excluded from the password reset check.
     */
    protected array $excludedRoutes = [
        'password.change',
        'password.change.update',
        'password.force-reset',
        'password.force-reset.update',
        'logout',
        'profile.password.update',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Check if user is flagged for forced password reset
        if ($this->userMustResetPassword($user)) {
            // Allow access to excluded routes (password reset, logout, etc.)
            if ($this->isExcludedRoute($request)) {
                return $next($request);
            }

            // For Inertia requests, return proper redirect
            if ($request->header('X-Inertia')) {
                return response()->json([
                    'redirect' => route('password.force-reset'),
                ], 409)->header('X-Inertia-Location', route('password.force-reset'));
            }

            // For API requests, return 403 with message
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Password reset required.',
                    'message' => 'You must reset your password before continuing.',
                    'redirect' => route('password.force-reset'),
                ], 403);
            }

            // For web requests, redirect to password reset
            return redirect()->route('password.force-reset')
                ->with('warning', 'Please reset your password before continuing.');
        }

        return $next($request);
    }

    /**
     * Check if the user must reset their password.
     */
    protected function userMustResetPassword($user): bool
    {
        // Check for force_password_reset flag
        if (method_exists($user, 'mustResetPassword')) {
            return $user->mustResetPassword();
        }

        // Check for force_password_reset attribute
        if (isset($user->force_password_reset) && $user->force_password_reset) {
            return true;
        }

        // Check password_changed_at for expiry (if configured)
        $passwordMaxAge = config('auth.password_max_age_days');
        if ($passwordMaxAge && isset($user->password_changed_at)) {
            $passwordAge = now()->diffInDays($user->password_changed_at);
            if ($passwordAge > $passwordMaxAge) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the current route is excluded from password reset check.
     */
    protected function isExcludedRoute(Request $request): bool
    {
        $currentRouteName = $request->route()?->getName();

        if (!$currentRouteName) {
            return false;
        }

        return in_array($currentRouteName, $this->excludedRoutes, true);
    }
}
