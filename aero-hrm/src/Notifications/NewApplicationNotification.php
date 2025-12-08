<?php

namespace App\Notifications;

use App\Models\HRM\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewApplicationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $application;

    /**
     * Create a new notification instance.
     */
    public function __construct(JobApplication $application)
    {
        $this->application = $application;
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
        $candidateName = $this->application->first_name.' '.$this->application->last_name;
        $jobTitle = $this->application->job?->title ?? 'a position';

        return (new MailMessage)
            ->subject('New Job Application - '.$candidateName)
            ->greeting('Hello, '.$notifiable->name)
            ->line('A new candidate has applied for '.$jobTitle.'.')
            ->line('**Candidate Details:**')
            ->line('Name: '.$candidateName)
            ->line('Email: '.$this->application->email)
            ->line('Phone: '.($this->application->phone ?? 'N/A'))
            ->line('Experience: '.($this->application->years_of_experience ?? 0).' years')
            ->action('Review Application', route('hr.recruitment.applicants.show', $this->application->id))
            ->line('Please review the application and take appropriate action.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'job_id' => $this->application->job_id,
            'job_title' => $this->application->job?->title,
            'candidate_name' => $this->application->first_name.' '.$this->application->last_name,
            'candidate_email' => $this->application->email,
            'message' => $this->application->first_name.' '.$this->application->last_name.' has applied for '.$this->application->job?->title,
            'action' => 'review_application',
            'action_url' => route('hr.recruitment.applicants.show', $this->application->id),
        ];
    }
}
