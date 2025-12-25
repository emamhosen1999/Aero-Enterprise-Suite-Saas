<?php

namespace Aero\Platform\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Aero\Platform\Models\ScheduledReport;
use Aero\Platform\Services\ReportScheduler;
use Illuminate\Support\Facades\Log;
use Exception;

class GenerateScheduledReportsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes timeout for report generation
    public $tries = 3;

    /**
     * Execute the job.
     */
    public function handle(ReportScheduler $reportScheduler): void
    {
        Log::info('Starting scheduled report generation job');

        try {
            // Get all reports that are due for execution
            $dueReports = ScheduledReport::dueNow()->get();

            Log::info('Found ' . $dueReports->count() . ' reports due for execution');

            foreach ($dueReports as $report) {
                try {
                    Log::info('Executing report', [
                        'report_id' => $report->id,
                        'report_name' => $report->name,
                        'report_type' => $report->report_type,
                    ]);

                    // Execute the report
                    $execution = $reportScheduler->executeScheduledReport($report);

                    Log::info('Report executed successfully', [
                        'report_id' => $report->id,
                        'execution_id' => $execution->id,
                        'status' => $execution->status,
                    ]);

                } catch (Exception $e) {
                    Log::error('Failed to execute scheduled report', [
                        'report_id' => $report->id,
                        'report_name' => $report->name,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);

                    // Continue with other reports even if one fails
                    continue;
                }
            }

            // Clean up old report files (older than retention period)
            $this->cleanupOldReports();

            Log::info('Scheduled report generation job completed');

        } catch (Exception $e) {
            Log::error('Scheduled report generation job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Clean up old report execution files.
     */
    protected function cleanupOldReports(): void
    {
        try {
            $retentionDays = config('reports.retention_days', 30);
            $cutoffDate = now()->subDays($retentionDays);

            // Get old executions
            $oldExecutions = \Aero\Platform\Models\ReportExecution::where('created_at', '<', $cutoffDate)
                ->whereNotNull('file_path')
                ->get();

            $deletedCount = 0;

            foreach ($oldExecutions as $execution) {
                if ($execution->file_path && file_exists($execution->file_path)) {
                    @unlink($execution->file_path);
                    $deletedCount++;
                }

                // Clear the file path from database
                $execution->update(['file_path' => null, 'file_size_kb' => null]);
            }

            if ($deletedCount > 0) {
                Log::info('Cleaned up old report files', [
                    'files_deleted' => $deletedCount,
                    'retention_days' => $retentionDays,
                ]);
            }

        } catch (Exception $e) {
            Log::error('Failed to cleanup old report files', [
                'error' => $e->getMessage(),
            ]);
            // Don't throw - cleanup failure shouldn't fail the job
        }
    }

    /**
     * Handle job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error('GenerateScheduledReportsJob failed permanently', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // In production, could send admin notification here
    }
}
