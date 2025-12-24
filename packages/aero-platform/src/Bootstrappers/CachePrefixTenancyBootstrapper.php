<?php

declare(strict_types=1);

namespace Aero\Platform\Bootstrappers;

use Illuminate\Support\Facades\Config;
use Stancl\Tenancy\Contracts\TenancyBootstrapper;
use Stancl\Tenancy\Contracts\Tenant;

/**
 * Cache Prefix Tenancy Bootstrapper
 *
 * Provides tenant isolation for cache operations when Redis is not available.
 * Works with all cache drivers (file, database, array, etc.) by prefixing cache keys.
 *
 * Unlike stancl/tenancy's CacheTenancyBootstrapper which requires tag-supporting
 * cache drivers (Redis, Memcached), this bootstrapper uses key prefixing which
 * works with any cache driver.
 *
 * How it works:
 * - On tenancy initialization: Adds tenant ID to cache prefix
 * - On tenancy end: Reverts to original cache prefix
 *
 * Security: This prevents cache key collisions between tenants and ensures
 * one tenant cannot read another tenant's cached data.
 *
 * Example:
 * - Original prefix: "eos365_cache_"
 * - Tenant prefix: "eos365_cache_tenant_abc123_"
 */
class CachePrefixTenancyBootstrapper implements TenancyBootstrapper
{
    /**
     * Original cache prefix before tenancy was initialized
     */
    protected ?string $originalPrefix = null;

    /**
     * Bootstrap tenancy for the given tenant.
     *
     * Called when tenancy is initialized (TenancyInitialized event).
     * Adds tenant ID to the cache prefix for all cache operations.
     */
    public function bootstrap(Tenant $tenant): void
    {
        // Store original prefix to restore later
        $this->originalPrefix = Config::get('cache.prefix', '');

        // Create tenant-scoped prefix
        // Format: {original_prefix}tenant_{tenant_id}_
        $tenantPrefix = $this->originalPrefix . 'tenant_' . $tenant->getTenantKey() . '_';

        // Apply to cache config
        Config::set('cache.prefix', $tenantPrefix);

        // Force the cache manager to pick up the new prefix
        // This is needed because the cache repository may already be instantiated
        if (app()->resolved('cache')) {
            app('cache')->forgetDriver(Config::get('cache.default'));
        }
    }

    /**
     * Revert the bootstrapper to central context.
     *
     * Called when tenancy ends (TenancyEnded event).
     * Restores the original cache prefix.
     */
    public function revert(): void
    {
        if ($this->originalPrefix !== null) {
            Config::set('cache.prefix', $this->originalPrefix);

            // Force cache manager to pick up restored prefix
            if (app()->resolved('cache')) {
                app('cache')->forgetDriver(Config::get('cache.default'));
            }
        }

        $this->originalPrefix = null;
    }
}
