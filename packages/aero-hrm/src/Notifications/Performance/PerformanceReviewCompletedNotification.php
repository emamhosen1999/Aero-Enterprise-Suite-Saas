<?php

namespace Aero\HRM\Notifications\Performance;

use Aero\HRM\Models\PerformanceReview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class PerformanceReviewCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PerformanceReview $review
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
        $employee = $this->review->employee;
        $ratingText = $this->getRatingText($this->review->overall_rating);

        return (new MailMessage)
            ->subject('Performance Review Completed')
            ->greeting("Hello {$employee->full_name}!")
            ->line('Your performance review has been completed.')
            ->line("Review Period: {$this->review->review_period_start->format('M d, Y')} - {$this->review->review_period_end->format('M d, Y')}")
            ->line("Overall Rating: {$this->review->overall_rating}/5 ({$ratingText})")
            ->line('Please review the detailed feedback and discuss any questions with your manager.')
            ->action('View Review', route('performance.reviews.show', $this->review->id))
            ->line('Keep up the good work!')
            ->salutation('HR Department');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'performance.review_completed',
            'review_id' => $this->review->id,
            'employee_id' => $this->review->employee_id,
            'employee_name' => $this->review->employee->full_name,
            'reviewer_id' => $this->review->reviewer_id,
            'overall_rating' => $this->review->overall_rating,
            'rating_text' => $this->getRatingText($this->review->overall_rating),
            'review_period' => [
                'start' => $this->review->review_period_start->toDateString(),
                'end' => $this->review->review_period_end->toDateString(),
            ],
            'message' => "Your performance review is complete. Rating: {$this->review->overall_rating}/5",
            'action_url' => route('performance.reviews.show', $this->review->id),
        ];
    }

    public function toBroadcast($notifiable): array
    {
        $ratingText = $this->getRatingText($this->review->overall_rating);

        return [
            'title' => '📊 Performance Review Complete',
            'body' => "Your review is ready. Rating: {$this->review->overall_rating}/5 ({$ratingText})",
            'icon' => '/images/icons/performance.png',
            'data' => $this->toArray($notifiable),
        ];
    }

    protected function getRatingText(float $rating): string
    {
        if ($rating >= 4.5) {
            return 'Outstanding';
        }
        if ($rating >= 4.0) {
            return 'Exceeds Expectations';
        }
        if ($rating >= 3.0) {
            return 'Meets Expectations';
        }
        if ($rating >= 2.0) {
            return 'Needs Improvement';
        }

        return 'Unsatisfactory';
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
            return $notifiable->prefersNotificationChannel($channel, 'performance.review_completed');
        }

        return true;
    }
}
