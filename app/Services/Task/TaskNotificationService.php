<?php

namespace App\Services\Task;

use App\Models\Tasks;
use App\Models\User;
use App\Notifications\PushNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class TaskNotificationService
{
    /**
     * Send task assignment notification
     */
    public function sendTaskAssignmentNotification(Tasks $task, string $assignedTo): void
    {
        $user = Auth::user();
        $assignedUser = User::find($assignedTo);

        if (! $assignedUser) {
            return;
        }

        $notificationData = [
            'title' => 'New Task Assignment',
            'body' => "You have been assigned task #{$task->number} by {$user->name}",
            'task_id' => $task->id,
            'assigned_by' => $user->id,
        ];

        Notification::send($assignedUser, new PushNotification($notificationData));
    }

    /**
     * Send task status update notification
     */
    public function sendTaskStatusUpdateNotification(Tasks $task, string $oldStatus, string $newStatus): void
    {
        $user = Auth::user();
        $inchargeUser = User::find($task->incharge);

        if (! $inchargeUser || $inchargeUser->id === $user->id) {
            return;
        }

        $notificationData = [
            'title' => 'Task Status Updated',
            'body' => "Task #{$task->number} status changed from {$oldStatus} to {$newStatus}",
            'task_id' => $task->id,
            'updated_by' => $user->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ];

        Notification::send($inchargeUser, new PushNotification($notificationData));
    }

    /**
     * Send task completion notification
     */
    public function sendTaskCompletionNotification(Tasks $task): void
    {
        $user = Auth::user();
        $inchargeUser = User::find($task->incharge);

        if (! $inchargeUser || $inchargeUser->id === $user->id) {
            return;
        }

        $notificationData = [
            'title' => 'Task Completed',
            'body' => "Task #{$task->number} has been completed by {$user->name}",
            'task_id' => $task->id,
            'completed_by' => $user->id,
            'completion_time' => $task->completion_time,
        ];

        Notification::send($inchargeUser, new PushNotification($notificationData));
    }

    /**
     * Send bulk notification to multiple users
     */
    public function sendBulkNotification(array $userIds, array $notificationData): void
    {
        $users = User::whereIn('id', $userIds)->get();

        if ($users->isEmpty()) {
            return;
        }

        Notification::send($users, new PushNotification($notificationData));
    }

    /**
     * Send task resubmission notification
     */
    public function sendTaskResubmissionNotification(Tasks $task, int $resubmissionCount): void
    {
        $user = Auth::user();
        $inchargeUser = User::find($task->incharge);

        if (! $inchargeUser || $inchargeUser->id === $user->id) {
            return;
        }

        $ordinal = $this->getOrdinalNumber($resubmissionCount);

        $notificationData = [
            'title' => 'Task Resubmission',
            'body' => "Task #{$task->number} has been resubmitted for the {$ordinal} time",
            'task_id' => $task->id,
            'resubmitted_by' => $user->id,
            'resubmission_count' => $resubmissionCount,
        ];

        Notification::send($inchargeUser, new PushNotification($notificationData));
    }

    /**
     * Get ordinal number (1st, 2nd, 3rd, etc.)
     */
    private function getOrdinalNumber(int $number): string
    {
        if (! in_array(($number % 100), [11, 12, 13])) {
            switch ($number % 10) {
                case 1: return $number.'st';
                case 2: return $number.'nd';
                case 3: return $number.'rd';
            }
        }

        return $number.'th';
    }
}
