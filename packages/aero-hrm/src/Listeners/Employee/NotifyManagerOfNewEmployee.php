<?php

namespace Aero\HRM\Listeners\Employee;

use Aero\Core\Models\User;
use Aero\HRM\Events\Employee\EmployeeCreated;
use Aero\HRM\Notifications\Employee\EmployeeCreatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotifyManagerOfNewEmployee implements ShouldQueue
{
    public function handle(EmployeeCreated $event): void
    {
        $employee = $event->employee;
        
        // Notify direct manager
        if ($employee->manager) {
            $managerUser = $employee->manager->user;
            if ($managerUser) {
                $managerUser->notify(new EmployeeCreatedNotification($employee, [
                    'context' => 'manager',
                    'message' => "{$employee->full_name} has joined your team",
                ]));
                
                $this->logNotification($managerUser, 'manager', $employee);
            }
        }

        // Notify HR team
        $hrUsers = User::role(['HR Manager', 'HR Admin'])->get();
        foreach ($hrUsers as $hrUser) {
            $hrUser->notify(new EmployeeCreatedNotification($employee, [
                'context' => 'hr',
                'message' => "New employee onboarded: {$employee->full_name}",
            ]));
            
            $this->logNotification($hrUser, 'hr', $employee);
        }
    }

    public function failed(EmployeeCreated $event, \Throwable $exception): void
    {
        Log::error('Failed to notify manager/HR of new employee', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, string $context, $employee): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => EmployeeCreatedNotification::class,
                'event_type' => 'employee.created',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'context' => $context,
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
