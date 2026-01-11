<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Aero\Core\Services\DashboardRegistry;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

/**
 * Dashboard Redirect Middleware
 *
 * Intercepts requests to the base /dashboard route and redirects users
 * to their role's assigned default dashboard.
 *
 * LOGIC:
 * ------
 * 1. Only intercepts the base 'dashboard' route (Core Dashboard)
 * 2. Gets user's primary role (highest priority) and checks default_dashboard
 * 3. If role has a different dashboard assigned, redirect there
 * 4. If no assignment or Super Admin, stay on Core Dashboard
 *
 * USAGE:
 * ------
 * Apply to the dashboard route group in routes/web.php:
 * Route::middleware(['auth', 'dashboard.redirect'])->get('/dashboard', ...);
 */
class DashboardRedirectMiddleware
{
    public function __construct(
        protected DashboardRegistry $dashboardRegistry
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only intercept the base /dashboard route
        if (!$this->shouldRedirect($request)) {
            return $next($request);
        }

        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Resolve the user's target dashboard
        $targetDashboard = $this->resolveUserDashboard($user);

        // Core dashboard routes - don't redirect if target is core dashboard
        $coreDashboardRoutes = ['dashboard', 'core.dashboard'];

        // If target is different from current (and not a core dashboard alias), redirect
        if ($targetDashboard && !in_array($targetDashboard, $coreDashboardRoutes)) {
            $url = $this->dashboardRegistry->getUrl($targetDashboard);

            if ($url && Route::has($targetDashboard)) {
                return redirect($url);
            }
        }

        return $next($request);
    }

    /**
     * Determine if this request should be considered for redirect.
     */
    protected function shouldRedirect(Request $request): bool
    {
        // Only GET requests
        if (!$request->isMethod('GET')) {
            return false;
        }

        // Must be authenticated
        if (!$request->user()) {
            return false;
        }

        // Only the base dashboard route (supports both naming conventions)
        $routeName = $request->route()?->getName();
        $dashboardRoutes = ['dashboard', 'core.dashboard'];

        if (!in_array($routeName, $dashboardRoutes)) {
            return false;
        }

        // Don't redirect if explicitly requesting Core Dashboard via query param
        if ($request->has('core') || $request->has('stay')) {
            return false;
        }

        return true;
    }

    /**
     * Resolve the user's default dashboard based on roles.
     *
     * Priority:
     * 1. User's primary role (highest priority) with default_dashboard set
     * 2. Any role with default_dashboard set
     * 3. Fallback to Core Dashboard
     */
    protected function resolveUserDashboard($user): ?string
    {
        // Load roles if not loaded
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }

        $roles = $user->roles;

        if ($roles->isEmpty()) {
            return $this->dashboardRegistry->getDefaultDashboard();
        }

        // Sort by priority (descending) and get the primary role
        $primaryRole = $roles->sortByDesc(function ($role) {
            return $role->priority ?? 0;
        })->first();

        // Check primary role's default dashboard
        if ($primaryRole && $primaryRole->default_dashboard) {
            return $primaryRole->default_dashboard;
        }

        // Check any role with a dashboard assigned
        foreach ($roles as $role) {
            if ($role->default_dashboard) {
                return $role->default_dashboard;
            }
        }

        // Super Admin stays on Core Dashboard
        if ($user->hasRole('Super Administrator')) {
            return 'dashboard';
        }

        // Default fallback
        return $this->dashboardRegistry->getDefaultDashboard();
    }
}
