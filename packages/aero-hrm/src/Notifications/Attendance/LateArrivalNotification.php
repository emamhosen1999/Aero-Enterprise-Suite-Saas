<?php

namespace Aero\HRM\Notifications\Attendance;

use Aero\HRM\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class LateArrivalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Attendance $attendance,
        public int $lateMinutes,
        public Carbon $scheduledTime,
        public Carbon $actualTime
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];

        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }

        if ($this->isChannelEnabled('push', $notifiable)) {
            $channels[] = 'broadcast';
        }

        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Late Arrival Notification')
            ->greeting("Hello {$notifiable->name}!")
            ->line('You were late to work today.')
            ->line("Scheduled Time: {$this->scheduledTime->format('h:i A')}")
            ->line("Actual Arrival: {$this->actualTime->format('h:i A')}")
            ->line("Late By: {$this->lateMinutes} minutes")
            ->line('Please try to arrive on time. Repeated late arrivals may affect your attendance record.')
            ->action('View Attendance', route('attendance.index'))
            ->salutation('HR Department');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'attendance.late_arrival',
            'attendance_id' => $this->attendance->id,
            'employee_id' => $this->attendance->employee_id,
            'scheduled_time' => $this->scheduledTime->format('H:i:s'),
            'actual_time' => $this->actualTime->format('H:i:s'),
            'late_minutes' => $this->lateMinutes,
            'message' => "⚠️ Late arrival detected: {$this->lateMinutes} minutes late",
            'action_url' => route('attendance.show', $this->attendance->id),
            'severity' => $this->lateMinutes > 30 ? 'high' : 'medium',
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'title' => '⚠️ Late Arrival',
            'body' => "You arrived {$this->lateMinutes} minutes late today",
            'icon' => '/images/icons/warning.png',
            'data' => $this->toArray($notifiable),
        ];
    }

    protected function isChannelEnabled(string $channel, $notifiable): bool
    {
        $globalSetting = DB::table('notification_settings')
            ->where('key', "channels.{$channel}.enabled")
            ->first();

        if (! $globalSetting || ! json_decode($globalSetting->value)) {
            return false;
        }

        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel, 'attendance.late_arrival');
        }

        return true;
    }
}
