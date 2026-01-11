<?php

namespace Aero\HRM\Listeners\Employee;

use Aero\HRM\Events\Employee\EmployeeCreated;
use Aero\HRM\Notifications\Employee\EmployeeCreatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendEmployeeWelcomeNotification implements ShouldQueue
{
    public function handle(EmployeeCreated $event): void
    {
        $employee = $event->employee;
        $user = $employee->user;

        if (!$user) {
            Log::warning('Employee has no associated user', ['employee_id' => $employee->id]);
            return;
        }

        // Send notification to the employee
        $user->notify(new EmployeeCreatedNotification($employee, $event->metadata));

        // Log the notification
        $this->logNotification($user, $employee, 'employee.created');
    }

    public function failed(EmployeeCreated $event, \Throwable $exception): void
    {
        Log::error('Failed to send employee welcome notification', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }

    protected function logNotification($user, $employee, string $eventType): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => EmployeeCreatedNotification::class,
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
            Log::error('Failed to log notification', ['error' => $e->getMessage()]);
        }
    }
}
