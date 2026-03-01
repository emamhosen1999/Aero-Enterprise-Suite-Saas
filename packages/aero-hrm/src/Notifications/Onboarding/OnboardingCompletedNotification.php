<?php

namespace Aero\HRM\Notifications\Onboarding;

use Aero\HRM\Models\Onboarding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class OnboardingCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Onboarding $onboarding,
        public int $daysTaken
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
        $employee = $this->onboarding->employee;

        return (new MailMessage)
            ->subject('Congratulations! Onboarding Complete')
            ->greeting("Congratulations {$employee->full_name}!")
            ->line('You have successfully completed your onboarding process!')
            ->line("Completion Date: {$this->onboarding->completion_date->format('M d, Y')}")
            ->line("Time Taken: {$this->daysTaken} days")
            ->line('You now have full access to all systems and resources.')
            ->line('Keep up the great work and feel free to reach out if you need anything.')
            ->action('View Profile', route('employees.show', $employee->id))
            ->salutation('Best regards, HR Team');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'onboarding.completed',
            'onboarding_id' => $this->onboarding->id,
            'employee_id' => $this->onboarding->employee_id,
            'employee_name' => $this->onboarding->employee->full_name,
            'completion_date' => $this->onboarding->completion_date->toDateString(),
            'days_taken' => $this->daysTaken,
            'message' => '🎉 Congratulations! Your onboarding is complete.',
            'action_url' => route('employees.show', $this->onboarding->employee_id),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'title' => '🎉 Onboarding Complete!',
            'body' => "You've successfully completed your onboarding in {$this->daysTaken} days",
            'icon' => '/images/icons/success.png',
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
            return $notifiable->prefersNotificationChannel($channel, 'onboarding.completed');
        }

        return true;
    }
}
