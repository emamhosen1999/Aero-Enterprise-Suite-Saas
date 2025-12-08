<?php

namespace App\Notifications;

use App\Models\Leave;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Leave $leave,
        public string $reason
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $leaveType = $this->leave->leaveSetting->leave_type ?? 'Leave';
        $rejectedBy = $this->leave->rejectedBy?->name ?? 'Manager';

        return (new MailMessage)
            ->subject('Leave Request Rejected')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your {$leaveType} request has been rejected by {$rejectedBy}.")
            ->line('**Leave Details:**')
            ->line("From: {$this->leave->from_date->format('d M Y')}")
            ->line("To: {$this->leave->to_date->format('d M Y')}")
            ->line("Duration: {$this->leave->no_of_days} day(s)")
            ->line('**Rejection Reason:**')
            ->line($this->reason)
            ->action('View Leave Details', url("/leaves?view={$this->leave->id}"))
            ->line('You may contact your manager for further clarification.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'leave_id' => $this->leave->id,
            'leave_type' => $this->leave->leaveSetting->leave_type ?? 'Leave',
            'from_date' => $this->leave->from_date->format('Y-m-d'),
            'to_date' => $this->leave->to_date->format('Y-m-d'),
            'no_of_days' => $this->leave->no_of_days,
            'status' => 'rejected',
            'rejection_reason' => $this->reason,
            'rejected_by' => $this->leave->rejected_by,
        ];
    }
}
