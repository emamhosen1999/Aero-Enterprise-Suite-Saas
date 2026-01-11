<?php

declare(strict_types=1);

namespace Aero\HRM\Jobs;

use Aero\HRM\Events\WorkAnniversary;
use Aero\HRM\Models\Employee;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job that checks for work anniversaries and dispatches events.
 *
 * This job should be scheduled to run daily.
 *
 * Usage in Console/Kernel.php or routes/console.php:
 * Schedule::job(new CheckWorkAnniversariesJob)->dailyAt('08:00');
 */
class CheckWorkAnniversariesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 600];

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $today = Carbon::today();

        // Find employees with work anniversary today
        $employees = Employee::query()
            ->whereNotNull('date_of_joining')
            ->whereMonth('date_of_joining', $today->month)
            ->whereDay('date_of_joining', $today->day)
            ->whereYear('date_of_joining', '<', $today->year) // Must be at least 1 year
            ->where('status', 'active')
            ->with(['user', 'department', 'manager.user'])
            ->get();

        Log::info('Work anniversary check completed', [
            'date' => $today->toDateString(),
            'anniversary_count' => $employees->count(),
        ]);

        foreach ($employees as $employee) {
            $yearsOfService = $this->calculateYearsOfService($employee->date_of_joining);

            if ($yearsOfService > 0) {
                // Dispatch work anniversary event
                WorkAnniversary::dispatch($employee, $yearsOfService);
            }
        }
    }

    /**
     * Calculate years of service.
     */
    protected function calculateYearsOfService(Carbon $dateOfJoining): int
    {
        return $dateOfJoining->diffInYears(Carbon::today());
    }

    /**
     * Handle a failed job.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('CheckWorkAnniversariesJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
