<?php

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class PreventInstalledAccess
{
    /**
     * Handle an incoming request.
     *
     * Blocks access to installation routes if system is already installed.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->isInstalled()) {
            // If it's an AJAX/API request, return JSON response
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'System is already installed.',
                    'redirect' => route('login'),
                ], 403);
            }

            // Redirect to login page with message
            return redirect()->route('login')
                ->with('info', 'System is already installed.');
        }

        return $next($request);
    }

    /**
     * Check if the system is installed
     */
    protected function isInstalled(): bool
    {
        try {
            // Check if database connection works
            DB::connection()->getPdo();

            // Check if migrations table exists
            if (!Schema::hasTable('migrations')) {
                return false;
            }

            // Check for required tables
            $requiredTables = ['users', 'roles', 'modules'];
            foreach ($requiredTables as $table) {
                if (!Schema::hasTable($table)) {
                    return false;
                }
            }

            // Check if system_settings table exists and has installation_completed
            if (Schema::hasTable('system_settings')) {
                $installed = DB::table('system_settings')
                    ->where('key', 'installation_completed')
                    ->exists();
                
                if ($installed) {
                    return true;
                }
            }

            // Check if at least one user exists (fallback check)
            if (Schema::hasTable('users')) {
                $userCount = DB::table('users')->count();
                if ($userCount > 0) {
                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            // If there's any database error, assume not installed
            return false;
        }
    }
}
