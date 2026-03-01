<?php

namespace Aero\HRM\Notifications\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

/**
 * Notification sent when an employee is terminated.
 */
class EmployeeTerminatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Employee $employee,
        public string $reason,
        public bool $immediate = false,
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
        $name = method_exists($notifiable, 'getName')
            ? $notifiable->getName()
            : $notifiable->name;

        $mail = (new MailMessage)
            ->subject('Employment Termination Notice - '.config('app.name'))
            ->greeting("Dear {$name},")
            ->line('This is to inform you that your employment has been terminated.')
            ->line("Termination Reason: {$this->reason}");

        if ($this->immediate) {
            $mail->line('This termination is effective immediately.');
        } else {
            $lastWorkingDate = $this->metadata['last_working_date'] ?? now()->addDays(30)->format('Y-m-d');
            $mail->line("Your last working date is: {$lastWorkingDate}");
        }

        $mail->line('Please contact HR for final settlement and exit procedures.')
            ->line('We wish you the best in your future endeavors.')
            ->salutation('Regards, HR Team');

        return $mail;
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'employee.terminated',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->full_name ?? $this->employee->user?->name,
            'employee_code' => $this->employee->employee_id,
            'reason' => $this->reason,
            'immediate' => $this->immediate,
            'message' => 'Your employment has been terminated.',
            'metadata' => $this->metadata,
        ];
    }

    /**
     * Check if a channel is enabled for this notification.
     */
    protected function isChannelEnabled(string $channel, $notifiable): bool
    {
        // Check global setting
        try {
            $globalEnabled = DB::table('notification_settings')
                ->where('key', "channels.{$channel}.enabled")
                ->value('value');

            if (! json_decode($globalEnabled ?? 'true')) {
                return false;
            }
        } catch (\Exception $e) {
            // Table might not exist yet, default to enabled
        }

        // Check user preference
        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel);
        }

        return true;
    }
}
