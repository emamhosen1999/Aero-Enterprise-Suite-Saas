<?php

namespace Aero\HRM\Notifications\Safety;

use Aero\HRM\Models\SafetyIncident;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class SafetyIncidentReportedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public SafetyIncident $incident,
        public bool $requiresImmediateAction = false
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];
        
        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }
        
        // Always use push for high-severity incidents
        if ($this->requiresImmediateAction) {
            $channels[] = 'broadcast';
        } elseif ($this->isChannelEnabled('push', $notifiable)) {
            $channels[] = 'broadcast';
        }
        
        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        $severityLabel = strtoupper($this->incident->severity);
        $urgentFlag = $this->requiresImmediateAction ? ' [URGENT]' : '';
        
        $message = (new MailMessage)
            ->subject("Safety Incident Reported - {$severityLabel}{$urgentFlag}")
            ->greeting("Safety Alert!")
            ->line("A safety incident has been reported with {$severityLabel} severity.")
            ->line("Incident Type: {$this->incident->incident_type}")
            ->line("Reported Date: {$this->incident->incident_date->format('M d, Y \\a\\t h:i A')}")
            ->line("Location: {$this->incident->location}");

        if ($this->incident->description) {
            $message->line("Description: " . substr($this->incident->description, 0, 200));
        }

        if ($this->requiresImmediateAction) {
            $message->line('⚠️ IMMEDIATE ACTION REQUIRED: This is a high/critical severity incident.');
        }

        return $message
            ->action('View Incident Details', route('safety.incidents.show', $this->incident->id))
            ->line('Please review and take appropriate action.')
            ->salutation('Safety Department');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'safety.incident_reported',
            'incident_id' => $this->incident->id,
            'incident_type' => $this->incident->incident_type,
            'severity' => $this->incident->severity,
            'incident_date' => $this->incident->incident_date->toIso8601String(),
            'location' => $this->incident->location,
            'requires_immediate_action' => $this->requiresImmediateAction,
            'reported_by' => $this->incident->reported_by,
            'message' => $this->requiresImmediateAction 
                ? "⚠️ URGENT: {$this->incident->incident_type} - {$this->incident->severity} severity"
                : "Safety incident reported: {$this->incident->incident_type}",
            'action_url' => route('safety.incidents.show', $this->incident->id),
            'priority' => $this->requiresImmediateAction ? 'urgent' : 'normal',
        ];
    }

    public function toBroadcast($notifiable): array
    {
        $icon = $this->requiresImmediateAction ? '🚨' : '⚠️';
        
        return [
            'title' => "{$icon} Safety Incident",
            'body' => "{$this->incident->incident_type} - {$this->incident->severity} severity",
            'icon' => '/images/icons/safety-alert.png',
            'requireInteraction' => $this->requiresImmediateAction,
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
            return $notifiable->prefersNotificationChannel($channel, 'safety.incident_reported');
        }
        
        return true;
    }
}
