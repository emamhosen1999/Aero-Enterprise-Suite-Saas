<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Onboarding;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Reminder notification sent to employees with pending onboarding tasks.
 *
 * Recipients: The employee undergoing onboarding
 */
class OnboardingReminderNotification extends BaseHrmNotification
{
    protected string $eventType = 'onboarding_reminder';

    public function __construct(
        protected Onboarding $onboarding,
        protected int $progress
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $daysElapsed = now()->diffInDays($this->onboarding->created_at);
        $pendingTasks = $this->onboarding->tasks?->where('is_completed', false)->count() ?? 0;

        return (new MailMessage)
            ->subject('Reminder: Complete Your Onboarding')
            ->greeting("Hello {$notifiable->name},")
            ->line('This is a friendly reminder to complete your onboarding process.')
            ->line("Your onboarding progress: **{$this->progress}%** complete")
            ->line("You have **{$pendingTasks}** pending task(s) to complete.")
            ->line("Days since onboarding started: **{$daysElapsed}** days")
            ->action('Complete Onboarding', url("/hrm/onboarding/{$this->onboarding->id}"))
            ->line('Completing your onboarding helps you get started more quickly and ensures you have all the information you need.')
            ->salutation('Best regards, '.config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $pendingTasks = $this->onboarding->tasks?->where('is_completed', false)->count() ?? 0;

        return [
            'type' => 'onboarding_reminder',
            'onboarding_id' => $this->onboarding->id,
            'employee_id' => $this->onboarding->employee_id,
            'progress' => $this->progress,
            'pending_tasks' => $pendingTasks,
            'message' => "Reminder to complete your onboarding process. Progress: {$this->progress}%",
            'action_url' => "/hrm/onboarding/{$this->onboarding->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '📋 Onboarding Reminder';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $pendingTasks = $this->onboarding->tasks?->where('is_completed', false)->count() ?? 0;

        return "You have {$pendingTasks} pending onboarding tasks. Progress: {$this->progress}%";
    }
}
