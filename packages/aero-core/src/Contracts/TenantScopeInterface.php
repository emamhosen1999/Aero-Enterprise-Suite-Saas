<?php

namespace Aero\Core\Contracts;

/**
 * TenantScopeInterface
 *
 * Contract for tenant scope implementations.
 * This allows aero-core to be completely agnostic about how tenancy is implemented.
 *
 * In SaaS mode (with aero-platform): Bound to SaaSTenantScope (uses stancl/tenancy)
 * In Standalone mode: Bound to StandaloneTenantScope (returns tenant_id = 1)
 *
 * Usage in services/controllers:
 *   $tenantScope = app(TenantScopeInterface::class);
 *   $tenantId = $tenantScope->getCurrentTenantId();
 */
interface TenantScopeInterface
{
    /**
     * Get the current tenant ID.
     *
     * @return int|string|null
     */
    public function getCurrentTenantId(): int|string|null;

    /**
     * Get the current tenant model (if available).
     *
     * @return mixed
     */
    public function getCurrentTenant(): mixed;

    /**
     * Check if we are in a tenant context.
     *
     * @return bool
     */
    public function inTenantContext(): bool;

    /**
     * Check if we are in central/landlord context.
     *
     * @return bool
     */
    public function inCentralContext(): bool;

    /**
     * Get the mode ('saas' or 'standalone').
     *
     * @return string
     */
    public function getMode(): string;

    /**
     * Check if running in SaaS mode.
     *
     * @return bool
     */
    public function isSaaSMode(): bool;

    /**
     * Check if running in Standalone mode.
     *
     * @return bool
     */
    public function isStandaloneMode(): bool;
}
