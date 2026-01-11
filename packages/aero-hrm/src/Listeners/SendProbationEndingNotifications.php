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
        $manager = $employee->manager;

        if ($manager && $manager->user) {
            $manager->user->notify(new ProbationEndingNotification($employee, $daysRemaining));
        }
    }

    /**
     * Notify HR users.
     */
    protected function notifyHr($employee, int $daysRemaining): void
    {
        if (class_exists('Spatie\Permission\Models\Role')) {
            $hrRoleNames = ['hr', 'hr_manager', 'hr-manager', 'human_resources'];
            $hrUsers = \Aero\Core\Models\User::role($hrRoleNames)->get();

            foreach ($hrUsers as $hrUser) {
                if ($hrUser->id !== $employee->user_id) {
                    $hrUser->notify(new ProbationEndingNotification($employee, $daysRemaining));
                }
            }
        }
    }

    /**
     * Handle a failed job.
     */
    public function failed(ProbationEnding $event, \Throwable $exception): void
    {
        Log::error('Failed to send probation ending notifications', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
