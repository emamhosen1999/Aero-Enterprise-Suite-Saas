<?php

declare(strict_types=1);

namespace Aero\HRM\Jobs;

use Aero\HRM\Events\EmployeeBirthday;
use Aero\HRM\Models\Employee;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job that checks for employee birthdays and dispatches events.
 *
 * This job should be scheduled to run daily.
 *
 * Usage in Console/Kernel.php or routes/console.php:
 * Schedule::job(new CheckBirthdaysJob)->dailyAt('08:00');
 */
class CheckBirthdaysJob implements ShouldQueue
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

        // Find employees with birthday today
        $employees = Employee::query()
            ->whereNotNull('birthday')
            ->whereMonth('birthday', $today->month)
            ->whereDay('birthday', $today->day)
            ->where('status', 'active')
            ->with(['user', 'department', 'manager.user'])
            ->get();

        Log::info('Birthday check completed', [
            'date' => $today->toDateString(),
            'birthday_count' => $employees->count(),
        ]);

        foreach ($employees as $employee) {
            $age = $this->calculateAge($employee->birthday);

            // Dispatch birthday event
            EmployeeBirthday::dispatch($employee, $age);
        }
    }

    /**
     * Calculate age from birthday.
     */
    protected function calculateAge(Carbon $birthday): int
    {
        return $birthday->age;
    }

    /**
     * Handle a failed job.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('CheckBirthdaysJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
