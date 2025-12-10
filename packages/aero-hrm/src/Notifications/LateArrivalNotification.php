<?php

namespace App\Notifications;

use App\Models\HRM\Attendance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LateArrivalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $attendance;

    public $lateCount;

    /**
     * Create a new notification instance.
     */
    public function __construct(Attendance $attendance, int $lateCount = 1)
    {
        $this->attendance = $attendance;
        $this->lateCount = $lateCount;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $employee = $this->attendance->user;
        $date = $this->attendance->date->format('M d, Y');
        $clockIn = $this->attendance->clock_in?->format('h:i A');

        $message = (new MailMessage)
            ->subject('Late Arrival Alert - '.$employee->name)
            ->greeting('Hello, '.$notifiable->name)
            ->line($employee->name.' arrived late on '.$date.'.')
            ->line('**Attendance Details:**')
            ->line('Employee: '.$employee->name)
            ->line('Date: '.$date)
            ->line('Clock In: '.$clockIn);

        if ($this->lateCount > 1) {
            $message->line('**Note:** This is the '.$this->lateCount.$this->getOrdinalSuffix($this->lateCount).' late arrival this month.');
        }

        return $message
            ->action('View Attendance', route('hr.attendance.index'))
            ->line('Please review and take appropriate action if necessary.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'attendance_id' => $this->attendance->id,
            'employee_id' => $this->attendance->user_id,
            'employee_name' => $this->attendance->user->name,
            'date' => $this->attendance->date->toDateString(),
            'clock_in' => $this->attendance->clock_in?->format('H:i:s'),
            'late_count' => $this->lateCount,
            'message' => $this->attendance->user->name.' arrived late on '.$this->attendance->date->format('M d').'. Late count this month: '.$this->lateCount,
            'action' => 'view_attendance',
            'action_url' => route('hr.attendance.index'),
        ];
    }

    /**
     * Get ordinal suffix for numbers.
     */
    private function getOrdinalSuffix(int $number): string
    {
        $ends = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];

        if ((($number % 100) >= 11) && (($number % 100) <= 13)) {
            return 'th';
        }

        return $ends[$number % 10];
    }
}
