<?php

namespace App\Notifications;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * TenantProvisioningFailed Notification
 *
 * Notifies the tenant admin when their workspace provisioning has failed.
 * Provides support contact information and next steps.
 */
class TenantProvisioningFailed extends Notification implements ShouldQueue
{
    use Queueable;

    public Tenant $tenant;
    public string $errorMessage;

    /**
     * Create a new notification instance.
     */
    public function __construct(Tenant $tenant, string $errorMessage = '')
    {
        $this->tenant = $tenant;
        $this->errorMessage = $errorMessage;
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
        $supportUrl = config('app.url').'/support';
        $retryUrl = config('app.url').'/register';

        return (new MailMessage)
            ->error()
            ->subject("⚠️ Workspace Setup Issue - {$this->tenant->name}")
            ->greeting("Hello,")
            ->line("We encountered an issue while setting up your workspace: **{$this->tenant->name}**")
            ->line("Our team has been automatically notified and is investigating the issue.")
            ->line("**What happens next?**")
            ->line("• Our technical team will review the error")
            ->line("• We'll attempt to resolve the issue automatically")
            ->line("• You'll receive an update within 1 business hour")
            ->line("**Need immediate assistance?**")
            ->action('Contact Support', $supportUrl)
            ->line("You can also try creating a new workspace:")
            ->action('Try Again', $retryUrl)
            ->line("We apologize for the inconvenience and appreciate your patience.")
            ->salutation("Best regards,\nThe EOS365 Support Team");
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
            'error' => $this->errorMessage,
        ];
    }
}
