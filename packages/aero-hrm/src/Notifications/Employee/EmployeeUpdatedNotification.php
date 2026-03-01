<?php

namespace Aero\HRM\Notifications\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class EmployeeUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Employee $employee,
        public array $changes = []
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];

        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Employee Profile Updated')
            ->greeting("Hello {$notifiable->name}!")
            ->line("Employee profile for {$this->employee->full_name} has been updated.");

        if (! empty($this->changes)) {
            $message->line('The following changes were made:');
            foreach ($this->changes as $field => $change) {
                $message->line("• {$this->formatFieldName($field)}: {$change['old']} → {$change['new']}");
            }
        }

        return $message
            ->action('View Profile', route('employees.show', $this->employee->id))
            ->line('If you have questions, contact HR.')
            ->salutation('Best regards, HR Team');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'employee.updated',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->full_name,
            'changes' => $this->changes,
            'message' => 'Employee profile updated with '.count($this->changes).' changes.',
            'action_url' => route('employees.show', $this->employee->id),
        ];
    }

    protected function formatFieldName(string $field): string
    {
        return ucwords(str_replace('_', ' ', $field));
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
            return $notifiable->prefersNotificationChannel($channel, 'employee.updated');
        }

        return true;
    }
}
