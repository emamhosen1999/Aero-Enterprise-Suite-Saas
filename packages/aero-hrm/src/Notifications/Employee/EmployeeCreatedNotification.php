<?php

namespace Aero\HRM\Notifications\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class EmployeeCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Employee $employee,
        public array $metadata = []
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];
        
        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }
        
        if ($this->isChannelEnabled('sms', $notifiable)) {
            $channels[] = 'sms';
        }
        
        if ($this->isChannelEnabled('push', $notifiable)) {
            $channels[] = 'broadcast';
        }
        
        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        $name = method_exists($notifiable, 'getName') 
            ? $notifiable->getName() 
            : $notifiable->name;

        $profileUrl = $this->getProfileUrl();

        $mail = (new MailMessage)
            ->subject('Welcome to ' . config('app.name'))
            ->greeting("Hello {$name}!")
            ->line('Welcome to the team! Your employee account has been created.')
            ->line("Employee ID: {$this->employee->employee_id}")
            ->line("Department: {$this->employee->department?->name}")
            ->line("Designation: {$this->employee->designation?->title}");

        if ($profileUrl) {
            $mail->action('View Profile', $profileUrl);
        }

        return $mail
            ->line('If you have any questions, please contact HR.')
            ->salutation('Best regards, HR Team');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'employee.created',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->full_name,
            'employee_code' => $this->employee->employee_id,
            'department' => $this->employee->department?->name,
            'designation' => $this->employee->designation?->title,
            'message' => "Welcome! Your employee account has been created.",
            'action_url' => $this->getProfileUrl(),
            'metadata' => $this->metadata,
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'title' => 'Welcome to ' . config('app.name'),
            'body' => "Your employee account has been created. Employee ID: {$this->employee->employee_id}",
            'icon' => '/images/icons/employee.png',
            'data' => $this->toArray($notifiable),
        ];
    }

    protected function getProfileUrl(): ?string
    {
        try {
            // Try multiple route name patterns
            foreach (['employees.show', 'hrm.employees.show', 'employee.show'] as $routeName) {
                if (\Route::has($routeName)) {
                    return route($routeName, $this->employee->id);
                }
            }
            return url('/employees/' . $this->employee->id);
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function isChannelEnabled(string $channel, $notifiable): bool
    {
        // Check global settings
        $globalSetting = DB::table('notification_settings')
            ->where('key', "channels.{$channel}.enabled")
            ->first();
        
        if (!$globalSetting || !json_decode($globalSetting->value)) {
            return false;
        }
        
        // Check user preferences
        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel, 'employee.created');
        }
        
        // Check via relationship if available
        if (method_exists($notifiable, 'hasRelationship') && $notifiable->hasRelationship('notificationPreferences')) {
            $preference = $notifiable->getRelationship('notificationPreferences')
                ->where('event_type', 'employee.created')
                ->where('channel', $channel)
                ->first();
            
            if ($preference) {
                return $preference->enabled;
            }
        }
        
        return true; // Default to enabled if no preference found
    }
}
