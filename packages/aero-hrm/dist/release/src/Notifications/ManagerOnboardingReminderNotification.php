<?php

namespace Aero\Hrm\Notifications;

use Aero\Hrm\Models\Onboarding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ManagerOnboardingReminderNotification extends Notification implements ShouldQueue
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
        $employeeName = $this->onboarding->employee->user->name ?? 'Employee';
        $daysElapsed = now()->diffInDays($this->onboarding->created_at);

        return (new MailMessage)
            ->subject('Onboarding Status: ' . $employeeName)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a reminder about a pending employee onboarding.')
            ->line('**Employee:** ' . $employeeName)
            ->line('**Onboarding Progress:** ' . $this->progress . '%')
            ->line('**Days Elapsed:** ' . $daysElapsed . ' days')
            ->line('The employee has not yet completed their onboarding process. You may want to follow up with them.')
            ->action('View Onboarding', route('hrm.onboarding.show', $this->onboarding->id))
            ->line('Thank you for helping new team members get onboarded successfully.')
            ->salutation('Best regards, ' . config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'onboarding_id' => $this->onboarding->id,
            'employee_id' => $this->onboarding->employee_id,
            'progress' => $this->progress,
            'message' => 'Employee onboarding pending completion.',
        ];
    }
}
