<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Onboarding;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Reminder notification sent to managers about pending employee onboarding.
 *
 * Recipients: The employee's manager
 */
class ManagerOnboardingReminderNotification extends BaseHrmNotification
{
    protected string $eventType = 'manager_onboarding_reminder';

    public function __construct(
        protected Onboarding $onboarding,
        protected int $progress
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $employeeName = $this->onboarding->employee?->user?->name ?? 'Employee';
        $daysElapsed = now()->diffInDays($this->onboarding->created_at);

        return (new MailMessage)
            ->subject("Onboarding Status: {$employeeName}")
            ->greeting("Hello {$notifiable->name},")
            ->line('This is a reminder about a pending employee onboarding.')
            ->line("**Employee:** {$employeeName}")
            ->line("**Onboarding Progress:** {$this->progress}%")
            ->line("**Days Elapsed:** {$daysElapsed} days")
            ->line('The employee has not yet completed their onboarding process. You may want to follow up with them.')
            ->action('View Onboarding', url("/hrm/onboarding/{$this->onboarding->id}"))
            ->line('Thank you for helping new team members get onboarded successfully.')
            ->salutation('Best regards, ' . config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $employeeName = $this->onboarding->employee?->user?->name ?? 'Employee';

        return [
            'type' => 'manager_onboarding_reminder',
            'onboarding_id' => $this->onboarding->id,
            'employee_id' => $this->onboarding->employee_id,
            'employee_name' => $employeeName,
            'progress' => $this->progress,
            'message' => "{$employeeName}'s onboarding is at {$this->progress}% completion. Follow-up may be needed.",
            'action_url' => "/hrm/onboarding/{$this->onboarding->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '📋 Employee Onboarding Reminder';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $employeeName = $this->onboarding->employee?->user?->name ?? 'An employee';

        return "{$employeeName}'s onboarding is at {$this->progress}%. May need follow-up.";
    }
}
