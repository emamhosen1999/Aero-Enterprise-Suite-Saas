<?php

namespace Aero\HRM\Notifications\Employee;

use Aero\HRM\Models\Employee;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class EmployeeResignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Employee $employee,
        public Carbon $resignationDate,
        public Carbon $lastWorkingDate,
        public ?string $reason = null,
        public ?int $noticePeriodDays = null
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
            ->subject('Resignation Notice - ' . $this->employee->full_name)
            ->greeting("Dear HR Team,")
            ->line("{$this->employee->full_name} has submitted a resignation.")
            ->line("Employee ID: {$this->employee->employee_id}")
            ->line("Department: {$this->employee->department?->name}")
            ->line("Resignation Date: {$this->resignationDate->format('M d, Y')}")
            ->line("Last Working Day: {$this->lastWorkingDate->format('M d, Y')}");

        if ($this->noticePeriodDays) {
            $message->line("Notice Period: {$this->noticePeriodDays} days");
        }

        if ($this->reason) {
            $message->line("Reason: {$this->reason}");
        }

        return $message
            ->action('Initiate Offboarding', route('offboarding.index'))
            ->line('Please initiate the offboarding process.')
            ->salutation('System Notification');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'employee.resigned',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->full_name,
            'employee_code' => $this->employee->employee_id,
            'resignation_date' => $this->resignationDate->toDateString(),
            'last_working_date' => $this->lastWorkingDate->toDateString(),
            'notice_period_days' => $this->noticePeriodDays,
            'reason' => $this->reason,
            'message' => "{$this->employee->full_name} has resigned. Last working day: {$this->lastWorkingDate->format('M d, Y')}",
            'action_url' => route('offboarding.index'),
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
            return $notifiable->prefersNotificationChannel($channel, 'employee.resigned');
        }
        
        return true;
    }
}
