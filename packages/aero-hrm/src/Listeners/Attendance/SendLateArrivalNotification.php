<?php

namespace Aero\HRM\Listeners\Attendance;

use Aero\Core\Models\User;
use Aero\HRM\Events\Attendance\LateArrivalDetected;
use Aero\HRM\Notifications\Attendance\LateArrivalNotification;
use Aero\HRMAC\Facades\HRMAC;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendLateArrivalNotification implements ShouldQueue
{
    public function handle(LateArrivalDetected $event): void
    {
        $attendance = $event->attendance;
        $employee = $attendance->employee;
        $user = $employee?->user;

        if (! $user) {
            Log::warning('Employee has no user for late arrival notification', [
                'attendance_id' => $attendance->id,
            ]);
            return;
        }

        // Send late arrival notification to employee
        $user->notify(new LateArrivalNotification(
            attendance: $attendance,
            lateMinutes: $event->lateMinutes,
            scheduledTime: $event->scheduledTime,
            actualTime: $event->actualTime
        ));

        $this->logNotification($user, $attendance, $event, 'employee');

        // Notify manager if very late (> 30 minutes)
        if ($event->lateMinutes > 30 && $employee->manager && $employee->manager->user) {
            $managerUser = $employee->manager->user;
            $managerUser->notify(new LateArrivalNotification(
                attendance: $attendance,
                lateMinutes: $event->lateMinutes,
                scheduledTime: $event->scheduledTime,
                actualTime: $event->actualTime
            ));

            $this->logNotification($managerUser, $attendance, $event, 'manager');
        }

        // Notify users with HRM attendance access if extremely late (> 60 minutes)
        if ($event->lateMinutes > 60) {
            $hrUsers = $this->getUsersWithHrmAccess('attendance');
            foreach ($hrUsers as $hrUser) {
                // Skip the employee's own user to avoid self-notification
                if ($hrUser->id === $user->id) {
                    continue;
                }
                $hrUser->notify(new LateArrivalNotification(
                    attendance: $attendance,
                    lateMinutes: $event->lateMinutes,
                    scheduledTime: $event->scheduledTime,
                    actualTime: $event->actualTime
                ));

                $this->logNotification($hrUser, $attendance, $event, 'hr');
            }
        }
    }

    /**
     * Get users with access to a specific HRM submodule using HRMAC.
     */
    protected function getUsersWithHrmAccess(string $subModuleCode): \Illuminate\Support\Collection
    {
        try {
            return HRMAC::getUsersWithSubModuleAccess('hrm', $subModuleCode);
        } catch (\Exception $e) {
            Log::warning('HRMAC not available, falling back to empty collection', [
                'error' => $e->getMessage(),
            ]);
            return collect();
        }
    }

    public function failed(LateArrivalDetected $event, \Throwable $exception): void
    {
        Log::error('Failed to send late arrival notification', [
            'attendance_id' => $event->attendance->id,
            'late_minutes' => $event->lateMinutes,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $attendance, LateArrivalDetected $event, string $context): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => LateArrivalNotification::class,
                'event_type' => 'attendance.late_arrival',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'context' => $context,
                    'attendance_id' => $attendance->id,
                    'employee_id' => $attendance->employee_id,
                    'late_minutes' => $event->lateMinutes,
                    'scheduled_time' => $event->scheduledTime->format('H:i:s'),
                    'actual_time' => $event->actualTime->format('H:i:s'),
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log late arrival notification', ['error' => $e->getMessage()]);
        }
    }
}
