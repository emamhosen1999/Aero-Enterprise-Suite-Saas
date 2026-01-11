<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners\Leave;

use Aero\HRM\Events\Leave\LeaveRejected;
use Aero\HRM\Notifications\LeaveRejectedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that notifies an employee when their leave request is rejected.
 */
class NotifyEmployeeOfLeaveRejection implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(LeaveRejected $event): void
    {
        $leave = $event->leave;
        $user = $leave->user;

        // Skip if no user found
        if (! $user) {
            return;
        }

        // Notify the employee about the rejection
        $user->notify(new LeaveRejectedNotification($leave));
    }

    /**
     * Handle a job failure.
     */
    public function failed(LeaveRejected $event, \Throwable $exception): void
    {
        Log::error('Failed to notify employee of leave rejection', [
            'leave_id' => $event->leave->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
