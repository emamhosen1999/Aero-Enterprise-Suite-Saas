<?php

namespace AeroModules\Hrm\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use AeroModules\Hrm\Services\LicenseValidator;
use Illuminate\Support\Facades\View;

class CheckLicense
{
    /**
     * License validator instance
     */
    protected LicenseValidator $validator;

    public function __construct(LicenseValidator $validator)
    {
        $this->validator = $validator;
    }

    /**
     * Handle an incoming request
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip license check for admin users
        if ($this->isAdminUser($request)) {
            return $next($request);
        }

        // Skip license check if disabled in config
        if (!config('aero-hrm.license.enabled', true)) {
            return $next($request);
        }

        // Validate license
        if (!$this->validator->validate()) {
            return $this->handleInvalidLicense($request);
        }

        // Check if grace period is active and show warning
        if ($this->validator->isGracePeriodActive()) {
            $daysRemaining = $this->validator->gracePeriodDaysRemaining();
            View::share('licenseGracePeriodDays', $daysRemaining);
        }

        return $next($request);
    }

    /**
     * Check if user is admin
     */
    protected function isAdminUser(Request $request): bool
    {
        if (!$request->user()) {
            return false;
        }

        // Check if user has admin role or permission
        return $request->user()->hasRole('admin') 
            || $request->user()->can('bypass-license-check');
    }

    /**
     * Handle invalid license
     */
    protected function handleInvalidLicense(Request $request)
    {
        // If API request, return JSON error
        if ($request->expectsJson()) {
            return response()->json([
                'error' => 'Invalid or expired license',
                'message' => 'Your HRM license is invalid or has expired. Please contact support.',
            ], 403);
        }

        // For web requests, show error page
        return response()->view('hrm::errors.license-invalid', [
            'title' => 'Invalid License',
            'message' => 'Your HRM license is invalid or has expired.',
        ], 403);
    }
}
