<?php

namespace Aero\HRM\Listeners\Offboarding;

use Aero\HRM\Events\Offboarding\OffboardingStarted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Schedules exit interview when offboarding starts.
 */
class ScheduleExitInterview implements ShouldQueue
{
    public function handle(OffboardingStarted $event): void
    {
        $offboarding = $event->offboarding;
        $employee = $offboarding->employee;

        if (! $employee) {
            Log::warning('Offboarding has no associated employee for exit interview', [
                'offboarding_id' => $offboarding->id,
            ]);

            return;
        }

        // Don't schedule exit interview for immediate terminations
        if ($event->reason === 'termination' && $offboarding->is_urgent) {
            Log::info('Skipping exit interview for immediate termination', [
                'offboarding_id' => $offboarding->id,
            ]);

            return;
        }

        try {
            // Calculate interview date (typically a few days before last working date)
            $interviewDate = $this->calculateInterviewDate($offboarding);

            // Create exit interview record
            $this->createExitInterview($offboarding, $employee, $interviewDate);

            // Notify HR to conduct interview
            $this->notifyHRForInterview($offboarding, $employee, $interviewDate);

            Log::info('Exit interview scheduled', [
                'offboarding_id' => $offboarding->id,
                'employee_id' => $employee->id,
                'interview_date' => $interviewDate->toDateString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to schedule exit interview', [
                'offboarding_id' => $offboarding->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function calculateInterviewDate($offboarding): \Carbon\Carbon
    {
        $lastWorkingDate = $offboarding->last_working_date ?? now()->addDays(30);

        if ($lastWorkingDate instanceof \Carbon\Carbon) {
            $carbonDate = $lastWorkingDate;
        } else {
            $carbonDate = \Carbon\Carbon::parse($lastWorkingDate);
        }

        // Schedule interview 2-3 days before last working date
        $daysUntilLeaving = now()->diffInDays($carbonDate);

        if ($daysUntilLeaving <= 3) {
            // Not enough time, schedule for next business day
            return now()->addWeekday();
        }

        // Schedule 2 days before last working date
        return $carbonDate->copy()->subDays(2)->startOfDay()->setHour(10);
    }

    protected function createExitInterview($offboarding, $employee, $interviewDate): void
    {
        try {
            \Illuminate\Support\Facades\DB::table('exit_interviews')->insert([
                'offboarding_id' => $offboarding->id,
                'employee_id' => $employee->id,
                'scheduled_date' => $interviewDate,
                'status' => 'scheduled',
                'notes' => "Exit interview for {$employee->full_name} - Reason: {$offboarding->reason}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Table might not exist, update offboarding record instead
            $offboarding->update([
                'exit_interview_scheduled_at' => $interviewDate,
                'exit_interview_status' => 'scheduled',
            ]);
        }
    }

    protected function notifyHRForInterview($offboarding, $employee, $interviewDate): void
    {
        try {
            $hrUsers = \Aero\Core\Models\User::query()
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['HR Manager', 'HR Admin']);
                })
                ->get();

            foreach ($hrUsers as $hrUser) {
                $hrUser->notify(new \Aero\HRM\Notifications\Offboarding\OffboardingStartedNotification(
                    $offboarding,
                    [
                        'notification_target' => 'hr_exit_interview',
                        'interview_date' => $interviewDate->toIso8601String(),
                        'employee_name' => $employee->full_name,
                    ]
                ));
            }
        } catch (\Exception $e) {
            Log::warning('Could not notify HR for exit interview', ['error' => $e->getMessage()]);
        }
    }

    public function failed(OffboardingStarted $event, \Throwable $exception): void
    {
        Log::error('Failed to schedule exit interview', [
            'offboarding_id' => $event->offboarding->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
