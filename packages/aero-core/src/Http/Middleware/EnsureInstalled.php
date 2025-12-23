<?php

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstalled
{
    /**
     * Handle an incoming request.
     *
     * When the application is not installed (no lock file or no database),
     * ALL requests should redirect to /install route.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip check for installation routes (allow the installer to work)
        if ($request->routeIs('install.*') || $request->is('install*')) {
            return $next($request);
        }

        // Also skip for static assets and health checks
        if ($request->is('build/*', 'storage/*', 'favicon.ico', 'robots.txt', 'aero-core/health', 'api/error-log', 'api/version/check')) {
            return $next($request);
        }

        $installationLockFile = storage_path('installed');
        $isInstalled = File::exists($installationLockFile);

        // Check if database is accessible
        $databaseAccessible = $this->isDatabaseAccessible();

        // If not installed or database not accessible, redirect to /install
        if (! $isInstalled || ! $databaseAccessible) {
            return redirect('/install');
        }

        return $next($request);
    }

    /**
     * Check if the system is installed using file-based detection.
     * 
     * This is the ONLY authoritative method for checking installation status.
     * Never use database queries for installation detection as they can fail
     * before the database is configured.
     * 
     * @return bool
     */
    protected function isDatabaseAccessible(): bool
    {
        return file_exists(storage_path('app/aeos.installed'));
    }
}
