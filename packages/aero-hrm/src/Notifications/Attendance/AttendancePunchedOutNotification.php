<?php

namespace Aero\HRM\Notifications\Attendance;

use Aero\HRM\Models\Attendance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class AttendancePunchedOutNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Attendance $attendance,
        public bool $isEarly = false,
        public bool $hasOvertime = false,
        public int $totalMinutes = 0,
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
        $hours = floor($this->totalMinutes / 60);
        $minutes = $this->totalMinutes % 60;
        $duration = "{$hours}h {$minutes}m";

        $message = "✓ Punched out at {$this->attendance->punch_out->format('h:i A')}";
        if ($this->hasOvertime) {
            $message .= " (Overtime detected)";
        } elseif ($this->isEarly) {
            $message .= " (Early departure)";
        }

        return [
            'type' => 'attendance.punched_out',
            'attendance_id' => $this->attendance->id,
            'punch_out_time' => $this->attendance->punch_out->toIso8601String(),
            'total_duration' => $duration,
            'total_minutes' => $this->totalMinutes,
            'is_early' => $this->isEarly,
            'has_overtime' => $this->hasOvertime,
            'location' => $this->location,
            'message' => $message,
            'action_url' => route('attendance.show', $this->attendance->id),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        $hours = floor($this->totalMinutes / 60);
        $minutes = $this->totalMinutes % 60;
        
        $body = "Punched out at {$this->attendance->punch_out->format('h:i A')}. Total: {$hours}h {$minutes}m";

        return [
            'title' => 'Punch-Out Confirmed',
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
        
        if (!$globalSetting || !json_decode($globalSetting->value)) {
            return false;
        }
        
        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel, 'attendance.punched_out');
        }
        
        return true;
    }
}
