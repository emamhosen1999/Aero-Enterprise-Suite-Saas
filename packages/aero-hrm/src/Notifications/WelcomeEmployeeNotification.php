<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeEmployeeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $employee;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $employee)
    {
        $this->employee = $employee;
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
        return (new MailMessage)
            ->subject('Welcome to '.config('app.name').' - New Employee Onboarding')
            ->greeting('Welcome, '.$this->employee->name.'!')
            ->line('We are excited to have you join our team at '.config('app.name').'.')
            ->line('Your employee account has been created successfully.')
            ->line('**Employee Details:**')
            ->line('Name: '.$this->employee->name)
            ->line('Email: '.$this->employee->email)
            ->line('Employee ID: '.$this->employee->employee_id)
            ->action('Access Your Dashboard', url('/dashboard'))
            ->line('Please complete your profile and review our onboarding materials.')
            ->line('If you have any questions, feel free to reach out to the HR team.')
            ->line('Welcome aboard!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->name,
            'employee_email' => $this->employee->email,
            'message' => 'New employee '.$this->employee->name.' has joined the team.',
            'action' => 'view_employee',
            'action_url' => route('hr.employees.show', $this->employee->id),
        ];
    }
}
