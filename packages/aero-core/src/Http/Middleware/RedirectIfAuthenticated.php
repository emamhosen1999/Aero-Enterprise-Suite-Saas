<?php

namespace Aero\Core\Http\Middleware;

use Aero\Platform\Http\Middleware\IdentifyDomainContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * Context-aware redirect for authenticated users.
     * Redirects to /dashboard path, which resolves to the appropriate
     * route based on domain context:
     * - Admin domain (admin.domain.com) → admin.dashboard route
     * - Tenant domain (tenant.domain.com) → core.dashboard route
     * - Platform domain (domain.com) → may vary
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // Redirect to /dashboard path - the actual route name varies by context
                // but the path is consistent across admin, tenant, and platform contexts
                return redirect('/dashboard');
            }
        }

        return $next($request);
    }
}
