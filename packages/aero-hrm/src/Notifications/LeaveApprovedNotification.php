<?php

namespace App\Notifications;

use App\Models\Leave;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Leave $leave
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $leaveType = $this->leave->leaveSetting->leave_type ?? 'Leave';

        return (new MailMessage)
            ->subject('Leave Request Approved')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your {$leaveType} request has been approved.")
            ->line('**Leave Details:**')
            ->line("From: {$this->leave->from_date->format('d M Y')}")
            ->line("To: {$this->leave->to_date->format('d M Y')}")
            ->line("Duration: {$this->leave->no_of_days} day(s)")
            ->line("Approved at: {$this->leave->approved_at->format('d M Y H:i')}")
            ->action('View Leave Details', url("/leaves?view={$this->leave->id}"))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'leave_id' => $this->leave->id,
            'leave_type' => $this->leave->leaveSetting->leave_type ?? 'Leave',
            'from_date' => $this->leave->from_date->format('Y-m-d'),
            'to_date' => $this->leave->to_date->format('Y-m-d'),
            'no_of_days' => $this->leave->no_of_days,
            'status' => 'approved',
            'approved_at' => $this->leave->approved_at,
        ];
    }
}
