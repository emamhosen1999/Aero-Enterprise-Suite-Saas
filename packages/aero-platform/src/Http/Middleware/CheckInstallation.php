<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;

class CheckInstallation
{
    /**
     * Handle an incoming request.
     *
     * When the application is not installed (no lock file or no database),
     * ALL requests from ANY domain should redirect to the platform domain's /install route.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip check for installation routes (allow the installer to work)
        if ($request->routeIs('installation.*') || $request->is('install*')) {
            return $next($request);
        }

        // Also skip for static assets and health checks
        if ($request->is('build/*', 'assets/*', 'favicon.ico', 'robots.txt', 'up')) {
            return $next($request);
        }

        $host = $request->getHost();
        $installationLockFile = storage_path('installed');
        $isInstalled = File::exists($installationLockFile);

        // Check if database is accessible
        $databaseAccessible = $this->isDatabaseAccessible();

        // If not installed or database not accessible, redirect to platform /install
        if (! $isInstalled || ! $databaseAccessible) {
            // Get the platform domain (remove any subdomain prefix)
            $platformHost = $this->getPlatformHost($host);

            // If we're already on the platform domain, just redirect to /install
            if ($host === $platformHost) {
                return redirect('/install');
            }

            // Otherwise redirect to the platform domain's /install
            return redirect()->away($request->getScheme().'://'.$platformHost.'/install');
        }

        return $next($request);
    }

    /**
     * Check if the database is accessible and has required tables.
     */
    protected function isDatabaseAccessible(): bool
    {
        try {
            DB::connection()->getPdo();
            // Check if essential tables exist (tenants table is required for multi-tenant system)
            if (! DB::getSchemaBuilder()->hasTable('tenants')) {
                return false;
            }

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get the platform (root) domain by removing any subdomain.
     *
     * Examples:
     * - admin.aeos365.test → aeos365.test
     * - tenant1.aeos365.test → aeos365.test
     * - aeos365.test → aeos365.test
     */
    protected function getPlatformHost(string $host): string
    {
        // Handle common patterns
        $platformDomain = config('app.platform_domain');
        if ($platformDomain) {
            return $platformDomain;
        }

        // Extract base domain from subdomain pattern
        // For xxx.domain.tld, return domain.tld
        $parts = explode('.', $host);

        // If only 2 parts (domain.tld), it's already the platform domain
        if (count($parts) <= 2) {
            return $host;
        }

        // Remove the first subdomain part to get platform domain
        array_shift($parts);

        return implode('.', $parts);
    }
}
