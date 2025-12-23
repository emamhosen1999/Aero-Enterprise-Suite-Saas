<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Tenant;

use Aero\Platform\Models\Tenant;
use Carbon\Carbon;

/**
 * Tenant Retention Service
 *
 * Manages tenant retention policy enforcement.
 * Determines if tenants can be restored or should be purged.
 */
class TenantRetentionService
{
    /**
     * Check if retention policy is expired for a tenant.
     *
     * @param Tenant $tenant
     * @return bool
     */
    public function retentionExpired(Tenant $tenant): bool
    {
        if (!$tenant->trashed()) {
            return false;
        }

        $retentionDays = config('tenancy.retention.days', 30);
        
        return $tenant->deleted_at
            ->addDays($retentionDays)
            ->isPast();
    }

    /**
     * Check if a tenant can be restored.
     *
     * @param Tenant $tenant
     * @return bool
     */
    public function canRestore(Tenant $tenant): bool
    {
        if (!$tenant->trashed()) {
            return false;
        }

        return !$this->retentionExpired($tenant);
    }

    /**
     * Check if a tenant can be purged.
     *
     * @param Tenant $tenant
     * @return bool
     */
    public function canPurge(Tenant $tenant): bool
    {
        if (!$tenant->trashed()) {
            return false;
        }

        return $this->retentionExpired($tenant);
    }

    /**
     * Get the retention expiration date for a tenant.
     *
     * @param Tenant $tenant
     * @return Carbon|null
     */
    public function getRetentionExpiresAt(Tenant $tenant): ?Carbon
    {
        if (!$tenant->trashed()) {
            return null;
        }

        $retentionDays = config('tenancy.retention.days', 30);
        
        return $tenant->deleted_at->addDays($retentionDays);
    }

    /**
     * Get days remaining until retention expires.
     *
     * @param Tenant $tenant
     * @return int|null
     */
    public function getDaysUntilPurge(Tenant $tenant): ?int
    {
        $expiresAt = $this->getRetentionExpiresAt($tenant);
        
        if (!$expiresAt) {
            return null;
        }

        return max(0, now()->diffInDays($expiresAt, false));
    }

    /**
     * Get tenants eligible for purge.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getTenantsEligibleForPurge()
    {
        $retentionDays = config('tenancy.retention.days', 30);
        $expiredDate = now()->subDays($retentionDays);

        return Tenant::onlyTrashed()
            ->where('deleted_at', '<=', $expiredDate)
            ->get();
    }

    /**
     * Get tenants nearing purge (for notifications).
     *
     * @return \Illuminate\Support\Collection
     */
    public function getTenantsNearingPurge()
    {
        $retentionDays = config('tenancy.retention.days', 30);
        $notifyDays = config('tenancy.retention.notify_before_purge_days', 7);
        
        $notifyDate = now()->subDays($retentionDays - $notifyDays);
        $expiredDate = now()->subDays($retentionDays);

        return Tenant::onlyTrashed()
            ->whereBetween('deleted_at', [$expiredDate, $notifyDate])
            ->get();
    }
}
