<?php

namespace Aero\HRM\Notifications\Offboarding;

use Aero\HRM\Models\Offboarding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class OffboardingStartedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Offboarding $offboarding,
        public string $reason
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
        $employee = $this->offboarding->employee;
        
        $message = (new MailMessage)
            ->subject('Offboarding Process Initiated')
            ->greeting("Dear {$employee->full_name},")
            ->line('Your offboarding process has been initiated.')
            ->line("Reason: {$this->reason}")
            ->line("Last Working Day: {$this->offboarding->last_working_day->format('M d, Y')}");

        if ($this->reason === 'resignation') {
            $message->line('Thank you for your service. We wish you all the best in your future endeavors.');
        }

        return $message
            ->line('Please complete all exit formalities before your last working day.')
            ->action('View Offboarding Tasks', route('offboarding.show', $this->offboarding->id))
            ->salutation('HR Department');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'offboarding.started',
            'offboarding_id' => $this->offboarding->id,
            'employee_id' => $this->offboarding->employee_id,
            'employee_name' => $this->offboarding->employee->full_name,
            'reason' => $this->reason,
            'last_working_day' => $this->offboarding->last_working_day->toDateString(),
            'message' => 'Offboarding process has been initiated.',
            'action_url' => route('offboarding.show', $this->offboarding->id),
        ];
    }

    protected function isChannelEnabled(string $channel, $notifiable): bool
    {
        $globalSetting = DB::table('notification_settings')
            ->where('key', "channels.{$channel}.enabled")
            ->first();
        
        if (!$globalSetting || !json_decode($globalSetting->value)) {
            return false;
        }
        
        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel, 'offboarding.started');
        }
        
        return true;
    }
}
