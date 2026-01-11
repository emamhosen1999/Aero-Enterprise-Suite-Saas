<?php

namespace Aero\HRM\Notifications\Recruitment;

use Aero\HRM\Models\JobOffer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

/**
 * Notification sent when a job offer is extended to a candidate.
 */
class OfferExtendedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public JobOffer $offer,
        public array $metadata = []
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        $channels = ['database'];

        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $candidateName = $this->offer->application?->candidate_name ?? 'Candidate';
        $jobTitle = $this->offer->application?->job?->title ?? 'Position';
        $expiryDate = $this->offer->expires_at?->format('F j, Y') ?? 'Soon';

        return (new MailMessage)
            ->subject("Job Offer - {$jobTitle} at " . config('app.name'))
            ->greeting("Dear {$candidateName},")
            ->line('We are pleased to extend an offer of employment to you!')
            ->line("Position: {$jobTitle}")
            ->line("Salary: {$this->formatSalary()}")
            ->line("Start Date: {$this->offer->proposed_start_date?->format('F j, Y')}")
            ->line("This offer expires on: {$expiryDate}")
            ->action('View Offer Details', $this->getOfferUrl())
            ->line('Please review the offer and respond at your earliest convenience.')
            ->line('We look forward to welcoming you to our team!')
            ->salutation('Best regards, HR Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'recruitment.offer_extended',
            'offer_id' => $this->offer->id,
            'application_id' => $this->offer->application_id,
            'candidate_name' => $this->offer->application?->candidate_name,
            'job_title' => $this->offer->application?->job?->title,
            'salary' => $this->offer->salary,
            'expires_at' => $this->offer->expires_at?->toIso8601String(),
            'message' => 'A job offer has been extended.',
            'action_url' => $this->getOfferUrl(),
            'metadata' => $this->metadata,
        ];
    }

    /**
     * Format salary for display.
     */
    protected function formatSalary(): string
    {
        $salary = $this->offer->salary ?? 0;
        $currency = $this->offer->currency ?? config('hrm.default_currency', 'USD');

        return number_format($salary, 2) . ' ' . $currency;
    }

    /**
     * Get URL to view the offer.
     */
    protected function getOfferUrl(): string
    {
        try {
            return route('hrm.recruitment.offers.show', $this->offer->id);
        } catch (\Exception $e) {
            return url('/hrm/recruitment/offers/' . $this->offer->id);
        }
    }

    /**
     * Check if a channel is enabled for this notification.
     */
    protected function isChannelEnabled(string $channel, $notifiable): bool
    {
        try {
            $globalEnabled = DB::table('notification_settings')
                ->where('key', "channels.{$channel}.enabled")
                ->value('value');

            if (! json_decode($globalEnabled ?? 'true')) {
                return false;
            }
        } catch (\Exception $e) {
            // Table might not exist yet
        }

        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel);
        }

        return true;
    }
}
