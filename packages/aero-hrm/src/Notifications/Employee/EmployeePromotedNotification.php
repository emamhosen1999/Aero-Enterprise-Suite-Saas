<?php

namespace Aero\HRM\Notifications\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class EmployeePromotedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Employee $employee,
        public ?int $oldDesignationId = null,
        public ?int $newDesignationId = null,
        public ?int $oldDepartmentId = null,
        public ?int $newDepartmentId = null,
        public ?float $oldSalary = null,
        public ?float $newSalary = null,
        public ?string $reason = null
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
            ->subject('🎉 Congratulations on Your Promotion!')
            ->greeting("Congratulations {$this->employee->full_name}!")
            ->line('We are pleased to inform you about your promotion.');

        if ($this->oldDesignationId !== $this->newDesignationId) {
            $oldDesignation = $this->employee->designation()->find($this->oldDesignationId)?->title ?? 'Previous';
            $newDesignation = $this->employee->designation?->title ?? 'New';
            $message->line("New Designation: {$oldDesignation} → {$newDesignation}");
        }

        if ($this->oldDepartmentId !== $this->newDepartmentId) {
            $oldDepartment = $this->employee->department()->find($this->oldDepartmentId)?->name ?? 'Previous';
            $newDepartment = $this->employee->department?->name ?? 'New';
            $message->line("New Department: {$oldDepartment} → {$newDepartment}");
        }

        if ($this->oldSalary && $this->newSalary && $this->newSalary > $this->oldSalary) {
            $increase = $this->newSalary - $this->oldSalary;
            $percentage = round(($increase / $this->oldSalary) * 100, 2);
            $message->line("Salary Increase: {$percentage}%");
        }

        if ($this->reason) {
            $message->line("Reason: {$this->reason}");
        }

        return $message
            ->action('View Details', route('employees.show', $this->employee->id))
            ->line('Keep up the excellent work!')
            ->salutation('Best regards, Management Team');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'employee.promoted',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->full_name,
            'old_designation_id' => $this->oldDesignationId,
            'new_designation_id' => $this->newDesignationId,
            'old_department_id' => $this->oldDepartmentId,
            'new_department_id' => $this->newDepartmentId,
            'old_salary' => $this->oldSalary,
            'new_salary' => $this->newSalary,
            'reason' => $this->reason,
            'message' => "Congratulations! {$this->employee->full_name} has been promoted.",
            'action_url' => route('employees.show', $this->employee->id),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'title' => '🎉 Promotion Notification',
            'body' => "Congratulations on your promotion, {$this->employee->full_name}!",
            'icon' => '/images/icons/promotion.png',
            'data' => $this->toArray($notifiable),
        ];
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
            return $notifiable->prefersNotificationChannel($channel, 'employee.promoted');
        }

        return true;
    }
}
