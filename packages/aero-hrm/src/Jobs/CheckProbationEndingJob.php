<?php

declare(strict_types=1);

namespace Aero\HRM\Jobs;

use Aero\HRM\Events\ProbationEnding;
use Aero\HRM\Models\Employee;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job that checks for ending probation periods and dispatches events.
 *
 * This job should be scheduled to run daily.
 *
 * Reminders are sent at:
 * - 14 days before probation ends
 * - 7 days before probation ends
 * - 3 days before probation ends
 * - 1 day before probation ends
 * - On probation end day
 *
 * Usage in Console/Kernel.php or routes/console.php:
 * Schedule::job(new CheckProbationEndingJob)->dailyAt('09:00');
 */
class CheckProbationEndingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 600];

    /**
     * Days before probation ends to send reminders.
     */
    protected array $reminderDays = [14, 7, 3, 1, 0];

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $today = Carbon::today();
        $employeesNotified = 0;

        foreach ($this->reminderDays as $days) {
            $targetDate = $today->copy()->addDays($days);

            $employees = Employee::query()
                ->whereDate('probation_end_date', $targetDate)
                ->whereNull('confirmation_date') // Not yet confirmed
                ->where('status', 'active')
                ->with(['user', 'department', 'designation', 'manager.user'])
                ->get();

            foreach ($employees as $employee) {
                ProbationEnding::dispatch($employee, $days);
                $employeesNotified++;
            }
        }

        Log::info('Probation ending check completed', [
            'date' => $today->toDateString(),
            'employees_notified' => $employeesNotified,
        ]);
    }

    /**
     * Handle a failed job.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('CheckProbationEndingJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
