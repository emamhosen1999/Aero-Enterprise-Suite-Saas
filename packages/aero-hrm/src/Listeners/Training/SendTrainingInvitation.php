<?php

namespace Aero\HRM\Listeners\Training;

use Aero\HRM\Events\Training\TrainingScheduled;
use Aero\HRM\Models\Employee;
use Aero\HRM\Notifications\Training\TrainingScheduledNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendTrainingInvitation implements ShouldQueue
{
    public function handle(TrainingScheduled $event): void
    {
        $training = $event->training;
        $enrolledEmployeeIds = $event->enrolledEmployeeIds;

        if (empty($enrolledEmployeeIds)) {
            Log::info('No employees enrolled in training', [
                'training_id' => $training->id,
            ]);
            return;
        }

        // Get enrolled employees
        $employees = Employee::whereIn('id', $enrolledEmployeeIds)->with('user')->get();

        foreach ($employees as $employee) {
            $user = $employee->user;
            
            if (!$user) {
                Log::warning('Employee has no user for training notification', [
                    'employee_id' => $employee->id,
                    'training_id' => $training->id,
                ]);
                continue;
            }

            // Send training invitation
            $user->notify(new TrainingScheduledNotification(
                training: $training,
                enrolledEmployeeIds: $enrolledEmployeeIds
            ));

            // Log notification
            $this->logNotification($user, $training, $employee);
        }
    }

    public function failed(TrainingScheduled $event, \Throwable $exception): void
    {
        Log::error('Failed to send training invitations', [
            'training_id' => $event->training->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $training, $employee): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => TrainingScheduledNotification::class,
                'event_type' => 'training.scheduled',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'training_id' => $training->id,
                    'employee_id' => $employee->id,
                    'training_title' => $training->title,
                    'start_date' => $training->start_date->toDateString(),
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log training notification', ['error' => $e->getMessage()]);
        }
    }
}
