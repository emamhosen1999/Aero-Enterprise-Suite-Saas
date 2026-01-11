<?php

namespace Aero\HRM\Notifications\Recruitment;

use Aero\HRM\Models\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class ApplicationReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public JobApplication $application
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];
        
        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }
        
        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        $jobTitle = $this->application->job?->title ?? 'Position';
        
        return (new MailMessage)
            ->subject('Application Received - ' . $jobTitle)
            ->greeting("Dear {$this->application->name},")
            ->line('Thank you for applying to ' . config('app.name') . '!')
            ->line("Position: {$jobTitle}")
            ->line('We have received your application and our recruitment team will review it shortly.')
            ->line('If your profile matches our requirements, we will contact you for the next steps.')
            ->line('Application Reference: ' . $this->application->application_number)
            ->line('Thank you for your interest in joining our team!')
            ->salutation('Best regards, Recruitment Team');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'recruitment.application_received',
            'application_id' => $this->application->id,
            'application_number' => $this->application->application_number,
            'job_id' => $this->application->job_id,
            'job_title' => $this->application->job?->title,
            'applicant_name' => $this->application->name,
            'applicant_email' => $this->application->email,
            'message' => "Application received for {$this->application->job?->title}",
            'action_url' => route('recruitment.applications.show', $this->application->id),
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
            return $notifiable->prefersNotificationChannel($channel, 'recruitment.application_received');
        }
        
        return true;
    }
}
