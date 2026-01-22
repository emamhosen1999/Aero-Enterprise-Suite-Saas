<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\WorkAnniversary;
use Aero\HRM\Notifications\WorkAnniversaryNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that sends work anniversary notifications.
 */
class SendWorkAnniversaryNotifications implements ShouldQueue
{
    /**
     * Handle the work anniversary event.
     */
    public function handle(WorkAnniversary $event): void
    {
        $employee = $event->employee;
        $user = $employee->user;

        if (! $user) {
            Log::warning('WorkAnniversary event: No user found for employee', [
                'employee_id' => $employee->id,
            ]);

            return;
        }

        // Send anniversary notification to the employee
        $user->notify(new WorkAnniversaryNotification($employee, $event->yearsOfService));

        // Notify their manager
        $this->notifyManager($employee, $event->yearsOfService);

        // Notify HR for milestone anniversaries (5, 10, 15, 20+ years)
        if ($this->isMilestone($event->yearsOfService)) {
            $this->notifyHr($employee, $event->yearsOfService);
        }
    }

    /**
     * Check if this is a milestone anniversary.
     */
    protected function isMilestone(int $years): bool
    {
        $milestones = config('hrm.notifications.anniversary.milestones', [1, 5, 10, 15, 20, 25, 30]);

        return in_array($years, $milestones);
    }

    /**
     * Notify the employee's manager.
     */
    protected function notifyManager($employee, int $years): void
    {
        $manager = $employee->manager;

        if ($manager && $manager->user) {
            $manager->user->notify(new WorkAnniversaryNotification($employee, $years));
        }
    }

    /**
     * Notify users with HRM employees access using HRMAC.
     */
    protected function notifyHr($employee, int $years): void
    {
        try {
            $hrUsers = \Aero\HRMAC\Facades\HRMAC::getUsersWithSubModuleAccess('hrm', 'employees');

            foreach ($hrUsers as $hrUser) {
                if ($hrUser->id !== $employee->user_id) {
                    $hrUser->notify(new WorkAnniversaryNotification($employee, $years));
                }
            }
        } catch (\Exception $e) {
            Log::warning('HRMAC not available for work anniversary notification', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a failed job.
     */
    public function failed(WorkAnniversary $event, \Throwable $exception): void
    {
        Log::error('Failed to send work anniversary notifications', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
