<?php

namespace App\Notifications;

use App\Models\Leave;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveApprovalNotification extends Notification implements ShouldQueue
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
        $employee = $this->leave->user;
        $leaveType = $this->leave->leaveSetting->leave_type ?? 'Leave';

        return (new MailMessage)
            ->subject('Leave Approval Required')
            ->greeting("Hello {$notifiable->name},")
            ->line("{$employee->name} has requested {$leaveType} for approval.")
            ->line('**Leave Details:**')
            ->line("From: {$this->leave->from_date->format('d M Y')}")
            ->line("To: {$this->leave->to_date->format('d M Y')}")
            ->line("Duration: {$this->leave->no_of_days} day(s)")
            ->when($this->leave->reason, function ($message) {
                return $message->line("Reason: {$this->leave->reason}");
            })
            ->action('Review Leave Request', url("/leaves?approve={$this->leave->id}"))
            ->line('Please review and take action on this leave request.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'leave_id' => $this->leave->id,
            'employee_name' => $this->leave->user->name,
            'leave_type' => $this->leave->leaveSetting->leave_type ?? 'Leave',
            'from_date' => $this->leave->from_date->format('Y-m-d'),
            'to_date' => $this->leave->to_date->format('Y-m-d'),
            'no_of_days' => $this->leave->no_of_days,
            'action_required' => true,
        ];
    }
}
