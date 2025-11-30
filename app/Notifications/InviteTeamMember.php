<?php

namespace App\Notifications;

use App\Models\TenantInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

/**
 * InviteTeamMember Notification
 *
 * Sends an invitation email to a prospective team member with a secure,
 * signed URL for accepting the invitation.
 */
class InviteTeamMember extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public TenantInvitation $invitation
    ) {}

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
        $inviterName = $this->invitation->inviter?->name ?? 'The team administrator';
        $roleName = $this->invitation->role;
        $expiresAt = $this->invitation->expires_at;

        // Generate a signed URL that expires with the invitation
        $acceptUrl = URL::temporarySignedRoute(
            'team.invitation.accept',
            $expiresAt,
            ['token' => $this->invitation->token]
        );

        // Get organization name from config or app name
        $organizationName = config('app.name', 'Our Organization');

        return (new MailMessage)
            ->subject("You've Been Invited to Join {$organizationName}")
            ->greeting('Hello!')
            ->line("{$inviterName} has invited you to join **{$organizationName}** as a **{$roleName}**.")
            ->line('Click the button below to accept the invitation and create your account.')
            ->action('Accept Invitation', $acceptUrl)
            ->line("This invitation will expire on {$expiresAt->format('F j, Y \\a\\t g:i A')}.")
            ->line('If you did not expect this invitation, you can safely ignore this email.')
            ->salutation('Welcome to the team!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'invitation_id' => $this->invitation->id,
            'email' => $this->invitation->email,
            'role' => $this->invitation->role,
            'invited_by' => $this->invitation->invited_by,
            'expires_at' => $this->invitation->expires_at?->toISOString(),
        ];
    }
}
