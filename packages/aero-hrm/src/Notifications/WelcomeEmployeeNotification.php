<?php

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Onboarding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Welcome Employee Notification
 *
 * Sent automatically when a user is onboarded as an employee.
 * Provides employee code, department info, and link to onboarding wizard.
 */
class WelcomeEmployeeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Employee $employee;

    protected Onboarding $onboarding;

    /**
     * Create a new notification instance.
     */
    public function __construct(Employee $employee, Onboarding $onboarding)
    {
        $this->employee = $employee;
        $this->onboarding = $onboarding;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $companyName = config('app.name', 'Our Company');
        $employeeName = $notifiable->name;
        $employeeCode = $this->employee->employee_code;
        $departmentName = $this->employee->department?->name ?? 'your department';
        $designationName = $this->employee->designation?->title ?? 'your position';

        $onboardingUrl = route('hrm.onboarding.wizard', $this->employee->id);

        return (new MailMessage)
            ->subject("Welcome to {$companyName}!")
            ->greeting("Welcome aboard, {$employeeName}!")
            ->line("We're excited to have you join our team as a {$designationName} in {$departmentName}.")
            ->line("Your employee onboarding has been initiated. Here are your details:")
            ->line("**Employee Code:** {$employeeCode}")
            ->line("**Department:** {$departmentName}")
            ->line("**Designation:** {$designationName}")
            ->line("**Start Date:** {$this->employee->date_of_joining->format('F d, Y')}")
            ->line('To complete your profile and onboarding process, please click the button below:')
            ->action('Complete Your Onboarding', $onboardingUrl)
            ->line('The onboarding wizard will guide you through completing your personal information, uploading documents, and reviewing important policies.')
            ->line("Please complete your onboarding within **{$this->onboarding->expected_completion_date->diffInDays(now())} days**.")
            ->line('If you have any questions, feel free to reach out to your manager or the HR department.')
            ->line('We look forward to working with you!');
    }

    /**
     * Get the array representation of the notification (for database storage).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'employee_welcome',
            'employee_id' => $this->employee->id,
            'employee_code' => $this->employee->employee_code,
            'onboarding_id' => $this->onboarding->id,
            'department' => $this->employee->department?->name,
            'designation' => $this->employee->designation?->title,
            'message' => "Welcome! Your employee onboarding has been initiated. Please complete your profile.",
            'action_url' => route('hrm.onboarding.wizard', $this->employee->id),
        ];
    }
}
