<?php

declare(strict_types=1);

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Services\Tenant\TenantPurgeService;
use Aero\Platform\Services\Tenant\TenantRetentionService;
use Illuminate\Console\Command;

/**
 * Purge Expired Tenants Command
 *
 * Permanently deletes tenants that have exceeded their retention period.
 * Should be scheduled to run daily.
 */
class PurgeExpiredTenants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:purge-expired 
                            {--dry-run : Show what would be purged without actually deleting}
                            {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge tenants that have exceeded their retention period';

    /**
     * Execute the console command.
     */
    public function handle(
        TenantRetentionService $retentionService,
        TenantPurgeService $purgeService
    ): int {
        // Check if auto-purge is enabled
        if (!config('tenancy.retention.enabled', true)) {
            $this->info('Tenant retention is disabled');
            return self::SUCCESS;
        }

        if (!config('tenancy.retention.auto_purge', false) && !$this->option('force')) {
            $this->warn('Auto-purge is disabled. Use --force to purge manually.');
            return self::SUCCESS;
        }

        // Get tenants eligible for purge
        $eligibleTenants = $retentionService->getTenantsEligibleForPurge();

        if ($eligibleTenants->isEmpty()) {
            $this->info('No tenants eligible for purging');
            return self::SUCCESS;
        }

        $this->info("Found {$eligibleTenants->count()} tenant(s) eligible for purging:");
        
        // Display table of tenants
        $this->table(
            ['ID', 'Name', 'Subdomain', 'Deleted At', 'Days Since Deletion'],
            $eligibleTenants->map(function ($tenant) {
                return [
                    substr($tenant->id, 0, 8) . '...',
                    $tenant->name,
                    $tenant->subdomain,
                    $tenant->deleted_at->toDateTimeString(),
                    $tenant->deleted_at->diffInDays(now()),
                ];
            })->toArray()
        );

        // Dry run mode
        if ($this->option('dry-run')) {
            $this->warn('DRY RUN - No tenants were purged');
            return self::SUCCESS;
        }

        // Confirm purge
        if (!$this->option('force')) {
            if (!$this->confirm('This will PERMANENTLY delete these tenants. Are you sure?')) {
                $this->info('Purge cancelled');
                return self::SUCCESS;
            }
        }

        // Purge tenants
        $this->info('Starting purge process...');
        
        $results = $purgeService->batchPurge($eligibleTenants);

        // Display results
        $this->newLine();
        $this->info("Purge completed:");
        $this->line("  Success: {$results['success']}");
        $this->line("  Failed: {$results['failed']}");

        if (!empty($results['errors'])) {
            $this->newLine();
            $this->error('Errors encountered:');
            
            foreach ($results['errors'] as $error) {
                $this->line("  - {$error['tenant_name']} ({$error['tenant_id']}): {$error['error']}");
            }
        }

        return $results['failed'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
