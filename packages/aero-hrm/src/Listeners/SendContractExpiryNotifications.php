<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\ContractExpiring;
use Aero\HRM\Notifications\ContractExpiryNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that sends contract expiry notifications.
 */
class SendContractExpiryNotifications implements ShouldQueue
{
    /**
     * Handle the contract expiring event.
     */
    public function handle(ContractExpiring $event): void
    {
        $employee = $event->employee;
        $user = $employee->user;

        // Notify the employee
        if ($user) {
            $user->notify(new ContractExpiryNotification($employee, $event->daysRemaining));
        }

        // Notify the manager
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
            $manager->user->notify(new ContractExpiryNotification($employee, $daysRemaining));
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
                    $hrUser->notify(new ContractExpiryNotification($employee, $daysRemaining));
                }
            }
        }
    }

    /**
     * Handle a failed job.
     */
    public function failed(ContractExpiring $event, \Throwable $exception): void
    {
        Log::error('Failed to send contract expiry notifications', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
