<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\JobApplication;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to HR/recruiters when a new job application is received.
 *
 * Recipients: HR managers, recruiters
 */
class NewApplicationNotification extends BaseHrmNotification
{
    protected string $eventType = 'new_job_application';

    public function __construct(
        public JobApplication $application
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $candidateName = trim(($this->application->first_name ?? '') . ' ' . ($this->application->last_name ?? ''));
        if (empty($candidateName)) {
            $candidateName = $this->application->name ?? 'Candidate';
        }
        $jobTitle = $this->application->job?->title ?? $this->application->jobPosting?->title ?? 'a position';

        return (new MailMessage)
            ->subject("New Job Application - {$candidateName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A new candidate has applied for {$jobTitle}.")
            ->line('**Candidate Details:**')
            ->line("Name: {$candidateName}")
            ->line("Email: {$this->application->email}")
            ->line('Phone: ' . ($this->application->phone ?? 'N/A'))
            ->line('Experience: ' . ($this->application->years_of_experience ?? 0) . ' years')
            ->action('Review Application', url("/hrm/recruitment/applicants/{$this->application->id}"))
            ->line('Please review the application and take appropriate action.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $candidateName = trim(($this->application->first_name ?? '') . ' ' . ($this->application->last_name ?? ''));
        if (empty($candidateName)) {
            $candidateName = $this->application->name ?? 'Candidate';
        }
        $jobTitle = $this->application->job?->title ?? $this->application->jobPosting?->title ?? 'Unknown Position';

        return [
            'type' => 'new_job_application',
            'application_id' => $this->application->id,
            'job_id' => $this->application->job_id ?? $this->application->job_posting_id,
            'job_title' => $jobTitle,
            'candidate_name' => $candidateName,
            'candidate_email' => $this->application->email,
            'message' => "{$candidateName} has applied for {$jobTitle}",
            'action_url' => "/hrm/recruitment/applicants/{$this->application->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return '📝 New Job Application';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $candidateName = trim(($this->application->first_name ?? '') . ' ' . ($this->application->last_name ?? ''));
        if (empty($candidateName)) {
            $candidateName = $this->application->name ?? 'A candidate';
        }
        $jobTitle = $this->application->job?->title ?? $this->application->jobPosting?->title ?? 'a position';

        return "{$candidateName} has applied for {$jobTitle}. Tap to review.";
    }
}
