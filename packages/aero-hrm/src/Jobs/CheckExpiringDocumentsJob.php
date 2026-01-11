<?php

declare(strict_types=1);

namespace Aero\HRM\Jobs;

use Aero\HRM\Events\DocumentExpiring;
use Aero\HRM\Models\EmployeePersonalDocument;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job that checks for expiring documents and dispatches events.
 *
 * This job should be scheduled to run daily.
 *
 * Documents are checked at these intervals:
 * - 30 days before expiry
 * - 14 days before expiry
 * - 7 days before expiry
 * - 3 days before expiry
 * - 1 day before expiry
 * - On expiry day
 *
 * Usage in Console/Kernel.php or routes/console.php:
 * Schedule::job(new CheckExpiringDocumentsJob)->dailyAt('09:00');
 */
class CheckExpiringDocumentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 600];

    /**
     * Days before expiry to send reminders.
     */
    protected array $reminderDays = [30, 14, 7, 3, 1, 0];

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $today = Carbon::today();
        $documentsNotified = 0;

        foreach ($this->reminderDays as $days) {
            $targetDate = $today->copy()->addDays($days);

            $documents = EmployeePersonalDocument::query()
                ->whereDate('expiry_date', $targetDate)
                ->with(['employee.user'])
                ->get();

            foreach ($documents as $document) {
                if ($document->employee && $document->employee->status === 'active') {
                    DocumentExpiring::dispatch($document, $days);
                    $documentsNotified++;
                }
            }
        }

        Log::info('Document expiry check completed', [
            'date' => $today->toDateString(),
            'documents_notified' => $documentsNotified,
        ]);
    }

    /**
     * Handle a failed job.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('CheckExpiringDocumentsJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
