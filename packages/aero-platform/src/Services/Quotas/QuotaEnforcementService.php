<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Quotas;

use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Models\UsageRecord;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Quota Enforcement Service
 *
 * Enforces usage quotas based on tenant subscription plan.
 * Tracks and limits: users, storage, API calls, modules, etc.
 *
 * Quota Types:
 * - max_users: Maximum number of users in tenant
 * - max_storage_gb: Maximum storage in GB
 * - max_api_calls_monthly: Monthly API call limit
 * - max_employees: Maximum employees (HRM)
 * - max_projects: Maximum projects (Project module)
 *
 * Usage:
 * ```php
 * $quotaService = app(QuotaEnforcementService::class);
 *
 * // Check before creating user
 * if (!$quotaService->canCreate($tenant, 'users')) {
 *     throw new QuotaExceededException('User limit reached');
 * }
 *
 * // Increment usage after creation
 * $quotaService->increment($tenant, 'users');
 * ```
 */
class QuotaEnforcementService
{
    /**
     * Default quotas per plan.
     */
    protected array $defaultQuotas = [
        'free' => [
            'max_users' => 5,
            'max_storage_gb' => 1,
            'max_api_calls_monthly' => 10000,
            'max_employees' => 10,
            'max_projects' => 3,
            'max_customers' => 50,
            'max_rfis' => 100,
        ],
        'starter' => [
            'max_users' => 25,
            'max_storage_gb' => 10,
            'max_api_calls_monthly' => 100000,
            'max_employees' => 50,
            'max_projects' => 20,
            'max_customers' => 500,
            'max_rfis' => 1000,
        ],
        'professional' => [
            'max_users' => 100,
            'max_storage_gb' => 50,
            'max_api_calls_monthly' => 500000,
            'max_employees' => 200,
            'max_projects' => 100,
            'max_customers' => 5000,
            'max_rfis' => 10000,
        ],
        'enterprise' => [
            'max_users' => -1, // Unlimited
            'max_storage_gb' => -1,
            'max_api_calls_monthly' => -1,
            'max_employees' => -1,
            'max_projects' => -1,
            'max_customers' => -1,
            'max_rfis' => -1,
        ],
    ];

    /**
     * Mapping of quota types to their model classes for counting.
     */
    protected array $quotaModels = [
        'users' => \Aero\Core\Models\User::class,
        // These will be resolved dynamically if the module is available
        'employees' => 'Aero\\HRM\\Models\\Employee',
        'projects' => 'Aero\\Project\\Models\\Project',
        'customers' => 'Aero\\CRM\\Models\\Customer',
        'rfis' => 'Aero\\Rfi\\Models\\Rfi',
    ];

    /**
     * Cache TTL for quota checks (in seconds).
     */
    protected int $cacheTtl = 300; // 5 minutes

    /**
     * Check if tenant can create a new resource of the given type.
     *
     * @param Tenant|string $tenant
     * @param string $quotaType users, employees, projects, etc.
     * @return bool
     */
    public function canCreate(Tenant|string $tenant, string $quotaType): bool
    {
        $limit = $this->getQuotaLimit($tenant, $quotaType);

        // -1 means unlimited
        if ($limit === -1) {
            return true;
        }

        $current = $this->getCurrentUsage($tenant, $quotaType);

        return $current < $limit;
    }

    /**
     * Check storage quota.
     *
     * @param Tenant|string $tenant
     * @param int $additionalBytes Additional bytes to be added
     * @return bool
     */
    public function canUseStorage(Tenant|string $tenant, int $additionalBytes = 0): bool
    {
        $limitGb = $this->getQuotaLimit($tenant, 'storage_gb');

        // -1 means unlimited
        if ($limitGb === -1) {
            return true;
        }

        $currentBytes = $this->getStorageUsage($tenant);
        $limitBytes = $limitGb * 1024 * 1024 * 1024; // Convert GB to bytes

        return ($currentBytes + $additionalBytes) <= $limitBytes;
    }

    /**
     * Check monthly API call quota.
     *
     * @param Tenant|string $tenant
     * @return bool
     */
    public function canMakeApiCall(Tenant|string $tenant): bool
    {
        $limit = $this->getQuotaLimit($tenant, 'api_calls_monthly');

        // -1 means unlimited
        if ($limit === -1) {
            return true;
        }

        $current = $this->getMonthlyApiCalls($tenant);

        return $current < $limit;
    }

