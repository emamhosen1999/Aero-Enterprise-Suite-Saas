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
 * This middleware runs GLOBALLY before sessions are started to ensure:
 * 1. The correct database connection is used for session storage
 * 2. Session cookies are isolated between central and tenant domains
 * 3. The correct authentication guard is used based on domain
 *
 * Session Isolation:
 * - Central domains (platform, admin): Use 'aeos_central_session' cookie
 * - Tenant domains: Use 'aeos_tenant_session' cookie
 *
 * Auth Guard:
 * - Admin domain: Use 'landlord' guard (landlord_users table)
 * - Other domains: Use default 'web' guard (users table)
 *
 * This prevents session bleeding and ensures proper authentication when users navigate between domains.
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

        // Central domains use the central database and central session cookie
        if ($this->isHostOnCentralDomain($host)) {
            $this->useCentralDatabase();
            $this->useCentralSessionCookie();

            // Set default auth guard based on domain
            if ($this->isHostAdminDomain($host)) {
                // Admin domain uses landlord guard
                $this->useLandlordGuard();
            }

            return $next($request);
        }

        // Tenant subdomains: Initialize tenancy BEFORE session starts
        // This ensures the correct database is used when loading the authenticated user
        $this->useTenantSessionCookie($host);
        $this->initializeTenancy($host);

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
     * Configure session cookie for central domains.
     * Uses a distinct cookie name to isolate from tenant sessions.
     * 
     * IMPORTANT: Sets session.domain to null (not the host) to ensure
     * the cookie is available on the current domain and subdomains.
     * This allows admin.domain.com to have a proper session cookie.
     */
    protected function useCentralSessionCookie(): void
    {
        Config::set('session.cookie', 'aeos_central_session');
        
        // Set session domain to null to allow cookie on current subdomain
        // This is critical for admin.domain.com to work properly
        Config::set('session.domain', null);
    }

    /**
     * Configure session cookie for tenant domains.
     * Uses a distinct cookie name to isolate from central sessions.
     * Each tenant subdomain gets its own session isolation.
     */
    protected function useTenantSessionCookie(string $host): void
    {
        // Use tenant-specific session cookie
        Config::set('session.cookie', 'aeos_tenant_session');
        
        // Set session domain to the specific subdomain (not shared across all subdomains)
        // This ensures tenant1.domain.com and tenant2.domain.com have separate sessions
        $hostWithoutPort = preg_replace('/:\d+$/', '', $host);
        Config::set('session.domain', $hostWithoutPort);
    }

    /**
     * Configure authentication to use the landlord guard.
     *
     * This should only be called for admin domains (admin.domain.com).
     * Sets the default guard to 'landlord' so that Auth::attempt()
     * and other Auth facade methods use landlord_users table instead of users table.
     */
    protected function useLandlordGuard(): void
    {
        // Set the default guard to landlord
        Config::set('auth.defaults.guard', 'landlord');
    }

    /**
     * Initialize tenancy for the given host.
     *
     * This MUST be called BEFORE the session starts to ensure the correct
     * database connection is used when loading the authenticated user from session.
     *
     * Without this, the auth middleware would try to load User::find($id) from
     * the central database instead of the tenant database, causing "table not found" errors.
     */
    protected function initializeTenancy(string $host): void
    {
        // Skip if tenancy is already initialized
        if (function_exists('tenant') && tenant()) {
            return;
        }

        // Resolve tenant by domain
        $domainModel = config('tenancy.domain_model');
        if (! $domainModel || ! class_exists($domainModel)) {
            return;
        }

        $hostWithoutPort = preg_replace('/:\d+$/', '', $host);
        $domain = $domainModel::where('domain', $hostWithoutPort)->first();

        if (! $domain || ! $domain->tenant) {
            return;
        }

        // Initialize tenancy - this switches the database connection
        try {
            tenancy()->initialize($domain->tenant);
        } catch (\Throwable $e) {
            // Log but don't fail - the route middleware will handle the error
            \Illuminate\Support\Facades\Log::warning('Early tenancy initialization failed', [
                'host' => $host,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
