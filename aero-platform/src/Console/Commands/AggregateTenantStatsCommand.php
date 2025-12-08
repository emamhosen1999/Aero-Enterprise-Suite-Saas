<?php

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Jobs\AggregateTenantStats;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Artisan command to trigger tenant stats aggregation.
 *
 * Usage:
 *   php artisan stats:aggregate              # Aggregate today's stats
 *   php artisan stats:aggregate --date=2025-12-01  # Specific date
 *   php artisan stats:aggregate --sync       # Run synchronously (not queued)
 */
class AggregateTenantStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'stats:aggregate
                            {--date= : The date to aggregate stats for (YYYY-MM-DD format)}
                            {--sync : Run the job synchronously instead of queuing}';

    /**
     * The console command description.
     */
    protected $description = 'Aggregate statistics from all tenant databases into the platform stats tables';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dateString = $this->option('date');
        $sync = $this->option('sync');

        // Parse the date
        $date = $dateString
            ? Carbon::parse($dateString)
            : Carbon::today();

        $this->info("Aggregating tenant stats for: {$date->toDateString()}");

        try {
            $job = new AggregateTenantStats($date);

            if ($sync) {
                $this->info('Running synchronously...');
                $job->handle();
                $this->info('Stats aggregation completed successfully.');
            } else {
                AggregateTenantStats::dispatch($date);
                $this->info('Stats aggregation job dispatched to queue.');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed to aggregate stats: {$e->getMessage()}");

            return Command::FAILURE;
        }
    }
}
