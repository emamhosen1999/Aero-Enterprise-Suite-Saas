<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionExpiry
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip session check for guest routes and login routes
        if ($this->shouldSkipSessionCheck($request)) {
            return $next($request);
        }

        // Check if user is authenticated but session is invalid
        if (Auth::check()) {
            $sessionLifetime = config('session.lifetime') * 60; // Convert minutes to seconds
            $lastActivity = Session::get('last_activity', time());

            // Check if session has expired
            if (time() - $lastActivity > $sessionLifetime) {
                return $this->handleExpiredSession($request);
            }

            // Update last activity timestamp
            Session::put('last_activity', time());
        }

        return $next($request);
    }

    /**
     * Determine if session check should be skipped for this request.
     */
    private function shouldSkipSessionCheck(Request $request): bool
    {
        $skipRoutes = [
            'login',
            'register',
            'password.request',
            'password.reset',
            'password.email',
            'password.update',
            'verification.*',
            'logout',
        ];

        $skipPaths = [
            'login',
            'register',
            'forgot-password',
            'reset-password',
            'verify-email',
            'csrf-token',
            'session-check',
        ];

        // Skip if route name matches
        if ($request->route() && in_array($request->route()->getName(), $skipRoutes)) {
            return true;
        }

        // Skip if path matches
        foreach ($skipPaths as $path) {
            if ($request->is($path) || $request->is($path.'/*')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle expired session.
     */
    private function handleExpiredSession(Request $request)
    {
        // Log the user out
        Auth::logout();

        // Clear the session
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // For Inertia requests (SPA/AJAX)
        if ($request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Your session has expired. Please login again.',
                'redirect' => route('login'),
                'session_expired' => true,
            ], 419); // 419 Session Expired
        }

        // For API requests
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Session expired.',
                'error' => 'session_expired',
                'redirect' => route('login'),
            ], 419);
        }

        // For regular web requests
        return redirect()->route('login')
            ->with('status', 'Your session has expired. Please login again.')
            ->with('session_expired', true);
    }
}
