<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Leave;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to managers/HR when a leave request is submitted.
 *
 * Recipients: Manager, HR roles
 */
class LeaveRequestNotification extends BaseHrmNotification
{
    protected string $eventType = 'leave_requested';

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
        $startDate = $this->leave->from_date?->format('M d, Y') ?? $this->leave->start_date?->format('M d, Y') ?? 'N/A';
        $endDate = $this->leave->to_date?->format('M d, Y') ?? $this->leave->end_date?->format('M d, Y') ?? 'N/A';
        $days = $this->leave->no_of_days ?? $this->leave->days ?? 1;
        $leaveType = $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type ?? 'Leave';

        return (new MailMessage)
            ->subject("Leave Request - {$employeeName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$employeeName} has submitted a leave request that requires your approval.")
            ->line('**Leave Details:**')
            ->line("Employee: {$employeeName}")
            ->line("Leave Type: {$leaveType}")
            ->line("Duration: {$startDate} to {$endDate}")
            ->line("Days: {$days} day(s)")
            ->line('Reason: '.($this->leave->reason ?? 'Not specified'))
            ->action('Review Leave Request', url("/hrm/leaves/{$this->leave->id}"))
            ->line('Please review and take appropriate action.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $employee = $this->leave->user;
        $startDate = $this->leave->from_date ?? $this->leave->start_date;
        $endDate = $this->leave->to_date ?? $this->leave->end_date;

        return [
            'type' => 'leave_requested',
            'leave_id' => $this->leave->id,
            'employee_id' => $this->leave->user_id,
            'employee_name' => $employee?->name ?? 'Employee',
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leaveType?->name ?? $this->leave->leave_type,
            'from_date' => $startDate?->format('Y-m-d'),
            'to_date' => $endDate?->format('Y-m-d'),
            'days' => $this->leave->no_of_days ?? $this->leave->days ?? 1,
            'message' => ($employee?->name ?? 'An employee')." has requested leave from {$startDate?->format('M d')} to {$endDate?->format('M d')}",
            'action_url' => "/hrm/leaves/{$this->leave->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return 'New Leave Request';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $employeeName = $this->leave->user?->name ?? 'An employee';
        $days = $this->leave->no_of_days ?? $this->leave->days ?? 1;

        return "{$employeeName} has requested {$days} day(s) of leave. Tap to review.";
    }

    /**
     * Get FCM data payload.
     */
    protected function getFcmData(): array
    {
        return [
            'type' => 'leave_requested',
            'leave_id' => (string) $this->leave->id,
            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            'route' => "/hrm/leaves/{$this->leave->id}",
        ];
    }
}
