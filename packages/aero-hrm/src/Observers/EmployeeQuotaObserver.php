<?php

declare(strict_types=1);

namespace Aero\HRM\Observers;

use Aero\Core\Support\TenantCache;
use Aero\HRM\Models\Employee;

/**
 * EmployeeQuotaObserver
 *
 * Invalidates the cached employee quota count whenever an employee record is
 * created, permanently deleted, or restored so that QuotaEnforcementService
 * always uses a fresh count on the next check.
 */
class EmployeeQuotaObserver
{
    /**
     * Bust the quota cache after a new employee is created.
     */
    public function created(Employee $employee): void
    {
        $this->bustCache();
    }

    /**
     * Bust the quota cache after an employee is permanently deleted.
     */
    public function deleted(Employee $employee): void
    {
        $this->bustCache();
    }

    /**
     * Bust the quota cache after a soft-deleted employee is restored.
     */
    public function restored(Employee $employee): void
    {
        $this->bustCache();
    }

    /**
     * Clear the tenant-scoped employee quota cache.
     */
    protected function bustCache(): void
    {
        $tenant = function_exists('tenant') ? tenant() : null;

        if (! $tenant) {
            return;
        }

        TenantCache::forget("quota:usage:{$tenant->id}:employees");
    }
}
