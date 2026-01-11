<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Leave;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to managers when a leave request requires approval.
 *
 * Recipients: The employee's manager/approver
 */
class LeaveApprovalNotification extends BaseHrmNotification
{
    protected string $eventType = 'leave_approval_required';

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
        $employee = $this->leave->user;
        $employeeName = $employee?->name ?? 'Employee';
        $leaveType = $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type ?? 'Leave';
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;
        $days = $this->leave->no_of_days ?? $this->leave->days ?? 1;

        $message = (new MailMessage)
            ->subject("Leave Approval Required - {$employeeName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$employeeName} has requested {$leaveType} for approval.")
            ->line('**Leave Details:**')
            ->line("From: {$fromDate?->format('d M Y')}")
            ->line("To: {$toDate?->format('d M Y')}")
            ->line("Duration: {$days} day(s)");

        if ($this->leave->reason) {
            $message->line("Reason: {$this->leave->reason}");
        }

        return $message
            ->action('Review Leave Request', url("/hrm/leaves/{$this->leave->id}"))
            ->line('Please review and take action on this leave request.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $fromDate = $this->leave->from_date ?? $this->leave->start_date;
        $toDate = $this->leave->to_date ?? $this->leave->end_date;

        return [
            'type' => 'leave_approval_required',
            'leave_id' => $this->leave->id,
            'employee_id' => $this->leave->user_id,
            'employee_name' => $this->leave->user?->name ?? 'Employee',
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type,
            'from_date' => $fromDate?->format('Y-m-d'),
            'to_date' => $toDate?->format('Y-m-d'),
            'days' => $this->leave->no_of_days ?? $this->leave->days ?? 1,
            'action_required' => true,
            'message' => ($this->leave->user?->name ?? 'An employee') . " has requested leave requiring your approval.",
            'action_url' => "/hrm/leaves/{$this->leave->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '📋 Leave Approval Required';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $employeeName = $this->leave->user?->name ?? 'An employee';
        $days = $this->leave->no_of_days ?? $this->leave->days ?? 1;

        return "{$employeeName} requests {$days} day(s) of leave. Tap to review.";
    }
}
