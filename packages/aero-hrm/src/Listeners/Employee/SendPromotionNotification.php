<?php

namespace Aero\HRM\Listeners\Employee;

use Aero\HRM\Events\Employee\EmployeePromoted;
use Aero\HRM\Notifications\Employee\EmployeePromotedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendPromotionNotification implements ShouldQueue
{
    public function handle(EmployeePromoted $event): void
    {
        $employee = $event->employee;
        $user = $employee->user;

        if (!$user) {
            Log::warning('Employee has no associated user for promotion notification', [
                'employee_id' => $employee->id,
            ]);
            return;
        }

        // Send promotion notification
        $user->notify(new EmployeePromotedNotification(
            employee: $employee,
            oldDesignationId: $event->oldDesignationId,
            newDesignationId: $event->newDesignationId,
            oldDepartmentId: $event->oldDepartmentId,
            newDepartmentId: $event->newDepartmentId,
            oldSalary: $event->oldSalary,
            newSalary: $event->newSalary,
            reason: $event->reason
        ));

        // Log notification
        $this->logNotification($user, $employee, $event);
    }

    public function failed(EmployeePromoted $event, \Throwable $exception): void
    {
        Log::error('Failed to send promotion notification', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $employee, EmployeePromoted $event): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => EmployeePromotedNotification::class,
                'event_type' => 'employee.promoted',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'old_designation_id' => $event->oldDesignationId,
                    'new_designation_id' => $event->newDesignationId,
                    'salary_increase' => $event->newSalary - $event->oldSalary,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log promotion notification', ['error' => $e->getMessage()]);
        }
    }
}
