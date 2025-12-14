<?php

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\AttendanceLogged;
use App\Notifications\LateArrivalNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class LogAttendanceActivity implements ShouldQueue
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
    public function handle(AttendanceLogged $event): void
    {
        $attendance = $event->attendance;
        $employee = $attendance->user;

        // Log attendance activity
        activity()
            ->performedOn($attendance)
            ->causedBy($employee)
            ->withProperties([
                'clock_in' => $attendance->clock_in,
                'clock_out' => $attendance->clock_out,
                'status' => $attendance->status,
                'date' => $attendance->date,
            ])
            ->log('Attendance logged');

        // Check if employee is late and notify
        if ($attendance->status === 'late') {
            // Notify manager if employee has multiple late arrivals
            $lateCount = \Aero\HRM\Models\Attendance::where('user_id', $employee->id)
                ->where('status', 'late')
                ->whereMonth('date', now()->month)
                ->count();

            if ($lateCount >= 3 && $employee->manager) {
                $employee->manager->notify(new LateArrivalNotification($attendance, $lateCount));
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(AttendanceLogged $event, \Throwable $exception): void
    {
        Log::error('Failed to log attendance activity', [
            'attendance_id' => $event->attendance->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
