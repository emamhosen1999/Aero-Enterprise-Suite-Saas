<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners\Leave;

use Aero\HRM\Events\Leave\LeaveCancelled;
use Aero\HRM\Notifications\LeaveCancelledNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that sends notifications when a leave is cancelled.
 *
 * Notifies:
 * - The employee's manager (if the employee cancelled)
 * - The employee (if manager/HR cancelled)
 */
class NotifyOnLeaveCancellation implements ShouldQueue
{
    /**
     * Handle the leave cancelled event.
     */
    public function handle(LeaveCancelled $event): void
    {
        $leave = $event->leave;
        $employee = $leave->user;

        if (! $employee) {
            Log::warning('LeaveCancelled event: No employee found for leave', [
                'leave_id' => $leave->id,
            ]);

            return;
        }

        // Determine who cancelled the leave
        $cancelledBy = auth()->user();
        $cancelledByName = $cancelledBy?->name ?? 'System';

        // Notify the manager if the employee cancelled
        $manager = $this->getManager($employee);
        if ($manager && $manager->id !== $cancelledBy?->id) {
            $manager->notify(new LeaveCancelledNotification($leave, $cancelledByName));
        }

        // Notify the employee if someone else cancelled (manager/HR)
        if ($cancelledBy && $cancelledBy->id !== $employee->id) {
            $employee->notify(new LeaveCancelledNotification($leave, $cancelledByName));
        }

        // Notify HR roles
        $this->notifyHrRoles($leave, $cancelledByName);
    }

    /**
     * Get the employee's manager.
     */
    protected function getManager(object $employee): ?object
    {
        // Check if employee has an employee record with manager
        if (method_exists($employee, 'employee') && $employee->employee) {
            $employeeRecord = $employee->employee;
            if ($employeeRecord->manager_id) {
                return $employeeRecord->manager;
            }
        }

        // Check for direct manager relationship
        if (method_exists($employee, 'manager')) {
            return $employee->manager;
        }

        // Check for reporting_to relationship
        if (method_exists($employee, 'reportingTo')) {
            return $employee->reportingTo;
        }

        return null;
    }

    /**
     * Notify users with HR roles.
     */
    protected function notifyHrRoles($leave, string $cancelledByName): void
    {
        // Get users with HR roles - this uses a common pattern without core dependency
        $hrRoleNames = ['hr', 'hr_manager', 'hr-manager', 'human_resources'];

        // Check if Role model exists (avoid hard dependency)
        if (class_exists('Spatie\Permission\Models\Role')) {
            $hrUsers = \Aero\Core\Models\User::role($hrRoleNames)->get();

            foreach ($hrUsers as $hrUser) {
                // Don't notify if they're the one who cancelled
                if (auth()->id() !== $hrUser->id && $leave->user_id !== $hrUser->id) {
                    $hrUser->notify(new LeaveCancelledNotification($leave, $cancelledByName));
                }
            }
        }
    }

    /**
     * Handle a failed job.
     */
    public function failed(LeaveCancelled $event, \Throwable $exception): void
    {
        Log::error('Failed to send leave cancellation notifications', [
            'leave_id' => $event->leave->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
