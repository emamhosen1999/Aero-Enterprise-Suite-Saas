<?php

namespace App\Notifications;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * WelcomeToTenant Notification
 *
 * Sends a welcome email to the tenant admin after successful provisioning.
 * Includes login link, getting started tips, and support information.
 */
class WelcomeToTenant extends Notification implements ShouldQueue
{
    use Queueable;

    public Tenant $tenant;

    /**
     * Create a new notification instance.
     */
    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $domain = $this->tenant->domains()->where('is_primary', true)->first();
        $loginUrl = $domain ? "https://{$domain->domain}/login" : '#';
        $trialDays = $this->tenant->trial_ends_at 
            ? now()->diffInDays($this->tenant->trial_ends_at) 
            : config('platform.trial_days', 14);

        return (new MailMessage)
            ->subject("🎉 Welcome to {$this->tenant->name}!")
            ->greeting("Welcome to {$this->tenant->name}!")
            ->line("Your workspace has been successfully set up and is ready to use.")
            ->line("**Your Details:**")
            ->line("• Organization: {$this->tenant->name}")
            ->line("• Email: {$notifiable->email}")
            ->line("• Workspace URL: {$loginUrl}")
            ->line("• Trial Period: {$trialDays} days")
            ->action('Login to Your Workspace', $loginUrl)
            ->line('**Getting Started:**')
            ->line('1. Complete your email verification')
            ->line('2. Set up your company profile')
            ->line('3. Invite your team members')
            ->line('4. Configure your modules and permissions')
            ->line('**Need Help?**')
            ->line('Our support team is here to help you get started.')
            ->line('Visit our documentation or contact support@eos365.com')
            ->salutation("Best regards,\nThe EOS365 Team");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
        ];
    }
}
