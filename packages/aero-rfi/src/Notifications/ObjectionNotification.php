<?php

namespace Aero\Rfi\Notifications;

use Aero\Rfi\Models\Objection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ObjectionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Objection $objection;

    protected string $event;

    /**
     * Event type constants
     */
    public const EVENT_SUBMITTED = 'submitted';

    public const EVENT_UNDER_REVIEW = 'under_review';

    public const EVENT_RESOLVED = 'resolved';

    public const EVENT_REJECTED = 'rejected';

    public function __construct(Objection $objection, string $event)
    {
        $this->objection = $objection;
        $this->event = $event;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $rfis = $this->objection->rfis;
        $firstRfi = $rfis->first();
        $rfiNumber = $firstRfi?->number ?? 'N/A';
        $creator = $this->objection->createdByUser;

        $subject = $this->getMailSubject($rfiNumber);
        $message = (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},");

        switch ($this->event) {
            case self::EVENT_SUBMITTED:
                $message
                    ->line("A new objection has been raised affecting RFI **{$rfiNumber}**.")
                    ->line('**Objection Details:**')
                    ->line("Title: {$this->objection->title}")
                    ->line("Category: {$this->objection->category_label}")
                    ->line("Raised by: {$creator?->name}")
                    ->line('Description: '.\Illuminate\Support\Str::limit($this->objection->description, 200))
                    ->line('')
                    ->line('**Affected RFIs:** '.$rfis->pluck('number')->implode(', '))
                    ->action('Review Objection', url("/rfi/objections/{$this->objection->id}"))
                    ->line('Please review this objection and take appropriate action.');
                break;

            case self::EVENT_UNDER_REVIEW:
                $message
                    ->line("Your objection affecting RFI **{$rfiNumber}** is now under review.")
                    ->line("Objection: {$this->objection->title}")
                    ->action('View Objection', url("/rfi/objections/{$this->objection->id}"))
                    ->line('You will be notified once a decision has been made.');
                break;

            case self::EVENT_RESOLVED:
                $message
                    ->line("Your objection affecting RFI **{$rfiNumber}** has been **resolved**.")
                    ->line("Objection: {$this->objection->title}")
                    ->line('')
                    ->line('**Resolution Notes:**')
                    ->line($this->objection->resolution_notes ?? 'No notes provided.')
                    ->action('View Details', url("/rfi/objections/{$this->objection->id}"))
                    ->line('Thank you for your attention to quality and safety.');
                break;

            case self::EVENT_REJECTED:
                $message
                    ->line("Your objection affecting RFI **{$rfiNumber}** has been **rejected**.")
                    ->line("Objection: {$this->objection->title}")
                    ->line('')
                    ->line('**Rejection Reason:**')
                    ->line($this->objection->resolution_notes ?? 'No reason provided.')
                    ->action('View Details', url("/rfi/objections/{$this->objection->id}"))
                    ->line('If you have additional concerns, please raise a new objection with more details.');
                break;
        }

        return $message;
    }

    public function toArray(object $notifiable): array
    {
        $rfis = $this->objection->rfis;
        $firstRfi = $rfis->first();

        return [
            'type' => 'rfi_objection',
            'event' => $this->event,
            'objection_id' => $this->objection->id,
            'objection_title' => $this->objection->title,
            'objection_category' => $this->objection->category,
            'objection_status' => $this->objection->status,
            'rfi_ids' => $rfis->pluck('id')->toArray(),
            'rfi_numbers' => $rfis->pluck('number')->toArray(),
            'created_by_id' => $this->objection->created_by,
            'created_by_name' => $this->objection->createdByUser?->name,
            'resolved_by_id' => $this->objection->resolved_by,
            'resolved_by_name' => $this->objection->resolvedByUser?->name,
            'resolution_notes' => $this->objection->resolution_notes,
            'message' => $this->getNotificationMessage($firstRfi?->number ?? 'N/A'),
            'action_required' => $this->event === self::EVENT_SUBMITTED,
        ];
    }

    protected function getMailSubject(string $rfiNumber): string
    {
        return match ($this->event) {
            self::EVENT_SUBMITTED => "[Action Required] New Objection Raised - RFI {$rfiNumber}",
            self::EVENT_UNDER_REVIEW => "Objection Under Review - RFI {$rfiNumber}",
            self::EVENT_RESOLVED => "Objection Resolved - RFI {$rfiNumber}",
            self::EVENT_REJECTED => "Objection Rejected - RFI {$rfiNumber}",
            default => "RFI Objection Update - {$rfiNumber}",
        };
    }

    protected function getNotificationMessage(string $rfiNumber): string
    {
        return match ($this->event) {
            self::EVENT_SUBMITTED => "New objection raised for RFI {$rfiNumber}: {$this->objection->title}",
            self::EVENT_UNDER_REVIEW => "Your objection for RFI {$rfiNumber} is under review",
            self::EVENT_RESOLVED => "Objection for RFI {$rfiNumber} has been resolved",
            self::EVENT_REJECTED => "Objection for RFI {$rfiNumber} has been rejected",
            default => "Objection update for RFI {$rfiNumber}",
        };
    }
}
