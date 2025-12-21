<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Aero\Core\Contracts\TenantScopeInterface;
use Aero\Core\Traits\ParsesHostDomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure Tenant Context Middleware
 *
 * Dual-architecture middleware that ensures valid context for routes:
 *
 * SaaS Mode (with aero-platform):
 * - Requires valid tenant context from InitializeTenancyIfNotCentral
 * - 404s if tenant() is not available (central domain access)
 *
 * Standalone Mode (without aero-platform):
 * - Acts as passthrough (no tenant context required)
 * - Allows all requests since there's no multi-tenancy
 *
 * This provides a safety net for tenant-only routes in SaaS mode
 * while remaining compatible with standalone deployments.
 */
class EnsureTenantContext
{
    use ParsesHostDomain;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Standalone Mode: No platform package = no tenancy = passthrough
        if (! $this->isSaaSMode()) {
            return $next($request);
        }

        // SaaS Mode: Use TenantScopeInterface if available
        if (app()->bound(TenantScopeInterface::class)) {
            $tenantScope = app(TenantScopeInterface::class);

            if ($tenantScope->inTenantContext()) {
                return $next($request);
            }
        }

        // Fallback: Check stancl/tenancy's tenant() helper
        if (function_exists('tenant') && tenant()) {
            return $next($request);
        }

        // SaaS Mode without tenant context - 404
        // Either on central domain or tenant couldn't be resolved
        abort(404);
    }

    /**
     * Check if running in SaaS mode.
     *
     * Uses global helper for consistency.
     */
    protected function isSaaSMode(): bool
    {
        // Use global helper if available
        if (function_exists('is_saas_mode')) {
            return is_saas_mode();
        }

        // Fallback during early boot
        return class_exists(\Aero\Platform\AeroPlatformServiceProvider::class);
    }
}
