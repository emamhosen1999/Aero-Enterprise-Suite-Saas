<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Employee;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to managers/team about an employee's birthday today.
 *
 * Recipients: Manager, team members, HR
 */
class TeamBirthdayAlertNotification extends BaseHrmNotification
{
    protected string $eventType = 'birthday_reminder';

    public function __construct(
        public Employee $employee,
        public int $age
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $name = $this->employee->user?->name ?? 'A team member';
        $department = $this->employee->department?->name ?? 'the team';

        return (new MailMessage)
            ->subject("🎂 Birthday Alert: {$name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Today is **{$name}'s** birthday! 🎉")
            ->line("**Department:** {$department}")
            ->line("Take a moment to wish them a happy birthday and make their day special!")
            ->action('View Employee Profile', url("/hrm/employees/{$this->employee->id}"))
            ->line("A small gesture can make a big difference.");
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $name = $this->employee->user?->name ?? 'A team member';

        return [
            'type' => 'team_birthday_alert',
            'employee_id' => $this->employee->id,
            'employee_name' => $name,
            'department' => $this->employee->department?->name,
            'message' => "🎂 Today is {$name}'s birthday!",
            'action_url' => "/hrm/employees/{$this->employee->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '🎂 Team Birthday Today';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $name = $this->employee->user?->name ?? 'A team member';

        return "Today is {$name}'s birthday! Don't forget to wish them.";
    }
}
