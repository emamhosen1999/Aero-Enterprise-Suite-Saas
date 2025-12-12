<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check Module Subscription Middleware
 *
 * This is a convenience middleware that automatically detects the module
 * from the route name and checks if the tenant has an active subscription.
 *
 * Route names should follow the pattern: {module}.{action}
 * Example: hrm.dashboard, crm.leads.index
 *
 * This middleware can be added to the 'tenant' middleware group for
 * automatic module gating on all tenant routes.
 *
 * Core and Platform routes are always allowed.
 */
class CheckModuleSubscription
{
    /**
     * Modules that are always allowed (no subscription check).
     *
     * @var array<string>
     */
    protected array $allowedPrefixes = [
        'core',
        'platform',
        'billing',
        'subscription',
        'settings',
        'profile',
        'dashboard',
        'auth',
        'login',
        'register',
        'password',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only check in tenant context
        if (! function_exists('tenant') || ! tenant()) {
            return $next($request);
        }

        // Get route name (e.g., "hrm.dashboard", "crm.leads.index")
        $routeName = $request->route()?->getName();

        if (! $routeName) {
            return $next($request);
        }

        // Extract module prefix from route name
        $modulePrefix = $this->extractModulePrefix($routeName);

        if (! $modulePrefix) {
            return $next($request);
        }

        // Allow core/platform routes
        if (in_array($modulePrefix, $this->allowedPrefixes)) {
            return $next($request);
        }

        // Check tenant subscription for this module
        $tenant = tenant();

        if (! $tenant->hasActiveSubscription($modulePrefix)) {
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => "Module '{$modulePrefix}' is not included in your subscription plan.",
                    'error' => 'module_not_subscribed',
                ], 402);
            }

            // Redirect to billing/upgrade page
            return redirect()->route('tenant.billing.upgrade', ['module' => $modulePrefix])
                ->with('error', "You need to subscribe to the {$modulePrefix} module to access this page.");
        }

        return $next($request);
    }

    /**
     * Extract the module prefix from a route name.
     *
     * Examples:
     * - "hrm.dashboard" → "hrm"
     * - "crm.leads.index" → "crm"
     * - "platform.billing" → "platform"
     */
    protected function extractModulePrefix(string $routeName): ?string
    {
        $parts = explode('.', $routeName);

        return $parts[0] ?? null;
    }
}
