<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Employee;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Birthday wish notification sent to employees on their birthday.
 *
 * Recipients: The employee celebrating their birthday
 */
class BirthdayWishNotification extends BaseHrmNotification
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
        $name = $this->employee->user?->name ?? 'Team Member';

        return (new MailMessage)
            ->subject("🎂 Happy Birthday, {$name}!")
            ->greeting("Happy Birthday, {$name}! 🎉")
            ->line('Wishing you a wonderful birthday filled with joy and happiness!')
            ->line('On behalf of the entire team, we want to express our appreciation for your contributions and dedication.')
            ->line('May this year bring you success, good health, and all the happiness you deserve.')
            ->line('Enjoy your special day!')
            ->salutation("Best Wishes,\nYour Team");
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'birthday_wish',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->user?->name ?? 'Team Member',
            'age' => $this->age,
            'message' => '🎂 Happy Birthday! Wishing you a wonderful day!',
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '🎂 Happy Birthday!';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        return 'Wishing you a wonderful birthday filled with joy and happiness!';
    }
}
