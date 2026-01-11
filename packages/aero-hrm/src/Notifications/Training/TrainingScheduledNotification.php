<?php

namespace Aero\HRM\Notifications\Training;

use Aero\HRM\Models\Training;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class TrainingScheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Training $training,
        public array $enrolledEmployeeIds = []
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];
        
        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }
        
        if ($this->isChannelEnabled('push', $notifiable)) {
            $channels[] = 'broadcast';
        }
        
        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Training Scheduled - ' . $this->training->title)
            ->greeting("Hello {$notifiable->name}!")
            ->line('You have been enrolled in a new training program.')
            ->line("Training: {$this->training->title}");

        if ($this->training->description) {
            $message->line("Description: {$this->training->description}");
        }

        $message->line("Start Date: {$this->training->start_date->format('M d, Y')}")
            ->line("End Date: {$this->training->end_date->format('M d, Y')}")
            ->line("Duration: {$this->training->duration} hours");

        if ($this->training->location) {
            $message->line("Location: {$this->training->location}");
        }

        if ($this->training->trainer) {
            $message->line("Trainer: {$this->training->trainer}");
        }

        return $message
            ->action('View Training Details', route('trainings.show', $this->training->id))
            ->line('Please ensure you attend all sessions.')
            ->salutation('Training Department');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'training.scheduled',
            'training_id' => $this->training->id,
            'training_title' => $this->training->title,
            'start_date' => $this->training->start_date->toDateString(),
            'end_date' => $this->training->end_date->toDateString(),
            'duration' => $this->training->duration,
            'location' => $this->training->location,
            'trainer' => $this->training->trainer,
            'enrolled_count' => count($this->enrolledEmployeeIds),
            'message' => "You're enrolled in: {$this->training->title}",
            'action_url' => route('trainings.show', $this->training->id),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'title' => '📚 Training Scheduled',
            'body' => "{$this->training->title} - Starting {$this->training->start_date->format('M d, Y')}",
            'icon' => '/images/icons/training.png',
            'data' => $this->toArray($notifiable),
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
            return $notifiable->prefersNotificationChannel($channel, 'training.scheduled');
        }
        
        return true;
    }
}
