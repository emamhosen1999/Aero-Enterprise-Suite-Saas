<?php

declare(strict_types=1);

namespace Aero\Platform\Services;

use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Subscription;
use Illuminate\Support\Facades\Cache;

/**
 * Plan Entitlement Service
 * 
 * Enforces plan limits and module access at runtime.
 * Used by middleware and feature gates.
 */
class PlanEntitlementService
{
    /**
     * Check if tenant has reached user limit.
     */
    public function hasReachedUserLimit(string $tenantId): bool
    {
        // Standalone mode has no user limits
        if (config('aero.mode') === 'standalone') {
            return false;
        }

        $subscription = $this->getActiveSubscription($tenantId);
        
        if (!$subscription || !$subscription->plan) {
            return false; // No active plan, allow access
        }

        $plan = $subscription->plan;
        $maxUsers = $plan->max_users ?? $plan->limits['max_users'] ?? 0;

        // 0 means unlimited
        if ($maxUsers === 0) {
            return false;
        }

        // Count active tenant users
        $userCount = \Aero\Core\Models\User::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->count();

        return $userCount >= $maxUsers;
    }

    /**
     * Check if tenant has reached storage limit.
     */
    public function hasReachedStorageLimit(string $tenantId): bool
    {
        // Standalone mode has no storage limits
        if (config('aero.mode') === 'standalone') {
            return false;
        }

        $subscription = $this->getActiveSubscription($tenantId);
        
        if (!$subscription || !$subscription->plan) {
            return false;
        }

        $plan = $subscription->plan;
        $maxStorageGb = $plan->max_storage_gb ?? $plan->limits['max_storage_gb'] ?? 0;

        // 0 means unlimited
        if ($maxStorageGb === 0) {
            return false;
        }

        // TODO: Implement actual storage calculation
        // For now, assume not reached
        return false;
    }

    /**
     * Check if tenant has module access.
     */
    public function hasModuleAccess(string $tenantId, string $moduleCode): bool
    {
        // Standalone mode bypasses subscription checks
        if (config('aero.mode') === 'standalone') {
            return true;
        }

        $subscription = $this->getActiveSubscription($tenantId);
        
        if (!$subscription || !$subscription->plan) {
            // Restrict access by default if no active subscription
            return false;
        }

        $plan = $subscription->plan;

        // Check if module is in plan's modules
        return $plan->modules()
            ->where('code', $moduleCode)
            ->wherePivot('is_enabled', true)
            ->exists();
    }

    /**
     * Get remaining user slots.
     */
    public function getRemainingUserSlots(string $tenantId): ?int
    {
        // Standalone mode has unlimited user slots
        if (config('aero.mode') === 'standalone') {
            return null; // Unlimited
        }

        $subscription = $this->getActiveSubscription($tenantId);
        
        if (!$subscription || !$subscription->plan) {
            return null; // Unlimited
        }

        $plan = $subscription->plan;
        $maxUsers = $plan->max_users ?? $plan->limits['max_users'] ?? 0;

        if ($maxUsers === 0) {
            return null; // Unlimited
        }

        $userCount = \Aero\Core\Models\User::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->count();

        return max(0, $maxUsers - $userCount);
    }

    /**
     * Get active subscription for tenant (cached).
     */
    protected function getActiveSubscription(string $tenantId): ?Subscription
    {
        return Cache::remember(
            "tenant:{$tenantId}:active_subscription",
            now()->addMinutes(5),
            fn () => Subscription::where('tenant_id', $tenantId)
                ->with('plan.modules')
                ->active()
                ->first()
        );
    }

    /**
     * Clear entitlement cache for tenant.
     */
    public function clearCache(string $tenantId): void
    {
        Cache::forget("tenant:{$tenantId}:active_subscription");
    }
}
