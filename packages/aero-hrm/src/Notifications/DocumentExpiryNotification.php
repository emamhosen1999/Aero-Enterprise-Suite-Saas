<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\EmployeePersonalDocument;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent when an employee document is about to expire.
 *
 * Recipients: The employee and optionally HR
 */
class DocumentExpiryNotification extends BaseHrmNotification
{
    protected string $eventType = 'document_expiring';

    public function __construct(
        public EmployeePersonalDocument $document,
        public int $daysUntilExpiry
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $documentName = $this->document->document_name ?? $this->document->document_type ?? 'Document';
        $expiryDate = $this->document->expiry_date?->format('d M Y') ?? 'soon';
        $urgency = $this->daysUntilExpiry <= 7 ? '⚠️ URGENT: ' : '';

        $message = (new MailMessage)
            ->subject("{$urgency}Document Expiring: {$documentName}")
            ->greeting("Hello {$notifiable->name},");

        if ($this->daysUntilExpiry === 0) {
            $message->line("**Your {$documentName} expires today!**");
        } elseif ($this->daysUntilExpiry === 1) {
            $message->line("**Your {$documentName} expires tomorrow!**");
        } else {
            $message->line("Your {$documentName} will expire in **{$this->daysUntilExpiry} days**.");
        }

        return $message
            ->line("**Document Details:**")
            ->line("Document: {$documentName}")
            ->line("Expiry Date: {$expiryDate}")
            ->line("Document Number: " . ($this->document->document_number ?? 'N/A'))
            ->action('Update Document', url("/hrm/my-profile/documents"))
            ->line('Please ensure you renew or update this document before it expires to avoid any issues.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'document_expiring',
            'document_id' => $this->document->id,
            'document_name' => $this->document->document_name ?? $this->document->document_type,
            'document_type' => $this->document->document_type,
            'expiry_date' => $this->document->expiry_date?->format('Y-m-d'),
            'days_until_expiry' => $this->daysUntilExpiry,
            'employee_id' => $this->document->employee_id,
            'is_urgent' => $this->daysUntilExpiry <= 7,
            'message' => $this->getNotificationMessage(),
            'action_url' => '/hrm/my-profile/documents',
        ];
    }

    /**
     * Get the notification message based on urgency.
     */
    protected function getNotificationMessage(): string
    {
        $documentName = $this->document->document_name ?? $this->document->document_type ?? 'Document';

        if ($this->daysUntilExpiry === 0) {
            return "⚠️ {$documentName} expires today!";
        } elseif ($this->daysUntilExpiry === 1) {
            return "⚠️ {$documentName} expires tomorrow!";
        } elseif ($this->daysUntilExpiry <= 7) {
            return "⚠️ {$documentName} expires in {$this->daysUntilExpiry} days";
        }

        return "{$documentName} expires in {$this->daysUntilExpiry} days";
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return $this->daysUntilExpiry <= 7 ? '⚠️ Document Expiring Soon' : 'Document Expiry Reminder';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        return $this->getNotificationMessage();
    }

    /**
     * Get SMS message.
     */
    protected function getSmsMessage(): string
    {
        $documentName = $this->document->document_name ?? $this->document->document_type ?? 'Document';

        if ($this->daysUntilExpiry <= 1) {
            return "URGENT: Your {$documentName} expires " . ($this->daysUntilExpiry === 0 ? 'today' : 'tomorrow') . ". Please renew immediately.";
        }

        return "Reminder: Your {$documentName} expires in {$this->daysUntilExpiry} days. Please renew soon.";
    }
}
