<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure User Has Role Middleware
 *
 * Middleware for role-based access control using Spatie Permission
 * Supports checking for single or multiple roles
 */
class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * Usage in routes:
     * - Single role: ->middleware('role:Admin')
     * - Multiple roles (OR): ->middleware('role:Admin,Manager')
     * - Multiple roles (AND): ->middleware('role:Admin|Manager')
     *
     * @param  string  $roles  Comma-separated (OR) or pipe-separated (AND) role names
     * @param  string  $guard  The authentication guard to use
     */
    public function handle(Request $request, Closure $next, string $roles, string $guard = 'web'): Response
    {
        $authGuard = Auth::guard($guard);

        if ($authGuard->guest()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            return redirect('/login');
        }

        $user = $authGuard->user();

        // Check if we need to match ALL roles (pipe-separated) or ANY role (comma-separated)
        if (str_contains($roles, '|')) {
            // AND logic: User must have ALL specified roles
            $requiredRoles = array_map('trim', explode('|', $roles));
            $hasAllRoles = true;

            foreach ($requiredRoles as $role) {
                if (! $user->hasRole($role)) {
                    $hasAllRoles = false;
                    break;
                }
            }

            if (! $hasAllRoles) {
                return $this->unauthorizedResponse($request, $requiredRoles, 'all');
            }
        } else {
            // OR logic: User must have at least ONE of the specified roles
            $allowedRoles = array_map('trim', explode(',', $roles));

            if (! $user->hasAnyRole($allowedRoles)) {
                return $this->unauthorizedResponse($request, $allowedRoles, 'any');
            }
        }

        return $next($request);
    }

    /**
     * Generate an unauthorized response
     */
    private function unauthorizedResponse(Request $request, array $roles, string $type): Response
    {
        $message = $type === 'all'
            ? 'You must have all of these roles: '.implode(', ', $roles)
            : 'You must have one of these roles: '.implode(', ', $roles);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'required_roles' => $roles,
                'match_type' => $type,
            ], 403);
        }

        return redirect()
            ->back()
            ->with('error', $message);
    }
}
