<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Employee;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Work anniversary notification sent to employees.
 *
 * Recipients: The employee celebrating their work anniversary
 */
class WorkAnniversaryNotification extends BaseHrmNotification
{
    protected string $eventType = 'work_anniversary';

    public function __construct(
        public Employee $employee,
        public int $yearsOfService
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $name = $this->employee->user?->name ?? 'Team Member';
        $years = $this->yearsOfService;
        $yearText = $years === 1 ? 'year' : 'years';

        return (new MailMessage)
            ->subject("🎊 Happy {$years}-Year Work Anniversary, {$name}!")
            ->greeting("Congratulations, {$name}! 🎉")
            ->line("Today marks your **{$years}-year anniversary** with us!")
            ->line("Your dedication, hard work, and contributions over the past {$years} {$yearText} have been invaluable to our team's success.")
            ->line('Thank you for being an essential part of our organization. We look forward to many more successful years together!')
            ->line("Here's to celebrating this milestone!")
            ->salutation("With Appreciation,\nYour Team");
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $years = $this->yearsOfService;
        $yearText = $years === 1 ? 'year' : 'years';

        return [
            'type' => 'work_anniversary',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->user?->name ?? 'Team Member',
            'years_of_service' => $years,
            'date_of_joining' => $this->employee->date_of_joining?->format('Y-m-d'),
            'message' => "🎊 Congratulations on completing {$years} {$yearText} with us!",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '🎊 Happy Work Anniversary!';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $years = $this->yearsOfService;
        $yearText = $years === 1 ? 'year' : 'years';

        return "Congratulations on completing {$years} {$yearText} with us!";
    }
}
