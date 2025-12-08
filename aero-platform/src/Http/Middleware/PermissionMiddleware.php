<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enhanced Permission Middleware
 *
 * Provides granular permission checking with audit logging
 */
class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! Auth::check()) {
            return redirect('/login');
        }

        $user = Auth::user();

        // Check if user has the required permission
        if (! $user->can($permission)) {
            // Log unauthorized access attempt
            \Log::warning('Unauthorized access attempt', [
                'user_id' => $user->id,
                'permission' => $permission,
                'route' => $request->route()->getName(),
                'url' => $request->url(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            // Return appropriate response based on request type
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'You do not have permission to access this resource.',
                    'required_permission' => $permission,
                ], 403);
            }

            return back()->with('error', "You don't have permission to access this resource. Required permission: {$permission}");
        }

        return $next($request);
    }
}
