<?php

namespace Aero\Platform\Http\Middleware;

use App\Http\Controllers\Tenant\TenantOnboardingController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RequireTenantOnboarding Middleware
 *
 * Redirects tenant admins to the onboarding wizard if they haven't completed it yet.
 * This ensures new tenants go through the essential setup process before accessing
 * the main application.
 *
 * Exceptions (routes that don't require onboarding):
 * - The onboarding routes themselves
 * - Logout route
 * - Profile routes (user needs to be able to update their profile)
 * - API routes
 */
class RequireTenantOnboarding
{
    /**
     * Routes that should be accessible even without completing onboarding.
     */
    protected array $except = [
        'onboarding.*',
        'logout',
        'profile.*',
        'user-profile-information.update',
        'user-password.update',
        'two-factor.*',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip if not a tenant context
        if (! tenant()) {
            return $next($request);
        }

        // Skip if accessing an excepted route
        if ($this->inExceptArray($request)) {
            return $next($request);
        }

        // Skip for API requests
        if ($request->expectsJson() || $request->is('api/*')) {
            return $next($request);
        }

        // Check if onboarding is completed
        if (! TenantOnboardingController::isOnboardingCompleted()) {
            // Only redirect super admins to onboarding
            // Regular employees can access the app even if tenant onboarding isn't complete
            if ($request->user() && $request->user()->hasRole('Super Administrator')) {
                return redirect()->route('onboarding.index');
            }
        }

        return $next($request);
    }

    /**
     * Determine if the request has a URI that should pass through.
     */
    protected function inExceptArray(Request $request): bool
    {
        foreach ($this->except as $except) {
            if ($except !== '/') {
                $except = trim($except, '/');
            }

            // Check route name with wildcard support
            if ($request->routeIs($except)) {
                return true;
            }

            // Check URI path
            if ($request->is($except)) {
                return true;
            }
        }

        return false;
    }
}
