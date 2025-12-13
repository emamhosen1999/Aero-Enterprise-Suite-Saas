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
 * This prevents the "Tenant could not be identified" error on central domains
 * when routes don't have explicit domain constraints.
 *
 * Usage: Apply this instead of InitializeTenancyByDomain to routes that should
 * only work on tenant subdomains but don't have explicit domain patterns.
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
            // Return 404 to indicate this route doesn't exist on central domains
            abort(404, 'Route not available on this domain.');
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

        return false;
    }
}
