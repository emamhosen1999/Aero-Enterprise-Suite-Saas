<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Aero\Core\Traits\ParsesHostDomain;
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
 * Auto-detects domain type from URL structure (no .env required):
 * - admin.domain.com → Skip tenancy (central)
 * - domain.com → Skip tenancy (central/platform)
 * - {tenant}.domain.com → Initialize tenancy
 *
 * This prevents the "Tenant could not be identified" error on central domains
 * when routes don't have explicit domain constraints.
 */
class InitializeTenancyIfNotCentral
{
    use ParsesHostDomain;
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if we're on a central domain using trait's helper
        if ($this->isHostOnCentralDomain($request->getHost())) {
            // On central domain - skip tenancy initialization entirely
            return $next($request);
        }

        // Not on central domain - proceed with tenancy initialization
        return app(InitializeTenancyByDomain::class)->handle($request, $next);
    }
}
