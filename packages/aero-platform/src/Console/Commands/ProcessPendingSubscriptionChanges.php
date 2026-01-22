<?php

declare(strict_types=1);

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Services\SubscriptionLifecycleService;
use Illuminate\Console\Command;

/**
 * Process Pending Subscription Changes
 *
 * Processes scheduled downgrades and cancellations.
 * Run this command daily via cron/scheduler.
 */
class ProcessPendingSubscriptionChanges extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'subscriptions:process-pending
                            {--dry-run : Show what would be processed without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Process pending subscription downgrades and cancellations';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionLifecycleService $lifecycleService): int
    {
        $this->info('Processing pending subscription changes...');

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        $processed = 0;

        if (! $this->option('dry-run')) {
            $processed = $lifecycleService->processPendingDowngrades();
        }

        $this->info("Processed {$processed} pending subscription changes");

        return self::SUCCESS;
    }
}
