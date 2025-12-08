<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Set Database Connection From Domain
 *
 * This middleware runs GLOBALLY before sessions are started to ensure
 * the correct database connection is used for session storage.
 *
 * For admin.platform.com and platform.com, the central database is used.
 * For tenant subdomains, tenancy initialization handles the connection.
 */
class SetDatabaseConnectionFromDomain
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();

        // Check for admin domain
        $adminDomain = env('ADMIN_DOMAIN', 'admin.localhost');
        if ($this->matchesDomain($host, $adminDomain) || str_starts_with($host, 'admin.')) {
            $this->useCentralDatabase();

            return $next($request);
        }

        // Check for platform/central domains
        $centralDomains = config('tenancy.central_domains', []);
        foreach ($centralDomains as $centralDomain) {
            if ($this->matchesDomain($host, $centralDomain)) {
                $this->useCentralDatabase();

                return $next($request);
            }
        }

        // For tenant domains, let tenancy package handle the connection
        return $next($request);
    }

    /**
     * Set the application to use the central database.
     */
    protected function useCentralDatabase(): void
    {
        // Set session to use central database connection
        Config::set('session.connection', 'central');

        // Set the default database connection to central
        Config::set('database.default', 'central');
        DB::setDefaultConnection('central');
    }

    /**
     * Check if host matches a domain pattern.
     * Handles both exact matches and localhost with ports.
     */
    protected function matchesDomain(string $host, string $domain): bool
    {
        // Normalize by removing ports
        $hostWithoutPort = preg_replace('/:\d+$/', '', $host);
        $domainWithoutPort = preg_replace('/:\d+$/', '', $domain);

        return strtolower($hostWithoutPort) === strtolower($domainWithoutPort);
    }
}
