<?php

namespace Aero\Platform\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupLogs extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'logs:cleanup 
                            {--days=30 : Number of days to keep logs}
                            {--type=all : Type of logs to clean (all, audit, performance, errors)}
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     */
    protected $description = 'Clean up old log entries from audit_logs, performance_metrics, and error_logs tables';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $type = $this->option('type');
        $dryRun = $this->option('dry-run');

        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("Cleaning up logs older than {$days} days (before {$cutoffDate->toDateString()})");

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No data will be deleted');
        }

        $totalDeleted = 0;

        // Clean audit logs
        if ($type === 'all' || $type === 'audit') {
            $count = $this->cleanTable('audit_logs', $cutoffDate, $dryRun);
            $totalDeleted += $count;
            $this->line("Audit logs: {$count} records ".($dryRun ? 'would be deleted' : 'deleted'));
        }

        // Clean performance metrics
        if ($type === 'all' || $type === 'performance') {
            $count = $this->cleanTable('performance_metrics', $cutoffDate, $dryRun);
            $totalDeleted += $count;
            $this->line("Performance metrics: {$count} records ".($dryRun ? 'would be deleted' : 'deleted'));
        }

        // Clean error logs (keep resolved errors for 7 days, unresolved for 90 days)
        if ($type === 'all' || $type === 'errors') {
            $resolvedCutoff = Carbon::now()->subDays(7);
            $unresolvedCutoff = Carbon::now()->subDays(90);

            if ($dryRun) {
                $resolvedCount = DB::table('error_logs')
                    ->where('resolved', true)
                    ->where('created_at', '<', $resolvedCutoff)
                    ->count();

                $unresolvedCount = DB::table('error_logs')
                    ->where('resolved', false)
                    ->where('created_at', '<', $unresolvedCutoff)
                    ->count();

                $count = $resolvedCount + $unresolvedCount;
            } else {
                $resolvedCount = DB::table('error_logs')
                    ->where('resolved', true)
                    ->where('created_at', '<', $resolvedCutoff)
                    ->delete();

                $unresolvedCount = DB::table('error_logs')
                    ->where('resolved', false)
                    ->where('created_at', '<', $unresolvedCutoff)
                    ->delete();

                $count = $resolvedCount + $unresolvedCount;
            }

            $totalDeleted += $count;
            $this->line("Error logs: {$count} records ".($dryRun ? 'would be deleted' : 'deleted'));
            $this->line("  - Resolved errors older than 7 days: {$resolvedCount}");
            $this->line("  - Unresolved errors older than 90 days: {$unresolvedCount}");
        }

        if (! $dryRun && $totalDeleted > 0) {
            // Optimize tables after cleanup
            $this->info('Optimizing tables...');
            DB::statement('OPTIMIZE TABLE audit_logs, performance_metrics, error_logs');
            $this->info('Table optimization completed.');
        }

        $this->info("Total: {$totalDeleted} records ".($dryRun ? 'would be deleted' : 'deleted'));

        if ($dryRun) {
            $this->warn('To actually delete the records, run the command without --dry-run');
        }
    }

    private function cleanTable(string $table, Carbon $cutoffDate, bool $dryRun): int
    {
        if ($dryRun) {
            return DB::table($table)
                ->where('created_at', '<', $cutoffDate)
                ->count();
        }

        return DB::table($table)
            ->where('created_at', '<', $cutoffDate)
            ->delete();
    }
}
