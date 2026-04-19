<?php

declare(strict_types=1);

namespace Aero\Core\Observers;

use Aero\Core\Models\User;
use Aero\Core\Support\TenantCache;

/**
 * UserQuotaObserver
 *
 * Invalidates the cached user quota count whenever a user is created or
 * permanently deleted so that QuotaEnforcementService always uses a fresh
 * count on the next check.
 */
class UserQuotaObserver
{
    /**
     * Bust the quota cache after a new user is created.
     */
    public function created(User $user): void
    {
        $this->bustCache();
    }

    /**
     * Bust the quota cache after a user is permanently deleted.
     */
    public function deleted(User $user): void
    {
        $this->bustCache();
    }

    /**
     * Bust the quota cache after a soft-deleted user is restored.
     */
    public function restored(User $user): void
    {
        $this->bustCache();
    }

    /**
     * Clear the tenant-scoped user quota cache.
     *
     * The cache key pattern matches what QuotaEnforcementService::getCurrentUsage()
     * stores: "quota:usage:{tenantId}:users".  Because the observer runs inside
     * the tenant context, tenant() returns the current tenant.
     */
    protected function bustCache(): void
    {
        $tenant = function_exists('tenant') ? tenant() : null;

        if (! $tenant) {
            return;
        }

        TenantCache::forget("quota:usage:{$tenant->id}:users");
    }
}
