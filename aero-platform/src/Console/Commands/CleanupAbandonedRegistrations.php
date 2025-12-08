<?php

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupAbandonedRegistrations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'registrations:cleanup 
                            {--hours=24 : Hours of inactivity before cleanup}
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up abandoned pending tenant registrations that have been inactive';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $dryRun = $this->option('dry-run');

        $cutoffDate = now()->subHours($hours);

        // Find pending tenants that haven't been updated in X hours
        // and have no domains (not yet provisioned)
        $abandonedTenants = Tenant::query()
            ->where('status', Tenant::STATUS_PENDING)
            ->where('updated_at', '<', $cutoffDate)
            ->whereDoesntHave('domains')
            ->get();

        if ($abandonedTenants->isEmpty()) {
            $this->info('No abandoned registrations found.');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Found %d abandoned registration(s) older than %d hours.',
            $abandonedTenants->count(),
            $hours
        ));

        if ($dryRun) {
            $this->warn('DRY RUN - No records will be deleted.');
            $this->table(
                ['ID', 'Subdomain', 'Email', 'Created', 'Last Updated'],
                $abandonedTenants->map(fn ($t) => [
                    $t->id,
                    $t->subdomain,
                    $t->email,
                    $t->created_at->diffForHumans(),
                    $t->updated_at->diffForHumans(),
                ])
            );

            return self::SUCCESS;
        }

        $deleted = 0;
        foreach ($abandonedTenants as $tenant) {
            try {
                $this->line("Deleting abandoned tenant: {$tenant->subdomain} ({$tenant->email})");

                $tenant->delete();
                $deleted++;

                Log::info('Cleaned up abandoned registration', [
                    'tenant_id' => $tenant->id,
                    'subdomain' => $tenant->subdomain,
                    'email' => $tenant->email,
                    'created_at' => $tenant->created_at,
                    'updated_at' => $tenant->updated_at,
                ]);
            } catch (\Throwable $e) {
                $this->error("Failed to delete tenant {$tenant->id}: {$e->getMessage()}");
                Log::error('Failed to cleanup abandoned registration', [
                    'tenant_id' => $tenant->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Successfully cleaned up {$deleted} abandoned registration(s).");

        return self::SUCCESS;
    }
}
