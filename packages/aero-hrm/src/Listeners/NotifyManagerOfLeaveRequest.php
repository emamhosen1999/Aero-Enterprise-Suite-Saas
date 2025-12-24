<?php

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\LeaveRequested;
use App\Notifications\LeaveRequestNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class NotifyManagerOfLeaveRequest implements ShouldQueue
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
    public function handle(LeaveRequested $event): void
    {
        $leave = $event->leave;
        $employee = $leave->user;

        // Find the employee's manager
        $manager = $employee->manager;

        if ($manager) {
            // Notify manager about leave request
            $manager->notify(new LeaveRequestNotification($leave));

            // Log the notification
            activity()
                ->performedOn($leave)
                ->causedBy($employee)
                ->log("Leave request notification sent to manager {$manager->name}");
        }

        // Also notify HR team for transparency
        $hrUsers = \Aero\Core\Models\User::role(['HR Manager', 'HR Admin'])->get();
        foreach ($hrUsers as $hrUser) {
            $hrUser->notify(new LeaveRequestNotification($leave));
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(LeaveRequested $event, \Throwable $exception): void
    {
        Log::error('Failed to notify manager of leave request', [
            'leave_id' => $event->leave->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
