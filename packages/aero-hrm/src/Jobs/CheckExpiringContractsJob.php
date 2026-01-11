<?php

declare(strict_types=1);

namespace Aero\HRM\Jobs;

use Aero\HRM\Events\ContractExpiring;
use Aero\HRM\Models\Employee;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job that checks for expiring contracts and dispatches events.
 *
 * This job should be scheduled to run daily.
 *
 * Reminders are sent at:
 * - 30 days before contract ends
 * - 14 days before contract ends
 * - 7 days before contract ends
 * - 3 days before contract ends
 * - 1 day before contract ends
 * - On contract end day
 *
 * Usage in Console/Kernel.php or routes/console.php:
 * Schedule::job(new CheckExpiringContractsJob)->dailyAt('09:00');
 */
class CheckExpiringContractsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 600];

    /**
     * Days before contract ends to send reminders.
     */
    protected array $reminderDays = [30, 14, 7, 3, 1, 0];

    /**
     * Employment types that are considered contract-based.
     */
    protected array $contractTypes = ['contract', 'temporary', 'fixed-term', 'probation'];

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $today = Carbon::today();
        $employeesNotified = 0;

        foreach ($this->reminderDays as $days) {
            $targetDate = $today->copy()->addDays($days);

            // Check for contract end dates
            $employees = Employee::query()
                ->where(function ($query) use ($targetDate) {
                    // Check date_of_leaving for contract employees
                    $query->whereDate('date_of_leaving', $targetDate)
                        ->orWhereDate('contract_end_date', $targetDate);
                })
                ->whereIn('employment_type', $this->contractTypes)
                ->where('status', 'active')
                ->with(['user', 'department', 'designation', 'manager.user'])
                ->get();

            foreach ($employees as $employee) {
                ContractExpiring::dispatch($employee, $days);
                $employeesNotified++;
            }
        }

        Log::info('Contract expiry check completed', [
            'date' => $today->toDateString(),
            'employees_notified' => $employeesNotified,
        ]);
    }

    /**
     * Handle a failed job.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('CheckExpiringContractsJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
