<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force file-based sessions and cache for installation routes.
 *
 * This middleware ensures that installation routes use file-based sessions
 * and cache instead of the default database driver, since the tables don't
 * exist yet during initial installation.
 *
 * It also forces file drivers if database is not accessible.
 */
class ForceFileSessionForInstallation
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $shouldUseFileDrivers = false;

        // Always use file drivers for installation routes
        if ($request->routeIs('installation.*') || $request->is('install*')) {
            $shouldUseFileDrivers = true;
        }

        // Check if database is accessible - if not, force file drivers
        // This prevents errors when database is not yet configured
        if (! $shouldUseFileDrivers) {
            try {
                DB::connection()->getPdo();
                // Check if required tables exist
                $schema = DB::getSchemaBuilder();
                if (! $schema->hasTable('sessions') || ! $schema->hasTable('cache')) {
                    $shouldUseFileDrivers = true;
                }
            } catch (\Exception $e) {
                // Database not accessible - force file drivers
                $shouldUseFileDrivers = true;
            }
        }

        if ($shouldUseFileDrivers) {
            // Force file-based session driver to avoid database dependency
            Config::set('session.driver', 'file');

            // Force file-based cache driver to avoid database dependency
            Config::set('cache.default', 'file');
        }

        return $next($request);
    }
}
