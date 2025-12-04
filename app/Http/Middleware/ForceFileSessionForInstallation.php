<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force file-based sessions for installation routes.
 *
 * This middleware ensures that installation routes use file-based sessions
 * instead of the default database driver, since the sessions table doesn't
 * exist yet during initial installation.
 *
 * It also forces file sessions if database is not accessible.
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
        $shouldUseFileSessions = false;

        // Always use file sessions for installation routes
        if ($request->routeIs('installation.*') || $request->is('install*')) {
            $shouldUseFileSessions = true;
        }

        // Check if database is accessible - if not, force file sessions
        // This prevents errors when database is not yet configured
        if (! $shouldUseFileSessions) {
            try {
                DB::connection()->getPdo();
                // Check if sessions table exists
                if (! DB::getSchemaBuilder()->hasTable('sessions')) {
                    $shouldUseFileSessions = true;
                }
            } catch (\Exception $e) {
                // Database not accessible - force file sessions
                $shouldUseFileSessions = true;
            }
        }

        if ($shouldUseFileSessions) {
            // Force file-based session driver to avoid database dependency
            Config::set('session.driver', 'file');
        }

        return $next($request);
    }
}