    /**
     * Increment API call count for the current month.
     *
     * @param Tenant|string $tenant
     */
    public function incrementApiCalls(Tenant|string $tenant): void
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $month = now()->format('Y-m');
        $key = "quota:api_calls:{$tenantId}:{$month}";

        Cache::increment($key);

        // Set expiry to end of next month (to handle month transitions)
        if (Cache::get($key) === 1) {
            Cache::put($key, 1, now()->addMonths(2)->startOfMonth());
        }
    }

    /**
     * Get quota limit for a tenant and type.
     *
     * @param Tenant|string $tenant
     * @param string $quotaType
     * @return int -1 for unlimited
     */
    public function getQuotaLimit(Tenant|string $tenant, string $quotaType): int
    {
        if (is_string($tenant)) {
            $tenant = Tenant::find($tenant);
        }

        if (! $tenant) {
            return $this->defaultQuotas['free']["max_{$quotaType}"] ?? 0;
        }

        $plan = $tenant->plan;

        if (! $plan) {
            return $this->defaultQuotas['free']["max_{$quotaType}"] ?? 0;
        }

        // Check plan metadata for custom quota
        $customQuota = $plan->metadata["max_{$quotaType}"] ?? null;
        if ($customQuota !== null) {
            return (int) $customQuota;
        }

        // Check tenant metadata for custom quota (overrides plan)
        $tenantQuota = $tenant->metadata["max_{$quotaType}"] ?? null;
        if ($tenantQuota !== null) {
            return (int) $tenantQuota;
        }

        // Fall back to default quotas
        $planCode = strtolower($plan->code ?? 'free');

        return $this->defaultQuotas[$planCode]["max_{$quotaType}"] ?? 0;
    }

    /**
     * Get current usage for a quota type.
     *
     * @param Tenant|string $tenant
     * @param string $quotaType
     * @return int
     */
    public function getCurrentUsage(Tenant|string $tenant, string $quotaType): int
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $cacheKey = "quota:usage:{$tenantId}:{$quotaType}";

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($quotaType) {
            $modelClass = $this->quotaModels[$quotaType] ?? null;

            if (! $modelClass || ! class_exists($modelClass)) {
                return 0;
            }

            return $modelClass::count();
        });
    }

    /**
     * Get storage usage in bytes.
     *
     * @param Tenant|string $tenant
     * @return int
     */
    public function getStorageUsage(Tenant|string $tenant): int
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $cacheKey = "quota:storage:{$tenantId}";

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($tenantId) {
            // Calculate storage from tenant's storage directory
            $path = "tenants/{$tenantId}";

            if (! Storage::exists($path)) {
                return 0;
            }

            return $this->calculateDirectorySize($path);
        });
    }

    /**
     * Get monthly API calls count.
     *
     * @param Tenant|string $tenant
     * @return int
     */
    public function getMonthlyApiCalls(Tenant|string $tenant): int
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $month = now()->format('Y-m');
        $key = "quota:api_calls:{$tenantId}:{$month}";

        return (int) Cache::get($key, 0);
    }

    /**
     * Get all quotas and usage for a tenant.
     *
     * @param Tenant|string $tenant
     * @return array
     */
    public function getQuotaSummary(Tenant|string $tenant): array
    {
        $summary = [];

        foreach (['users', 'employees', 'projects', 'customers', 'rfis'] as $type) {
            $limit = $this->getQuotaLimit($tenant, $type);
            $usage = $this->getCurrentUsage($tenant, $type);

            $summary[$type] = [
                'limit' => $limit,
                'used' => $usage,
                'remaining' => $limit === -1 ? -1 : max(0, $limit - $usage),
                'percentage' => $limit === -1 ? 0 : ($limit > 0 ? round(($usage / $limit) * 100, 2) : 100),
                'unlimited' => $limit === -1,
            ];
        }

        // Storage (special handling for GB)
        $storageLimit = $this->getQuotaLimit($tenant, 'storage_gb');
        $storageUsed = $this->getStorageUsage($tenant);
        $storageUsedGb = round($storageUsed / (1024 * 1024 * 1024), 2);

        $summary['storage_gb'] = [
            'limit' => $storageLimit,
            'used' => $storageUsedGb,
            'remaining' => $storageLimit === -1 ? -1 : max(0, $storageLimit - $storageUsedGb),
            'percentage' => $storageLimit === -1 ? 0 : ($storageLimit > 0 ? round(($storageUsedGb / $storageLimit) * 100, 2) : 100),
            'unlimited' => $storageLimit === -1,
        ];

        // Monthly API calls
        $apiLimit = $this->getQuotaLimit($tenant, 'api_calls_monthly');
        $apiUsed = $this->getMonthlyApiCalls($tenant);

        $summary['api_calls_monthly'] = [
            'limit' => $apiLimit,
            'used' => $apiUsed,
            'remaining' => $apiLimit === -1 ? -1 : max(0, $apiLimit - $apiUsed),
            'percentage' => $apiLimit === -1 ? 0 : ($apiLimit > 0 ? round(($apiUsed / $apiLimit) * 100, 2) : 100),
            'unlimited' => $apiLimit === -1,
            'resets_at' => now()->addMonth()->startOfMonth()->toIso8601String(),
        ];

        return $summary;
    }

    /**
     * Clear cached quota usage for a tenant.
     *
     * @param Tenant|string $tenant
     * @param string|null $quotaType If null, clears all
     */
    public function clearCache(Tenant|string $tenant, ?string $quotaType = null): void
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;

        if ($quotaType) {
            Cache::forget("quota:usage:{$tenantId}:{$quotaType}");
        } else {
            foreach (array_keys($this->quotaModels) as $type) {
                Cache::forget("quota:usage:{$tenantId}:{$type}");
            }
            Cache::forget("quota:storage:{$tenantId}");
        }
    }

    /**
     * Set custom quota for a tenant (overrides plan limits).
     *
     * @param Tenant $tenant
     * @param string $quotaType
     * @param int $limit -1 for unlimited
     */
    public function setCustomQuota(Tenant $tenant, string $quotaType, int $limit): void
    {
        $metadata = $tenant->metadata ?? [];
        $metadata["max_{$quotaType}"] = $limit;
        $tenant->update(['metadata' => $metadata]);
    }

    /**
     * Record usage for audit/billing purposes.
     *
     * @param Tenant $tenant
     * @param string $quotaType
     * @param string $action increment|decrement
     * @param int $amount
     */
    public function recordUsage(Tenant $tenant, string $quotaType, string $action, int $amount = 1): void
    {
        UsageRecord::create([
            'tenant_id' => $tenant->id,
            'type' => $quotaType,
            'action' => $action,
            'amount' => $amount,
            'recorded_at' => now(),
        ]);

        // Clear cache so next check gets fresh data
        $this->clearCache($tenant, $quotaType);
    }

    /**
     * Calculate directory size recursively.
     *
     * @param string $path
     * @return int Size in bytes
     */
    protected function calculateDirectorySize(string $path): int
    {
        $size = 0;

        foreach (Storage::allFiles($path) as $file) {
            $size += Storage::size($file);
        }

        return $size;
    }

    /**
     * Check if tenant is approaching quota limit (80% threshold).
     *
     * @param Tenant|string $tenant
     * @param string $quotaType
     * @return bool
     */
    public function isApproachingLimit(Tenant|string $tenant, string $quotaType): bool
    {
        $limit = $this->getQuotaLimit($tenant, $quotaType);

        if ($limit === -1) {
            return false;
        }

        $current = $quotaType === 'api_calls_monthly'
            ? $this->getMonthlyApiCalls($tenant)
            : $this->getCurrentUsage($tenant, $quotaType);

        return $current >= ($limit * 0.8);
    }

    /**
     * Get tenants that are approaching or exceeding quotas.
     *
     * @return array
     */
    public function getTenantsNearingQuotas(): array
    {
        $tenants = Tenant::where('status', 'active')->get();
        $warnings = [];

        foreach ($tenants as $tenant) {
            foreach (array_keys($this->quotaModels) as $type) {
                if ($this->isApproachingLimit($tenant, $type)) {
                    $warnings[] = [
                        'tenant_id' => $tenant->id,
                        'tenant_name' => $tenant->name,
                        'quota_type' => $type,
                        'current' => $this->getCurrentUsage($tenant, $type),
                        'limit' => $this->getQuotaLimit($tenant, $type),
                    ];
                }
            }
        }

        return $warnings;
    }
}
