<?php

namespace Aero\HRM\Notifications\Onboarding;

use Aero\HRM\Models\Onboarding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class OnboardingStartedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Onboarding $onboarding
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
            ->subject('Welcome! Your Onboarding Journey Begins')
            ->greeting("Hello {$employee->full_name}!")
            ->line('Welcome aboard! Your onboarding process has been initiated.')
            ->line("Start Date: {$this->onboarding->start_date->format('M d, Y')}")
            ->line("Expected Completion: {$this->onboarding->expected_completion_date->format('M d, Y')}")
            ->line('You will receive tasks and information to help you get started.')
            ->action('View Onboarding Tasks', route('onboarding.show', $this->onboarding->id))
            ->line('If you have any questions, feel free to reach out to HR.')
            ->salutation('Welcome to the team!');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'onboarding.started',
            'onboarding_id' => $this->onboarding->id,
            'employee_id' => $this->onboarding->employee_id,
            'employee_name' => $this->onboarding->employee->full_name,
            'start_date' => $this->onboarding->start_date->toDateString(),
            'expected_completion' => $this->onboarding->expected_completion_date->toDateString(),
            'message' => 'Your onboarding process has started. Welcome aboard!',
            'action_url' => route('onboarding.show', $this->onboarding->id),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'title' => '🎉 Welcome Aboard!',
            'body' => 'Your onboarding journey begins today',
            'icon' => '/images/icons/onboarding.png',
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
            return $notifiable->prefersNotificationChannel($channel, 'onboarding.started');
        }

        return true;
    }
}
