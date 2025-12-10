<?php

namespace App\Notifications;

use App\Models\HRM\Leave;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $leave;

    /**
     * Create a new notification instance.
     */
    public function __construct(Leave $leave)
    {
        $this->leave = $leave;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $employee = $this->leave->user;
        $startDate = $this->leave->start_date->format('M d, Y');
        $endDate = $this->leave->end_date->format('M d, Y');

        return (new MailMessage)
            ->subject('Leave Request - '.$employee->name)
            ->greeting('Hello, '.$notifiable->name)
            ->line($employee->name.' has submitted a leave request that requires your approval.')
            ->line('**Leave Details:**')
            ->line('Employee: '.$employee->name)
            ->line('Leave Type: '.$this->leave->leaveType?->name)
            ->line('Duration: '.$startDate.' to '.$endDate)
            ->line('Days: '.$this->leave->days.' day(s)')
            ->line('Reason: '.$this->leave->reason)
            ->action('Review Leave Request', route('hr.leaves.show', $this->leave->id))
            ->line('Please review and take appropriate action.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'leave_id' => $this->leave->id,
            'employee_id' => $this->leave->user_id,
            'employee_name' => $this->leave->user->name,
            'leave_type' => $this->leave->leaveType?->name,
            'start_date' => $this->leave->start_date->toDateString(),
            'end_date' => $this->leave->end_date->toDateString(),
            'days' => $this->leave->days,
            'message' => $this->leave->user->name.' has requested leave from '.$this->leave->start_date->format('M d').' to '.$this->leave->end_date->format('M d'),
            'action' => 'review_leave',
            'action_url' => route('hr.leaves.show', $this->leave->id),
        ];
    }
}
