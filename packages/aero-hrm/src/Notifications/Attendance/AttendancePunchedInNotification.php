<?php

namespace Aero\HRM\Notifications\Attendance;

use Aero\HRM\Models\Attendance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class AttendancePunchedInNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Attendance $attendance,
        public bool $isLate = false,
        public array $location = []
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];

        if ($this->isChannelEnabled('push', $notifiable)) {
            $channels[] = 'broadcast';
        }

        return $channels;
    }

    public function toArray($notifiable): array
    {
        $message = $this->isLate
            ? "⚠️ You punched in late at {$this->attendance->punch_in->format('h:i A')}"
            : "✓ Successfully punched in at {$this->attendance->punch_in->format('h:i A')}";

        return [
            'type' => 'attendance.punched_in',
            'attendance_id' => $this->attendance->id,
            'punch_in_time' => $this->attendance->punch_in->toIso8601String(),
            'is_late' => $this->isLate,
            'location' => $this->location,
            'message' => $message,
            'action_url' => route('attendance.index'),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        $title = $this->isLate ? 'Late Punch-In' : 'Punch-In Confirmed';
        $body = $this->isLate
            ? "You punched in late at {$this->attendance->punch_in->format('h:i A')}"
            : "Successfully punched in at {$this->attendance->punch_in->format('h:i A')}";

        return [
            'title' => $title,
            'body' => $body,
            'icon' => '/images/icons/attendance.png',
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
            return $notifiable->prefersNotificationChannel($channel, 'attendance.punched_in');
        }

        return true;
    }
}
