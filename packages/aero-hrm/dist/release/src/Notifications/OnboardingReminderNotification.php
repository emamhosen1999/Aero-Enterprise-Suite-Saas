<?php

namespace Aero\Hrm\Notifications;

use Aero\Hrm\Models\Onboarding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OnboardingReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Onboarding $onboarding;
    protected int $progress;

    /**
     * Create a new notification instance.
     */
    public function __construct(Onboarding $onboarding, int $progress)
    {
        $this->onboarding = $onboarding;
        $this->progress = $progress;
    }

    /**
     * Get the notification's delivery channels.
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
        $daysElapsed = now()->diffInDays($this->onboarding->created_at);
        $pendingTasks = $this->onboarding->tasks->where('is_completed', false)->count();

        return (new MailMessage)
            ->subject('Reminder: Complete Your Onboarding')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a friendly reminder to complete your onboarding process.')
            ->line('Your onboarding progress: **' . $this->progress . '%** complete')
            ->line('You have **' . $pendingTasks . '** pending task(s) to complete.')
            ->line('Days since onboarding started: **' . $daysElapsed . '** days')
            ->action('Complete Onboarding', route('hrm.onboarding.show', $this->onboarding->id))
            ->line('Completing your onboarding helps you get started more quickly and ensures you have all the information you need.')
            ->salutation('Best regards, ' . config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'onboarding_id' => $this->onboarding->id,
            'progress' => $this->progress,
            'message' => 'Reminder to complete your onboarding process.',
        ];
    }
}
