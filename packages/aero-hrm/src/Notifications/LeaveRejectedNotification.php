<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Leave;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to employees when their leave is rejected.
 *
 * Recipients: The employee who requested the leave
 */
class LeaveRejectedNotification extends BaseHrmNotification
{
    protected string $eventType = 'leave_rejected';

    public function __construct(
        public Leave $leave,
        public string $reason = ''
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $leaveType = $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type ?? 'Leave';
        $rejectedBy = $this->leave->rejectedBy?->name ?? 'Manager';
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;
        $days = $this->leave->no_of_days ?? $this->leave->days ?? 1;
        $rejectionReason = $this->reason ?: ($this->leave->rejection_reason ?? 'No reason provided');

        return (new MailMessage)
            ->subject('Leave Request Rejected')
            ->greeting("Hello {$notifiable->name},")
            ->line("Unfortunately, your {$leaveType} request has been rejected by {$rejectedBy}.")
            ->line('**Leave Details:**')
            ->line("From: {$fromDate?->format('d M Y')}")
            ->line("To: {$toDate?->format('d M Y')}")
            ->line("Duration: {$days} day(s)")
            ->line('**Rejection Reason:**')
            ->line($rejectionReason)
            ->action('View Leave Details', url("/hrm/leaves/{$this->leave->id}"))
            ->line('You may contact your manager for further clarification or submit a new request.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;

        return [
            'type' => 'leave_rejected',
            'leave_id' => $this->leave->id,
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type,
            'from_date' => $fromDate?->format('Y-m-d'),
            'to_date' => $toDate?->format('Y-m-d'),
            'days' => $this->leave->no_of_days ?? $this->leave->days ?? 1,
            'status' => 'rejected',
            'rejection_reason' => $this->reason ?: $this->leave->rejection_reason,
            'rejected_by' => $this->leave->rejectedBy?->name,
            'message' => "Your leave request from {$fromDate?->format('M d')} to {$toDate?->format('M d')} has been rejected.",
            'action_url' => "/hrm/leaves/{$this->leave->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '❌ Leave Rejected';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;

        return "Your leave from {$fromDate?->format('M d')} to {$toDate?->format('M d')} has been rejected. Tap for details.";
    }
}
