<?php

namespace Aero\HRM\Listeners\Attendance;

use Aero\HRM\Events\Attendance\AttendancePunchedIn;
use Aero\HRM\Notifications\Attendance\AttendancePunchedInNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendPunchInConfirmation implements ShouldQueue
{
    public function handle(AttendancePunchedIn $event): void
    {
        $attendance = $event->attendance;
        $employee = $attendance->employee;
        $user = $employee?->user;

        if (! $user) {
            Log::warning('Employee has no user for punch-in notification', [
                'attendance_id' => $attendance->id,
            ]);

            return;
        }

        // Send confirmation notification
        $user->notify(new AttendancePunchedInNotification(
            attendance: $attendance,
            isLate: $event->isLate,
            location: $event->location
        ));

        // Log notification
        $this->logNotification($user, $attendance, $event);
    }

    public function failed(AttendancePunchedIn $event, \Throwable $exception): void
    {
        Log::error('Failed to send punch-in confirmation', [
            'attendance_id' => $event->attendance->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $attendance, AttendancePunchedIn $event): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => AttendancePunchedInNotification::class,
                'event_type' => 'attendance.punched_in',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'attendance_id' => $attendance->id,
                    'punch_in_time' => $attendance->punch_in->toIso8601String(),
                    'is_late' => $event->isLate,
                    'location' => $event->location,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log punch-in notification', ['error' => $e->getMessage()]);
        }
    }
}
