<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tenant Super Admin Middleware
 *
 * Restricts access to tenant module-permission configuration.
 * Only users with 'tenant_super_administrator' role can access.
 *
 * Compliance: Section 8 - Tenant Module-Permission Navigation Rules
 */
class TenantSuperAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated on web guard (tenant users)
        if (! Auth::guard('web')->check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            return redirect()->route('login')
                ->with('error', 'Please login to access this area.');
        }

        $user = Auth::guard('web')->user();

        // Check tenant context
        if (! tenant()) {
            abort(403, 'Tenant context required.');
        }

        // Check if user has tenant_super_administrator role for this tenant
        if (! $user->hasRole('Super Administrator')) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Super Administrator access required.',
                ], 403);
            }

            abort(403, 'Access denied. Only Super Administrators can access this area.');
        }

        return $next($request);
    }
}
