<?php

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CleanupFailedTenants Command
 *
 * Removes failed tenant records and their orphaned databases after a grace period.
 * Runs daily via scheduler to prevent accumulation of failed provisioning attempts.
 */
class CleanupFailedTenants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:cleanup-failed
                            {--days=7 : Number of days before cleanup}
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up failed tenant provisioning attempts and orphaned databases';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $dryRun = $this->option('dry-run');

        $cutoffDate = now()->subDays($days);

        $this->info("🔍 Searching for failed tenants older than {$days} days (before {$cutoffDate->toDateString()})...");

        // Find failed tenants
        $failedTenants = Tenant::where('status', Tenant::STATUS_FAILED)
            ->where('created_at', '<', $cutoffDate)
            ->get();

        if ($failedTenants->isEmpty()) {
            $this->info('✅ No failed tenants found for cleanup.');

            return self::SUCCESS;
        }

        $this->warn("Found {$failedTenants->count()} failed tenant(s) to clean up:");
        $this->newLine();

        $deleted = 0;
        $errors = 0;

        foreach ($failedTenants as $tenant) {
            $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            $this->info("Tenant: {$tenant->name} (ID: {$tenant->id})");
            $this->line("  Subdomain: {$tenant->subdomain}");
            $this->line("  Email: {$tenant->email}");
            $this->line("  Failed at: {$tenant->created_at->diffForHumans()}");
            $this->line('  Error: '.($tenant->data['provisioning_error'] ?? 'Unknown'));

            if ($dryRun) {
                $this->comment('  [DRY RUN] Would delete this tenant and its database');

                continue;
            }

            try {
                // Step 1: Drop database if it exists
                $databaseName = $tenant->database()->getName();
                if ($databaseName) {
                    $this->line("  → Dropping database: {$databaseName}");
                    DB::statement("DROP DATABASE IF EXISTS `{$databaseName}`");
                    $this->comment('  ✓ Database dropped');
                }

                // Step 2: Delete domains
                $domainCount = $tenant->domains()->count();
                if ($domainCount > 0) {
                    $this->line("  → Deleting {$domainCount} domain(s)");
                    $tenant->domains()->delete();
                    $this->comment('  ✓ Domains deleted');
                }

                // Step 3: Delete tenant record
                $this->line('  → Deleting tenant record');
                $tenant->forceDelete();
                $this->comment('  ✓ Tenant record deleted');

                $this->info("✅ Successfully cleaned up tenant: {$tenant->name}");
                $deleted++;

                Log::info('Cleaned up failed tenant', [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'failed_at' => $tenant->created_at,
                ]);
            } catch (\Throwable $e) {
                $this->error("  ❌ Failed to clean up: {$e->getMessage()}");
                $errors++;

                Log::error('Failed to clean up failed tenant', [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'error' => $e->getMessage(),
                ]);
            }

            $this->newLine();
        }

        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        if ($dryRun) {
            $this->warn("DRY RUN: Would have deleted {$failedTenants->count()} tenant(s)");
        } else {
            $this->info('Summary:');
            $this->line("  ✅ Deleted: {$deleted}");
            if ($errors > 0) {
                $this->line("  ❌ Errors: {$errors}");
            }
        }

        return self::SUCCESS;
    }
}
