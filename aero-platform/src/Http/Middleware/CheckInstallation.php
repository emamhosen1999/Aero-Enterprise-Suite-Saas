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
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip check for installation routes
        if ($request->routeIs('installation.*') || $request->is('install*')) {
            return $next($request);
        }

        // Get domain context - only check installation on platform domain, not admin
        $context = $request->attributes->get('domain_context', 'platform');
        $host = $request->getHost();
        $isAdminDomain = str_starts_with($host, 'admin.');

        $installationLockFile = storage_path('installed');
        $isInstalled = File::exists($installationLockFile);

        // Check if database is accessible
        $databaseAccessible = true;
        try {
            DB::connection()->getPdo();
            // Check if essential tables exist (tenants table is required for multi-tenant system)
            if (! DB::getSchemaBuilder()->hasTable('tenants')) {
                $databaseAccessible = false;
            }
        } catch (\Exception $e) {
            $databaseAccessible = false;
        }

        // If on admin domain and installation not complete, redirect to platform domain installation
        if ($isAdminDomain && (! $isInstalled || ! $databaseAccessible)) {
            // Remove 'admin.' prefix to get platform domain
            $platformHost = preg_replace('/^admin\./', '', $host);

            return redirect()->away($request->getScheme().'://'.$platformHost.'/install');
        }

        // For platform domain, handle installation check normally
        if ($context !== 'admin' && ! $isAdminDomain) {
            // If installation lock file doesn't exist, redirect to installation
            if (! $isInstalled) {
                return redirect('/install');
            }

            // Additionally check if database is actually accessible
            // This handles cases where the lock file exists but database is missing/corrupted
            if (! $databaseAccessible) {
                // Database exists but tables are missing or connection failed - need reinstallation
                if (File::exists($installationLockFile)) {
                    File::delete($installationLockFile);
                }

                return redirect('/install');
            }
        }

        return $next($request);
    }
}
