<?php

declare(strict_types=1);

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Services\SubscriptionLifecycleService;
use Illuminate\Console\Command;

/**
 * Expire Grace Periods
 *
 * Transitions subscriptions whose grace period has ended into the `expired`
 * status. Run daily via the scheduler so access is revoked promptly after
 * the grace window closes.
 *
 * Scheduled in routes/console.php as:
 *   Schedule::command('subscriptions:expire-grace-periods')->daily();
 */
class ExpireGracePeriods extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'subscriptions:expire-grace-periods
                            {--dry-run : Show what would be processed without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Expire subscriptions whose grace period has ended';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionLifecycleService $lifecycleService): int
    {
        $this->info('Expiring overdue grace periods...');

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN MODE – No changes will be made');

            return self::SUCCESS;
        }

        $count = $lifecycleService->expireGracePeriods();

        $this->info("Expired: {$count} subscription(s)");

        return self::SUCCESS;
    }
}
