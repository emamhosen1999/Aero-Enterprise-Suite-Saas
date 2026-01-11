<?php

namespace Aero\HRM\Listeners\Attendance;

use Aero\HRM\Events\Attendance\LateArrivalDetected;
use Aero\HRM\Notifications\LateArrivalNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Notifies the manager when an employee arrives late.
 */
class NotifyManagerOfLateArrival implements ShouldQueue
{
    public function handle(LateArrivalDetected $event): void
    {
        $attendance = $event->attendance;
        $employee = $attendance->employee ?? $attendance->user?->employee;

        if (! $employee) {
            Log::warning('Could not find employee for late arrival notification', [
                'attendance_id' => $attendance->id,
            ]);

            return;
        }

        try {
            $manager = $employee->manager;

            if (! $manager || ! $manager->user) {
                Log::info('Employee has no manager to notify of late arrival', [
                    'employee_id' => $employee->id,
                ]);

                return;
            }

            // Notify manager
            $manager->user->notify(new LateArrivalNotification(
                $attendance,
                $event->lateMinutes,
                [
                    'notification_target' => 'manager',
                    'employee_name' => $employee->full_name ?? $employee->user?->name,
                    'scheduled_time' => $event->scheduledTime?->format('H:i'),
                    'actual_time' => $event->actualTime?->format('H:i'),
                ]
            ));

            Log::info('Manager notified of late arrival', [
                'employee_id' => $employee->id,
                'manager_id' => $manager->id,
                'late_minutes' => $event->lateMinutes,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify manager of late arrival', [
                'attendance_id' => $attendance->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(LateArrivalDetected $event, \Throwable $exception): void
    {
        Log::error('Failed to notify manager of late arrival', [
            'attendance_id' => $event->attendance->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
