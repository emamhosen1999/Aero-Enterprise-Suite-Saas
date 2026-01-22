<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\EmployeeBirthday;
use Aero\HRM\Notifications\BirthdayWishNotification;
use Aero\HRM\Notifications\TeamBirthdayAlertNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that sends birthday notifications.
 *
 * Sends:
 * - Birthday wish to the employee
 * - Birthday alert to their manager and team
 */
class SendBirthdayNotifications implements ShouldQueue
{
    /**
     * Handle the employee birthday event.
     */
    public function handle(EmployeeBirthday $event): void
    {
        $employee = $event->employee;
        $user = $employee->user;

        if (! $user) {
            Log::warning('EmployeeBirthday event: No user found for employee', [
                'employee_id' => $employee->id,
            ]);

            return;
        }

        // Send birthday wish to the employee
        $user->notify(new BirthdayWishNotification($employee, $event->age));

        // Notify their manager
        $this->notifyManager($employee, $event->age);

        // Optionally notify team members (configurable)
        if (config('hrm.notifications.birthday.notify_team', false)) {
            $this->notifyTeamMembers($employee, $event->age);
        }

        // Notify HR
        if (config('hrm.notifications.birthday.notify_hr', true)) {
            $this->notifyHr($employee, $event->age);
        }
    }

    /**
     * Notify the employee's manager.
     */
    protected function notifyManager($employee, int $age): void
    {
        // manager relationship returns User model directly (manager_id -> users.id)
        $manager = $employee->manager;

        if ($manager) {
            $manager->notify(new TeamBirthdayAlertNotification($employee, $age));
        }
    }

    /**
     * Notify team members in the same department.
     */
    protected function notifyTeamMembers($employee, int $age): void
    {
        if (! $employee->department_id) {
            return;
        }

        $teamMembers = $employee->department
            ->employees()
            ->where('id', '!=', $employee->id)
            ->with('user')
            ->get();

        foreach ($teamMembers as $teamMember) {
            if ($teamMember->user) {
                $teamMember->user->notify(new TeamBirthdayAlertNotification($employee, $age));
            }
        }
    }

    /**
     * Notify users with HRM employees access using HRMAC.
     */
    protected function notifyHr($employee, int $age): void
    {
        try {
            $hrUsers = \Aero\HRMAC\Facades\HRMAC::getUsersWithSubModuleAccess('hrm', 'employees');

            foreach ($hrUsers as $hrUser) {
                if ($hrUser->id !== $employee->user_id) {
                    $hrUser->notify(new TeamBirthdayAlertNotification($employee, $age));
                }
            }
        } catch (\Exception $e) {
            Log::warning('HRMAC not available for birthday notification', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a failed job.
     */
    public function failed(EmployeeBirthday $event, \Throwable $exception): void
    {
        Log::error('Failed to send birthday notifications', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
