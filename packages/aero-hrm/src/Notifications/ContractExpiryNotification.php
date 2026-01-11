<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Employee;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent when an employee's contract is about to expire.
 *
 * Recipients: HR, the employee, and their manager
 */
class ContractExpiryNotification extends BaseHrmNotification
{
    protected string $eventType = 'contract_expiring';

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
        $endDate = $this->employee->date_of_leaving?->format('d M Y')
            ?? $this->employee->contract_end_date?->format('d M Y')
            ?? 'soon';
        $urgency = $this->daysRemaining <= 7 ? '⚠️ URGENT: ' : '';

        $message = (new MailMessage)
            ->subject("{$urgency}Contract Expiring: {$employeeName}")
            ->greeting("Hello {$notifiable->name},");

        if ($this->daysRemaining === 0) {
            $message->line("**{$employeeName}'s contract expires today!**");
        } elseif ($this->daysRemaining === 1) {
            $message->line("**{$employeeName}'s contract expires tomorrow!**");
        } else {
            $message->line("{$employeeName}'s contract expires in **{$this->daysRemaining} days**.");
        }

        return $message
            ->line("**Employee Details:**")
            ->line("Name: {$employeeName}")
            ->line("Department: " . ($this->employee->department?->name ?? 'N/A'))
            ->line("Designation: " . ($this->employee->designation?->name ?? 'N/A'))
            ->line("Employment Type: " . ($this->employee->employment_type ?? 'Contract'))
            ->line("Contract End Date: {$endDate}")
            ->action('View Employee', url("/hrm/employees/{$this->employee->id}"))
            ->line('Please take necessary action regarding contract renewal or offboarding.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'contract_expiring',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->user?->name ?? 'Employee',
            'department' => $this->employee->department?->name,
            'designation' => $this->employee->designation?->name,
            'employment_type' => $this->employee->employment_type,
            'contract_end_date' => $this->employee->date_of_leaving?->format('Y-m-d')
                ?? $this->employee->contract_end_date?->format('Y-m-d'),
            'days_remaining' => $this->daysRemaining,
            'is_urgent' => $this->daysRemaining <= 7,
            'message' => $this->getNotificationMessage(),
            'action_url' => "/hrm/employees/{$this->employee->id}",
        ];
    }

    /**
     * Get the notification message.
     */
    protected function getNotificationMessage(): string
    {
        $employeeName = $this->employee->user?->name ?? 'An employee';

        if ($this->daysRemaining === 0) {
            return "⚠️ {$employeeName}'s contract expires today!";
        } elseif ($this->daysRemaining === 1) {
            return "⚠️ {$employeeName}'s contract expires tomorrow!";
        } elseif ($this->daysRemaining <= 7) {
            return "⚠️ {$employeeName}'s contract expires in {$this->daysRemaining} days";
        }

        return "{$employeeName}'s contract expires in {$this->daysRemaining} days";
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return $this->daysRemaining <= 7 ? '⚠️ Contract Expiring Soon' : 'Contract Expiry Reminder';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        return $this->getNotificationMessage();
    }
}
