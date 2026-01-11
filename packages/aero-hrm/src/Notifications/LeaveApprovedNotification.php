<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Leave;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to employees when their leave is approved.
 *
 * Recipients: The employee who requested the leave
 */
class LeaveApprovedNotification extends BaseHrmNotification
{
    protected string $eventType = 'leave_approved';

    public function __construct(
        public Leave $leave
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $leaveType = $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type ?? 'Leave';
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;
        $days = $this->leave->no_of_days ?? $this->leave->days ?? 1;

        return (new MailMessage)
            ->subject('Leave Request Approved')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your {$leaveType} request has been approved. 🎉")
            ->line('**Leave Details:**')
            ->line("From: {$fromDate?->format('d M Y')}")
            ->line("To: {$toDate?->format('d M Y')}")
            ->line("Duration: {$days} day(s)")
            ->line('Approved at: ' . ($this->leave->approved_at?->format('d M Y H:i') ?? now()->format('d M Y H:i')))
            ->action('View Leave Details', url("/hrm/leaves/{$this->leave->id}"))
            ->line('Enjoy your time off!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;

        return [
            'type' => 'leave_approved',
            'leave_id' => $this->leave->id,
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type,
            'from_date' => $fromDate?->format('Y-m-d'),
            'to_date' => $toDate?->format('Y-m-d'),
            'days' => $this->leave->no_of_days ?? $this->leave->days ?? 1,
            'status' => 'approved',
            'approved_at' => $this->leave->approved_at,
            'approved_by' => $this->leave->approvedBy?->name,
            'message' => "Your leave request from {$fromDate?->format('M d')} to {$toDate?->format('M d')} has been approved!",
            'action_url' => "/hrm/leaves/{$this->leave->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '✅ Leave Approved';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;

        return "Your leave from {$fromDate?->format('M d')} to {$toDate?->format('M d')} has been approved!";
    }

    /**
     * Get SMS message.
     */
    protected function getSmsMessage(): string
    {
        $days = $this->leave->no_of_days ?? $this->leave->days ?? 1;
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;

        return "Your {$days}-day leave starting {$fromDate?->format('M d')} has been approved.";
    }
}
