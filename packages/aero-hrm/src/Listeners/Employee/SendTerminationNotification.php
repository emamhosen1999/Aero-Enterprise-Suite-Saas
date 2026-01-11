<?php

namespace Aero\HRM\Listeners\Employee;

use Aero\HRM\Events\Employee\EmployeeTerminated;
use Aero\HRM\Notifications\Employee\EmployeeTerminatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Sends termination notification to the employee and relevant parties.
 */
class SendTerminationNotification implements ShouldQueue
{
    public function handle(EmployeeTerminated $event): void
    {
        $employee = $event->employee;
        $user = $employee->user;

        if (! $user) {
            Log::warning('Employee has no associated user for termination notification', [
                'employee_id' => $employee->id,
            ]);

            return;
        }

        // Send notification to the employee
        $user->notify(new EmployeeTerminatedNotification(
            $employee,
            $event->reason,
            $event->immediate,
            [
                'terminated_by' => $event->terminatedBy,
                'last_working_date' => $event->lastWorkingDate?->toIso8601String(),
            ]
        ));

        // Log the notification
        $this->logNotification($user, $employee, 'employee.terminated');

        // Notify HR team
        $this->notifyHRTeam($employee, $event);
    }

    protected function notifyHRTeam($employee, EmployeeTerminated $event): void
    {
        try {
            // Get HR users
            $hrUsers = \Aero\Core\Models\User::query()
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['HR Manager', 'HR Admin', 'Super Admin']);
                })
                ->get();

            foreach ($hrUsers as $hrUser) {
                if ($hrUser->id !== $event->terminatedBy) {
                    $hrUser->notify(new EmployeeTerminatedNotification(
                        $employee,
                        $event->reason,
                        $event->immediate,
                        ['notification_target' => 'hr_team']
                    ));
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify HR team of termination', [
                'employee_id' => $employee->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function logNotification($user, $employee, string $eventType): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => EmployeeTerminatedNotification::class,
                'event_type' => $eventType,
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log termination notification', ['error' => $e->getMessage()]);
        }
    }

    public function failed(EmployeeTerminated $event, \Throwable $exception): void
    {
        Log::error('Failed to send termination notification', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
