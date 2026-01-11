<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\ProbationEnding;
use Aero\HRM\Notifications\ProbationEndingNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that sends probation ending notifications.
 */
class SendProbationEndingNotifications implements ShouldQueue
{
    /**
     * Handle the probation ending event.
     */
    public function handle(ProbationEnding $event): void
    {
        $employee = $event->employee;

        // Notify the employee's manager
        $this->notifyManager($employee, $event->daysRemaining);

        // Notify HR
        $this->notifyHr($employee, $event->daysRemaining);
    }

    /**
     * Notify the employee's manager.
     */
    protected function notifyManager($employee, int $daysRemaining): void
    {
        // manager_id references users.id directly
        if ($employee->manager_id) {
            $manager = \Aero\Core\Models\User::find($employee->manager_id);
            if ($manager) {
                $manager->notify(new ProbationEndingNotification($employee, $daysRemaining));
            }
        }
    }

    /**
     * Notify HR users.
     */
    protected function notifyHr($employee, int $daysRemaining): void
    {
        if (class_exists('Spatie\Permission\Models\Role')) {
            $hrRoleNames = ['HR Admin', 'HR Manager', 'hr', 'hr_manager', 'hr-manager', 'human_resources'];
            $hrUsers = \Aero\Core\Models\User::role($hrRoleNames)->get();

            foreach ($hrUsers as $hrUser) {
                if ($hrUser->id !== $employee->user_id) {
                    $hrUser->notify(new ProbationEndingNotification($employee, $daysRemaining));
                }
            }
        }
    }

    /**     * Notify users who have access to HRM employee management.
     */
    protected function notifyUsersWithEmployeeAccess($employee, int $daysUntilEnd): void
    {
        // Try HRMAC first
        if (app()->bound('Aero\HRMAC\Contracts\RoleModuleAccessInterface')) {
            try {
                $hrmacService = app('Aero\HRMAC\Contracts\RoleModuleAccessInterface');
                $usersWithAccess = $hrmacService->getUsersWithSubModuleAccess('hrm', 'employees', 'view');

                foreach ($usersWithAccess as $user) {
                    $user->notify(new ProbationEndingNotification($employee, $daysUntilEnd));
                }
                
                if ($usersWithAccess->isNotEmpty()) {
                    return;
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to get users with employee access via HRMAC', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback: Find users via role scope if available
        try {
            $userClass = \Aero\Core\Models\User::class;
            if (method_exists($userClass, 'scopeRole')) {
                $hrUsers = $userClass::role(['HR Admin', 'HR Manager', 'hr_admin', 'hr_manager'])->get();
                
                foreach ($hrUsers as $hrUser) {
                    $hrUser->notify(new ProbationEndingNotification($employee, $daysUntilEnd));
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to notify HR users (fallback)', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**     * Handle a failed job.
     */
    public function failed(ProbationEnding $event, \Throwable $exception): void
    {
        Log::error('Failed to send probation ending notifications', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
