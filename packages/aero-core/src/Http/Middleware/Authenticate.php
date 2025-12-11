<?php

namespace Aero\Core\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, return null to trigger a 401 response
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // For web requests, redirect to login on the SAME domain
        // Use relative path to stay on current domain (tenant or platform)
        return '/login';
    }

    /**
     * Handle unauthenticated user.
     */
    protected function unauthenticated($request, array $guards)
    {
        // For API requests, return JSON response
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'error' => 'session_expired',
            ], 401);
        }

        // For regular web requests, redirect to login
        throw new \Illuminate\Auth\AuthenticationException(
            'Unauthenticated.', $guards, $this->redirectTo($request)
        );
    }
}
