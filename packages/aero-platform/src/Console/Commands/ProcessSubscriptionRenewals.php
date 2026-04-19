<?php

declare(strict_types=1);

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Services\SubscriptionLifecycleService;
use Illuminate\Console\Command;

/**
 * Process Subscription Renewals
 *
 * Advances the billing period for active/trialing subscriptions whose
 * `ends_at` has passed. Subscriptions that have been cancelled are expired
 * instead of renewed.
 *
 * Run daily via the scheduler (registered in AeroPlatformServiceProvider).
 */
class ProcessSubscriptionRenewals extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'subscriptions:process-renewals
                            {--dry-run : Show what would be processed without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Process subscription renewals for billing periods that have ended';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionLifecycleService $lifecycleService): int
    {
        $this->info('Processing subscription renewals...');

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN MODE – No changes will be made');

            return self::SUCCESS;
        }

        $counts = $lifecycleService->processRenewals();

        $this->info("Renewed : {$counts['renewed']}");
        $this->info("Expired : {$counts['expired']}");

        if ($counts['skipped'] > 0) {
            $this->warn("Skipped : {$counts['skipped']} (check logs for details)");
        }

        return self::SUCCESS;
    }
}
