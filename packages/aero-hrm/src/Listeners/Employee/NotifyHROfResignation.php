<?php

namespace Aero\HRM\Listeners\Employee;

use Aero\Core\Models\User;
use Aero\HRM\Events\Employee\EmployeeResigned;
use Aero\HRM\Notifications\Employee\EmployeeResignedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotifyHROfResignation implements ShouldQueue
{
    public function handle(EmployeeResigned $event): void
    {
        $employee = $event->employee;

        // Notify HR team
        $hrUsers = User::role(['HR Manager', 'HR Admin'])->get();
        
        foreach ($hrUsers as $hrUser) {
            $hrUser->notify(new EmployeeResignedNotification(
                employee: $employee,
                resignationDate: $event->resignationDate,
                lastWorkingDate: $event->lastWorkingDate,
                reason: $event->reason,
                noticePeriodDays: $event->noticePeriodDays
            ));

            $this->logNotification($hrUser, $employee, $event);
        }

        // Notify manager
        if ($employee->manager && $employee->manager->user) {
            $managerUser = $employee->manager->user;
            $managerUser->notify(new EmployeeResignedNotification(
                employee: $employee,
                resignationDate: $event->resignationDate,
                lastWorkingDate: $event->lastWorkingDate,
                reason: $event->reason,
                noticePeriodDays: $event->noticePeriodDays
            ));

            $this->logNotification($managerUser, $employee, $event, 'manager');
        }
    }

    public function failed(EmployeeResigned $event, \Throwable $exception): void
    {
        Log::error('Failed to notify HR of resignation', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $employee, EmployeeResigned $event, string $context = 'hr'): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => EmployeeResignedNotification::class,
                'event_type' => 'employee.resigned',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'context' => $context,
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'resignation_date' => $event->resignationDate->toDateString(),
                    'last_working_date' => $event->lastWorkingDate->toDateString(),
                    'notice_period_days' => $event->noticePeriodDays,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log resignation notification', ['error' => $e->getMessage()]);
        }
    }
}
