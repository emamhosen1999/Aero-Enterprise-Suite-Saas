<?php

namespace Aero\Platform\Listeners;

use Aero\Platform\Events\EmployeeCreated;
use Aero\Platform\Notifications\WelcomeEmployeeNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendWelcomeEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(EmployeeCreated $event): void
    {
        $employee = $event->employee;

        // Send welcome notification to employee
        if ($employee->email) {
            $employee->notify(new WelcomeEmployeeNotification($employee));

            // Log the welcome notification sent
            activity()
                ->performedOn($employee)
                ->causedBy($employee)
                ->log('Welcome notification sent to new employee');
        }

        // Notify HR team about new employee
        $hrUsers = \App\Models\User::role(['HR Manager', 'HR Admin'])->get();
        Notification::send($hrUsers, new WelcomeEmployeeNotification($employee));
    }

    /**
     * Handle a job failure.
     */
    public function failed(EmployeeCreated $event, \Throwable $exception): void
    {
        // Log the failure
        Log::error('Failed to send welcome email', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
