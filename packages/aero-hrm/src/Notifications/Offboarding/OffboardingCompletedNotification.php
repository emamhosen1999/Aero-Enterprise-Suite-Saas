<?php

namespace Aero\HRM\Notifications\Offboarding;

use Aero\HRM\Models\Offboarding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

/**
 * Notification sent when an employee's offboarding process is completed.
 */
class OffboardingCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Offboarding $offboarding,
        public array $metadata = []
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        $channels = ['database'];

        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $employeeName = $this->offboarding->employee?->full_name
            ?? $this->offboarding->employee?->user?->name
            ?? 'Employee';

        $name = method_exists($notifiable, 'getName')
            ? $notifiable->getName()
            : $notifiable->name;

        return (new MailMessage)
            ->subject('Offboarding Completed - ' . $employeeName)
            ->greeting("Hello {$name},")
            ->line("The offboarding process for {$employeeName} has been completed.")
            ->line("Last Working Date: {$this->offboarding->last_working_date?->format('F j, Y')}")
            ->line("Exit Reason: {$this->offboarding->reason}")
            ->line('All exit tasks have been marked as complete:')
            ->line('✓ Asset returns processed')
            ->line('✓ System access revoked')
            ->line('✓ Final settlement prepared')
            ->action('View Details', $this->getOffboardingUrl())
            ->salutation('Regards, HR Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'offboarding.completed',
            'offboarding_id' => $this->offboarding->id,
            'employee_id' => $this->offboarding->employee_id,
            'employee_name' => $this->offboarding->employee?->full_name
                ?? $this->offboarding->employee?->user?->name,
            'reason' => $this->offboarding->reason,
            'last_working_date' => $this->offboarding->last_working_date?->toIso8601String(),
            'completed_at' => now()->toIso8601String(),
            'message' => 'Offboarding process has been completed.',
            'action_url' => $this->getOffboardingUrl(),
            'metadata' => $this->metadata,
        ];
    }

    /**
     * Get URL to view offboarding details.
     */
    protected function getOffboardingUrl(): string
    {
        try {
            return route('hrm.offboarding.show', $this->offboarding->id);
        } catch (\Exception $e) {
            return url('/hrm/offboarding/' . $this->offboarding->id);
        }
    }

    /**
     * Check if a channel is enabled for this notification.
     */
    protected function isChannelEnabled(string $channel, $notifiable): bool
    {
        try {
            $globalEnabled = DB::table('notification_settings')
                ->where('key', "channels.{$channel}.enabled")
                ->value('value');

            if (! json_decode($globalEnabled ?? 'true')) {
                return false;
            }
        } catch (\Exception $e) {
            // Table might not exist yet
        }

        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel);
        }

        return true;
    }
}
