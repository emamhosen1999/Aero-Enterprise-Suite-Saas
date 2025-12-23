<?php

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;

class BootstrapGuard
{
    /**
     * Handle an incoming request.
     *
     * Checks installation status and enforces installation flow.
     * Also forces file-based sessions during installation (no DB dependency).
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only in standalone mode; otherwise skip
        if (config('aero.mode') !== 'standalone') {
            return $next($request);
        }

        $isInstalled = file_exists(storage_path('installed'));

        // Force file-based sessions BEFORE sessions initialize
        // This must run before StartSession. Because this middleware is
        // prepended globally, it executes early enough.
        Config::set('session.driver', 'file');
        Config::set('cache.default', 'file');

        // If not installed, only allow /install routes
        if (!$isInstalled && !$request->is('install*')) {
            return redirect('/install');
        }

        // If installed, redirect /install to dashboard (already installed)
        if ($isInstalled && $request->is('install*')) {
            return redirect('/dashboard');
        }

        return $next($request);
    }
}
