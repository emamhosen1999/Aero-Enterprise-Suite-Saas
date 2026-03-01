<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Employee;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent when an employee's probation period is ending.
 *
 * Recipients: HR and the employee's manager
 */
class ProbationEndingNotification extends BaseHrmNotification
{
    protected string $eventType = 'probation_ending';

    public function __construct(
        public Employee $employee,
        public int $daysRemaining
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $employeeName = $this->employee->user?->name ?? 'Employee';
        $endDate = $this->employee->probation_end_date?->format('d M Y') ?? 'soon';

        $message = (new MailMessage)
            ->subject("Probation Review Required: {$employeeName}")
            ->greeting("Hello {$notifiable->name},");

        if ($this->daysRemaining === 0) {
            $message->line("**{$employeeName}'s probation period ends today.**");
        } elseif ($this->daysRemaining === 1) {
            $message->line("**{$employeeName}'s probation period ends tomorrow.**");
        } else {
            $message->line("{$employeeName}'s probation period ends in **{$this->daysRemaining} days**.");
        }

        return $message
            ->line('**Employee Details:**')
            ->line("Name: {$employeeName}")
            ->line('Department: '.($this->employee->department?->name ?? 'N/A'))
            ->line('Designation: '.($this->employee->designation?->name ?? 'N/A'))
            ->line("Probation End Date: {$endDate}")
            ->line('Date of Joining: '.($this->employee->date_of_joining?->format('d M Y') ?? 'N/A'))
            ->action('Conduct Review', url("/hrm/employees/{$this->employee->id}/performance"))
            ->line('Please conduct a performance review and make a confirmation decision.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'probation_ending',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->user?->name ?? 'Employee',
            'department' => $this->employee->department?->name,
            'designation' => $this->employee->designation?->name,
            'probation_end_date' => $this->employee->probation_end_date?->format('Y-m-d'),
            'days_remaining' => $this->daysRemaining,
            'message' => $this->getNotificationMessage(),
            'action_url' => "/hrm/employees/{$this->employee->id}/performance",
        ];
    }

    /**
     * Get the notification message.
     */
    protected function getNotificationMessage(): string
    {
        $employeeName = $this->employee->user?->name ?? 'An employee';

        if ($this->daysRemaining === 0) {
            return "{$employeeName}'s probation ends today. Review required.";
        } elseif ($this->daysRemaining === 1) {
            return "{$employeeName}'s probation ends tomorrow. Review required.";
        }

        return "{$employeeName}'s probation ends in {$this->daysRemaining} days.";
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return 'Probation Review Required';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        return $this->getNotificationMessage();
    }
}
