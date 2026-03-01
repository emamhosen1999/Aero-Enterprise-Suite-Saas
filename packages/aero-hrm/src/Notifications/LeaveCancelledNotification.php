<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Leave;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent when a leave request is cancelled.
 *
 * Recipients: The employee who cancelled and their manager
 */
class LeaveCancelledNotification extends BaseHrmNotification
{
    protected string $eventType = 'leave_cancelled';

    public function __construct(
        public Leave $leave,
        public string $cancelledByName = 'User'
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $leaveType = $this->leave->leaveSetting?->leave_type ?? $this->leave->leave_type ?? 'Leave';
        $employee = $this->leave->user;
        $employeeName = $employee?->name ?? 'Employee';

        return (new MailMessage)
            ->subject("Leave Request Cancelled - {$employeeName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A {$leaveType} request has been cancelled.")
            ->line('**Leave Details:**')
            ->line("Employee: {$employeeName}")
            ->line("From: {$this->leave->from_date->format('d M Y')}")
            ->line("To: {$this->leave->to_date->format('d M Y')}")
            ->line("Duration: {$this->leave->no_of_days} day(s)")
            ->line("Cancelled by: {$this->cancelledByName}")
            ->line('Cancelled at: '.now()->format('d M Y H:i'))
            ->action('View Leave History', url('/hrm/leaves'))
            ->line('The leave balance has been restored.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'leave_cancelled',
            'leave_id' => $this->leave->id,
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leave_type ?? 'Leave',
            'from_date' => $this->leave->from_date->format('Y-m-d'),
            'to_date' => $this->leave->to_date->format('Y-m-d'),
            'no_of_days' => $this->leave->no_of_days,
            'status' => 'cancelled',
            'cancelled_by' => $this->cancelledByName,
            'employee_id' => $this->leave->user_id,
            'employee_name' => $this->leave->user?->name ?? 'Employee',
            'message' => "Leave request from {$this->leave->from_date->format('M d')} to {$this->leave->to_date->format('M d')} was cancelled",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return 'Leave Cancelled';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $employeeName = $this->leave->user?->name ?? 'Employee';

        return "{$employeeName}'s leave request for {$this->leave->from_date->format('M d')} - {$this->leave->to_date->format('M d')} has been cancelled.";
    }

    /**
     * Get FCM data payload.
     */
    protected function getFcmData(): array
    {
        return [
            'type' => 'leave_cancelled',
            'leave_id' => (string) $this->leave->id,
            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            'route' => '/hrm/leaves',
        ];
    }
}
