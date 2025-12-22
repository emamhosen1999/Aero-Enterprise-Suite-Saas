<?php

namespace Aero\Core\Middleware;

use Aero\Core\Http\Controllers\Installation\StandaloneInstallationController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check Installation Middleware
 * 
 * Redirects to installation wizard if the application hasn't been installed yet.
 * This middleware should be applied to all routes except installation routes.
 */
class CheckInstallation
{
    /**
     * Route name patterns that should be excluded from installation check
     */
    protected array $excludedRoutePatterns = [
        'installation.*',
        'core.health',
        'core.api.error-log',
        'core.api.version.check',
    ];

    /**
     * URI path prefixes that should be excluded from installation check
     */
    protected array $excludedPathPrefixes = [
        'installation',
        '_ignition',
        '__clockwork',
        'sanctum',
        'livewire',
    ];

    /**
     * File extensions to skip (static assets)
     */
    protected array $skipExtensions = [
        'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'map',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip static assets
        if ($this->isStaticAsset($request)) {
            return $next($request);
        }

        // Skip check for excluded routes (by name or path)
        if ($this->isExcludedRoute($request)) {
            return $next($request);
        }

        // Skip if we're in SaaS mode (platform package handles installation)
        if ($this->isSaaSMode()) {
            return $next($request);
        }

        // Check if installation is needed
        if (StandaloneInstallationController::needsInstallation()) {
            // For AJAX/API requests, return JSON response
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'error' => 'Installation required',
                    'message' => 'The application has not been installed yet.',
                    'redirect' => '/installation',
                ], 503);
            }

            return redirect()->route('installation.index');
        }

        return $next($request);
    }

    /**
     * Check if request is for a static asset
     */
    protected function isStaticAsset(Request $request): bool
    {
        $path = $request->path();
        
        // Check if path starts with build/ or vendor/ (compiled assets)
        if (str_starts_with($path, 'build/') || str_starts_with($path, 'vendor/')) {
            return true;
        }

        // Check file extension
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if (in_array($extension, $this->skipExtensions)) {
            return true;
        }

        return false;
    }

    /**
     * Check if current route should be excluded
     */
    protected function isExcludedRoute(Request $request): bool
    {
        // Check by route name if available
        $routeName = $request->route()?->getName();
        
        if ($routeName) {
            foreach ($this->excludedRoutePatterns as $pattern) {
                if (fnmatch($pattern, $routeName)) {
                    return true;
                }
            }
        }

        // Also check by URI path (fallback for routes without names)
        $path = trim($request->path(), '/');
        
        foreach ($this->excludedPathPrefixes as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if running in SaaS mode
     */
    protected function isSaaSMode(): bool
    {
        // Check if aero-platform package is installed and active
        return class_exists('\Aero\Platform\AeroPlatformServiceProvider') 
            && config('aero.mode', 'standalone') === 'saas';
    }
}
