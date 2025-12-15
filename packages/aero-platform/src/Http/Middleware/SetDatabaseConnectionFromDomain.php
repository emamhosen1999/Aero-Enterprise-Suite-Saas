<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Aero\Core\Traits\ParsesHostDomain;
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
 * Auto-detects domain type from URL structure (no .env required):
 * - admin.domain.com → Central database
 * - domain.com → Central database
 * - {tenant}.domain.com → Let tenancy package handle connection
 */
class SetDatabaseConnectionFromDomain
{
    use ParsesHostDomain;
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();

        // Central domains use the central database
        if ($this->isHostOnCentralDomain($host)) {
            $this->useCentralDatabase();

            return $next($request);
        }

        // Tenant subdomains - let tenancy package handle connection
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
}
