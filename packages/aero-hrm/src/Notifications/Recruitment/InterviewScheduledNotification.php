<?php

namespace Aero\HRM\Notifications\Recruitment;

use Aero\HRM\Models\JobInterview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class InterviewScheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public JobInterview $interview
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
        $application = $this->interview->application;
        $jobTitle = $application->job?->title ?? 'Position';

        $message = (new MailMessage)
            ->subject('Interview Scheduled - '.$jobTitle)
            ->greeting("Dear {$application->name},")
            ->line('Good news! We would like to schedule an interview with you.')
            ->line("Position: {$jobTitle}")
            ->line("Interview Date & Time: {$this->interview->scheduled_at->format('l, M d, Y \\a\\t h:i A')}")
            ->line('Interview Type: '.ucfirst($this->interview->type ?? 'In-person'));

        if ($this->interview->location) {
            $message->line("Location: {$this->interview->location}");
        }

        if ($this->interview->meeting_link) {
            $message->line("Meeting Link: {$this->interview->meeting_link}");
        }

        if ($this->interview->notes) {
            $message->line("Additional Notes: {$this->interview->notes}");
        }

        return $message
            ->line('Please confirm your availability at your earliest convenience.')
            ->line('If you have any questions, please don\'t hesitate to contact us.')
            ->salutation('Best regards, Recruitment Team');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'recruitment.interview_scheduled',
            'interview_id' => $this->interview->id,
            'application_id' => $this->interview->application_id,
            'job_title' => $this->interview->application->job?->title,
            'scheduled_at' => $this->interview->scheduled_at->toIso8601String(),
            'interview_type' => $this->interview->type,
            'location' => $this->interview->location,
            'meeting_link' => $this->interview->meeting_link,
            'message' => "Interview scheduled for {$this->interview->scheduled_at->format('M d, Y \\a\\t h:i A')}",
            'action_url' => route('recruitment.interviews.show', $this->interview->id),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'title' => '📅 Interview Scheduled',
            'body' => "Interview on {$this->interview->scheduled_at->format('M d \\a\\t h:i A')}",
            'icon' => '/images/icons/interview.png',
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
            return $notifiable->prefersNotificationChannel($channel, 'recruitment.interview_scheduled');
        }

        return true;
    }
}
