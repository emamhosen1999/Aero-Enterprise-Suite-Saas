<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners\Leave;

use Aero\HRM\Events\Leave\LeaveApproved;
use Aero\HRM\Notifications\LeaveApprovedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that notifies an employee when their leave request is approved.
 */
class NotifyEmployeeOfLeaveApproval implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(LeaveApproved $event): void
    {
        $leave = $event->leave;
        $user = $leave->user;

        // Skip if no user found
        if (! $user) {
            return;
        }

        // Notify the employee about the approval
        $user->notify(new LeaveApprovedNotification($leave));
    }

    /**
     * Handle a job failure.
     */
    public function failed(LeaveApproved $event, \Throwable $exception): void
    {
        Log::error('Failed to notify employee of leave approval', [
            'leave_id' => $event->leave->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
