<?php

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check Permission Middleware
 *
 * Enhanced middleware for Spatie Permission integration
 * Supports multiple permission checks and graceful handling
 */
class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission, string $guard = 'web'): Response
    {
        $authGuard = Auth::guard($guard);

        if ($authGuard->guest()) {
            return redirect('/login');
        }

        $user = $authGuard->user();

        // Check if user has the required permission
        if (! $user->can($permission)) {
            // If API request, return JSON response
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.',
                    'required_permission' => $permission,
                ], 403);
            }

            // For web requests, redirect with error message
            return back()->with('error', 'You do not have permission to access this resource.');
        }

        return $next($request);
    }
}
