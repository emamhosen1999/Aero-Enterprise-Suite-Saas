<?php

namespace Aero\HRM\Listeners\Attendance;

use Aero\HRM\Events\Attendance\AttendancePunchedOut;
use Aero\HRM\Notifications\Attendance\AttendancePunchedOutNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Sends attendance summary notification after punch-out.
 */
class SendAttendanceSummary implements ShouldQueue
{
    public function handle(AttendancePunchedOut $event): void
    {
        $attendance = $event->attendance;
        $user = $attendance->user;

        if (! $user) {
            Log::warning('Attendance has no associated user for summary', [
                'attendance_id' => $attendance->id,
            ]);

            return;
        }

        try {
            // Calculate work summary
            $summary = $this->calculateWorkSummary($attendance, $event);

            // Send summary notification
            $user->notify(new AttendancePunchedOutNotification($attendance, [
                'total_hours' => $summary['total_hours'],
                'total_minutes' => $summary['total_minutes'],
                'has_overtime' => $event->hasOvertime,
                'overtime_minutes' => $summary['overtime_minutes'],
                'is_early_departure' => $event->isEarly,
            ]));

            Log::info('Attendance summary sent', [
                'attendance_id' => $attendance->id,
                'user_id' => $user->id,
                'total_minutes' => $summary['total_minutes'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send attendance summary', [
                'attendance_id' => $attendance->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function calculateWorkSummary($attendance, AttendancePunchedOut $event): array
    {
        $totalMinutes = $event->totalMinutes ?? 0;

        // If not provided, calculate from punch times
        if ($totalMinutes === 0 && $attendance->punchin && $attendance->punchout) {
            $punchIn = $attendance->punchin instanceof \Carbon\Carbon
                ? $attendance->punchin
                : \Carbon\Carbon::parse($attendance->punchin);
            $punchOut = $attendance->punchout instanceof \Carbon\Carbon
                ? $attendance->punchout
                : \Carbon\Carbon::parse($attendance->punchout);

            $totalMinutes = $punchIn->diffInMinutes($punchOut);
        }

        // Standard work hours (8 hours = 480 minutes)
        $standardMinutes = 480;
        $overtimeMinutes = max(0, $totalMinutes - $standardMinutes);

        return [
            'total_minutes' => $totalMinutes,
            'total_hours' => round($totalMinutes / 60, 2),
            'overtime_minutes' => $overtimeMinutes,
            'overtime_hours' => round($overtimeMinutes / 60, 2),
        ];
    }

    public function failed(AttendancePunchedOut $event, \Throwable $exception): void
    {
        Log::error('Failed to send attendance summary', [
            'attendance_id' => $event->attendance->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
