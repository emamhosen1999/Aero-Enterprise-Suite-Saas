<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * OptimizeTenantCache Middleware
 *
 * Provides tenant-specific caching optimizations using Redis.
 * Ensures cache isolation between tenants and optimizes
 * frequently accessed data.
 *
 * Features:
 * - Tenant-scoped cache prefixes
 * - Permission caching with tags
 * - Config caching per tenant
 * - Automatic cache warming for common data
 */
class OptimizeTenantCache
{
    /**
     * Cache keys that should be warmed on first request.
     */
    protected array $warmableKeys = [
        'permissions',
        'roles',
        'modules',
        'settings',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip if no tenant context
        if (! tenant()) {
            return $next($request);
        }

        $tenantId = tenant('id');

        // Set tenant-specific cache prefix
        $this->setTenantCachePrefix($tenantId);

        // Warm cache on first request if needed
        $this->warmCacheIfNeeded($tenantId);

        return $next($request);
    }

    /**
     * Set the cache prefix for the current tenant.
     */
    protected function setTenantCachePrefix(string $tenantId): void
    {
        // Configure Redis with tenant-specific prefix
        $currentPrefix = config('cache.prefix', 'laravel_cache');
        config(['cache.prefix' => "{$currentPrefix}_{$tenantId}"]);

        // For Redis specifically, add tenant tag support
        if (config('cache.default') === 'redis') {
            // Ensure the cache store uses tags
            config(['cache.stores.redis.prefix' => "tenant_{$tenantId}_"]);
        }
    }

    /**
     * Warm the cache with commonly accessed data.
     */
    protected function warmCacheIfNeeded(string $tenantId): void
    {
        $cacheWarmKey = "tenant_{$tenantId}_cache_warmed";

        // Check if cache is already warmed (TTL: 1 hour)
        if (Cache::has($cacheWarmKey)) {
            return;
        }

        // Mark as warmed to prevent repeated warming
        Cache::put($cacheWarmKey, true, now()->addHour());

        // Warm permissions cache
        $this->warmPermissionsCache($tenantId);

        // Warm roles cache
        $this->warmRolesCache($tenantId);

        // Warm modules cache
        $this->warmModulesCache($tenantId);

        // Warm settings cache
        $this->warmSettingsCache($tenantId);
    }

    /**
     * Cache all permissions for the tenant.
     */
    protected function warmPermissionsCache(string $tenantId): void
    {
        try {
            $permissions = \Spatie\Permission\Models\Permission::all(['id', 'name', 'guard_name']);
            $this->taggedCache($tenantId)->put(
                'all_permissions',
                $permissions->toArray(),
                now()->addDay()
            );
        } catch (\Exception $e) {
            // Silently fail - permissions table may not exist yet
        }
    }

    /**
     * Cache all roles for the tenant.
     */
    protected function warmRolesCache(string $tenantId): void
    {
        try {
            $roles = \Spatie\Permission\Models\Role::with('permissions:id,name')->get(['id', 'name', 'guard_name']);
            $this->taggedCache($tenantId)->put(
                'all_roles',
                $roles->toArray(),
                now()->addDay()
            );
        } catch (\Exception $e) {
            // Silently fail - roles table may not exist yet
        }
    }

    /**
     * Cache enabled modules for the tenant.
     */
    protected function warmModulesCache(string $tenantId): void
    {
        try {
            $tenant = tenant();
            $modules = $tenant->modules ?? [];

            $this->taggedCache($tenantId)->put(
                'enabled_modules',
                $modules,
                now()->addDay()
            );
        } catch (\Exception $e) {
            // Silently fail
        }
    }

    /**
     * Cache system settings for the tenant.
     */
    protected function warmSettingsCache(string $tenantId): void
    {
        try {
            $settings = \App\Models\SystemSetting::first();
            if ($settings) {
                $this->taggedCache($tenantId)->put(
                    'system_settings',
                    $settings->toArray(),
                    now()->addDay()
                );
            }
        } catch (\Exception $e) {
            // Silently fail - settings table may not exist yet
        }
    }

    /**
     * Get a cache instance with tenant tags.
     */
    protected function taggedCache(string $tenantId)
    {
        if (config('cache.default') === 'redis') {
            return Cache::tags(["tenant-{$tenantId}", 'tenant-cache']);
        }

        // Fallback for non-Redis drivers (no tag support)
        return Cache::store();
    }

    /**
     * Flush all cached data for a specific tenant.
     */
    public static function flushTenantCache(string $tenantId): void
    {
        if (config('cache.default') === 'redis') {
            Cache::tags(["tenant-{$tenantId}"])->flush();
        } else {
            // For non-Redis, manually clear known keys
            Cache::forget("tenant_{$tenantId}_cache_warmed");
            Cache::forget("tenant_{$tenantId}_all_permissions");
            Cache::forget("tenant_{$tenantId}_all_roles");
            Cache::forget("tenant_{$tenantId}_enabled_modules");
            Cache::forget("tenant_{$tenantId}_system_settings");
        }
    }

    /**
     * Flush permission cache for a tenant.
     */
    public static function flushPermissionsCache(string $tenantId): void
    {
        if (config('cache.default') === 'redis') {
            Cache::tags(["tenant-{$tenantId}", 'tenant-perms'])->flush();
        } else {
            Cache::forget("tenant_{$tenantId}_all_permissions");
            Cache::forget("tenant_{$tenantId}_all_roles");
        }
    }
}
