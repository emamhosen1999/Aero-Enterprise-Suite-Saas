<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Symfony\Component\HttpFoundation\Response;

/**
 * Initialize Tenancy If Not Central Domain
 *
 * This middleware wraps InitializeTenancyByDomain and only initializes
 * tenancy when the request is NOT on a central domain.
 *
 * On central domains: Skip tenancy initialization and proceed normally.
 * On tenant domains: Initialize tenancy via stancl/tenancy.
 *
 * This prevents the "Tenant could not be identified" error on central domains
 * when routes don't have explicit domain constraints.
 *
 * IMPORTANT: This middleware does NOT abort on central domains - it simply
 * skips tenancy initialization and lets the request continue. If a route
 * should ONLY work on tenant domains, use domain constraints or check
 * tenant() availability in the controller.
 */
class InitializeTenancyIfNotCentral
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if we're on a central domain
        if ($this->isOnCentralDomain($request)) {
            // On central domain - skip tenancy initialization entirely
            // Do NOT abort - just proceed without tenancy
            return $next($request);
        }

        // Not on central domain - proceed with tenancy initialization
        return app(InitializeTenancyByDomain::class)->handle($request, $next);
    }

    /**
     * Check if the current request is on a central domain.
     */
    protected function isOnCentralDomain(Request $request): bool
    {
        $host = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);

        // Direct match
        if (in_array($host, $centralDomains, true)) {
            return true;
        }

        // Check with port stripped
        $hostWithoutPort = preg_replace('/:\d+$/', '', $host);
        foreach ($centralDomains as $centralDomain) {
            $domainWithoutPort = preg_replace('/:\d+$/', '', $centralDomain);
            if (strtolower($hostWithoutPort) === strtolower($domainWithoutPort)) {
                return true;
            }
        }

        // Check for admin subdomain pattern
        if (str_starts_with($host, 'admin.')) {
            return true;
        }

        // Check if this is a non-subdomain request (central domain)
        // Tenant domains are typically subdomains like tenant.domain.com
        // Central domains are typically root domains like domain.com
        $platformDomain = env('PLATFORM_DOMAIN', 'localhost');

        // If PLATFORM_DOMAIN is set, check if host matches it exactly
        if ($platformDomain && strtolower($hostWithoutPort) === strtolower($platformDomain)) {
            return true;
        }

        // For local development: .test and .local domains without subdomains are central
        // Check if host is NOT a subdomain (doesn't have a dot before the TLD pattern)
        if (preg_match('/^[^.]+\.(test|local|localhost)$/i', $hostWithoutPort)) {
            // This is a root .test/.local domain (no subdomain), treat as central
            return true;
        }

        return false;
    }
}
