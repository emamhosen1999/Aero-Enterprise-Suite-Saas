<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Platform Super Admin Middleware
 *
 * Restricts access to platform administration area.
 * Only users with 'Super Administrator' role can access.
 *
 * Compliance: Section 9 - Platform Module & Role Management Rules
 */
class PlatformSuperAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated on landlord guard
        if (! Auth::guard('landlord')->check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            return redirect()->route('admin.login')
                ->with('error', 'Please login to access the platform admin area.');
        }

        $user = Auth::guard('landlord')->user();

        // Check if user has Super Administrator role
        if (! $user->hasRole('Super Administrator')) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Platform Super Administrator access required.',
                ], 403);
            }

            abort(403, 'Access denied. Only Platform Super Administrators can access this area.');
        }

        return $next($request);
    }
}
