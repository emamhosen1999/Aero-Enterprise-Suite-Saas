<?php

declare(strict_types=1);

namespace Aero\Platform\Jobs;

use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\Quotas\QuotaEnforcementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Monitor Storage Usage Job
 *
 * Scheduled job to calculate and update storage usage for all tenants:
 * - Runs daily
 * - Scans tenant storage directories
 * - Calculates total storage in GB
 * - Updates usage records
 * - Triggers warnings if approaching limit
 */
class MonitorStorageUsageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(QuotaEnforcementService $quotaService): void
    {
        Log::info('Starting storage usage monitoring for all tenants');

        $tenants = Tenant::where('status', 'active')->get();
        $totalStorage = 0;
        $tenantsUpdated = 0;

        foreach ($tenants as $tenant) {
            try {
                $storageUsedBytes = $this->calculateTenantStorage($tenant);
                $storageUsedGb = $storageUsedBytes / (1024 * 1024 * 1024);

                // Update tenant metadata with current storage
                $metadata = $tenant->metadata ?? [];
                $metadata['storage_usage_gb'] = round($storageUsedGb, 2);
                $metadata['storage_last_calculated'] = now()->toDateTimeString();
                $tenant->metadata = $metadata;
                $tenant->save();

                // Record usage
                $quotaService->recordUsage($tenant, 'storage', 'set', round($storageUsedGb, 2));

                $totalStorage += $storageUsedGb;
                $tenantsUpdated++;

                // Check if approaching limit
                $limit = $quotaService->getQuotaLimit($tenant, 'storage');
                if ($limit > 0) {
                    $percentage = ($storageUsedGb / $limit) * 100;
                    
                    if ($percentage >= 80) {
                        Log::warning("Tenant {$tenant->id} storage at {$percentage}% ({$storageUsedGb}GB / {$limit}GB)");
                    }
                }
            } catch (\Exception $e) {
                Log::error("Failed to calculate storage for tenant {$tenant->id}: {$e->getMessage()}");
            }
        }

        Log::info("Storage monitoring complete: {$tenantsUpdated} tenants updated, {$totalStorage}GB total");
    }

    /**
     * Calculate total storage used by a tenant.
     */
    protected function calculateTenantStorage(Tenant $tenant): int
    {
        $totalBytes = 0;

        // Define storage paths to check for this tenant
        $storagePaths = $this->getTenantStoragePaths($tenant);

        foreach ($storagePaths as $path) {
            try {
                if (Storage::exists($path)) {
                    $totalBytes += $this->getDirectorySize($path);
                }
            } catch (\Exception $e) {
                Log::warning("Could not calculate storage for path {$path}: {$e->getMessage()}");
            }
        }

        return $totalBytes;
    }

    /**
     * Get all storage paths for a tenant.
     */
    protected function getTenantStoragePaths(Tenant $tenant): array
    {
        $tenantId = $tenant->id;
        
        return [
            "tenants/{$tenantId}/uploads",
            "tenants/{$tenantId}/documents",
            "tenants/{$tenantId}/attachments",
            "tenants/{$tenantId}/exports",
            "tenants/{$tenantId}/media",
            "tenants/{$tenantId}/backups",
        ];
    }

    /**
     * Recursively calculate directory size.
     */
    protected function getDirectorySize(string $path): int
    {
        $size = 0;

        try {
            $files = Storage::allFiles($path);
            
            foreach ($files as $file) {
                $size += Storage::size($file);
            }
        } catch (\Exception $e) {
            Log::warning("Error calculating size for directory {$path}: {$e->getMessage()}");
        }

        return $size;
    }
}
