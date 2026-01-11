<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Attendance;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to managers when an employee arrives late.
 *
 * Recipients: The employee's manager
 */
class LateArrivalNotification extends BaseHrmNotification
{
    protected string $eventType = 'late_arrival';

    public function __construct(
        public Attendance $attendance,
        public int $lateCount = 1
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $employee = $this->attendance->user;
        $employeeName = $employee?->name ?? 'Employee';
        $date = $this->attendance->date?->format('M d, Y') ?? now()->format('M d, Y');
        $clockIn = $this->attendance->clock_in?->format('h:i A') ?? 'N/A';

        $message = (new MailMessage)
            ->subject("Late Arrival Alert - {$employeeName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$employeeName} arrived late on {$date}.")
            ->line('**Attendance Details:**')
            ->line("Employee: {$employeeName}")
            ->line("Date: {$date}")
            ->line("Clock In: {$clockIn}");

        if ($this->lateCount > 1) {
            $suffix = $this->getOrdinalSuffix($this->lateCount);
            $message->line("**Note:** This is the {$this->lateCount}{$suffix} late arrival this month.");
        }

        return $message
            ->action('View Attendance', url('/hrm/attendance'))
            ->line('Please review and take appropriate action if necessary.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $employee = $this->attendance->user;

        return [
            'type' => 'late_arrival',
            'attendance_id' => $this->attendance->id,
            'employee_id' => $this->attendance->user_id,
            'employee_name' => $employee?->name ?? 'Employee',
            'date' => $this->attendance->date?->format('Y-m-d'),
            'clock_in' => $this->attendance->clock_in?->format('H:i:s'),
            'late_count' => $this->lateCount,
            'message' => ($employee?->name ?? 'An employee') . " arrived late on {$this->attendance->date?->format('M d')}. Late count this month: {$this->lateCount}",
            'action_url' => '/hrm/attendance',
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '⏰ Late Arrival Alert';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $employeeName = $this->attendance->user?->name ?? 'An employee';
        $date = $this->attendance->date?->format('M d') ?? 'today';

        return "{$employeeName} arrived late on {$date}. ({$this->lateCount} this month)";
    }

    /**
     * Get ordinal suffix for a number.
     */
    protected function getOrdinalSuffix(int $number): string
    {
        if (in_array($number % 100, [11, 12, 13])) {
            return 'th';
        }

        return match ($number % 10) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };
    }
}
