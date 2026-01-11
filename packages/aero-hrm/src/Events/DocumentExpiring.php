<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\EmployeePersonalDocument;

/**
 * Event fired when an employee's document is about to expire.
 *
 * This event is typically dispatched by a scheduled job that
 * checks for expiring documents.
 */
class DocumentExpiring extends BaseHrmEvent
{
    public function __construct(
        public readonly EmployeePersonalDocument $document,
        public readonly int $daysUntilExpiry,
        array $metadata = []
    ) {
        // System-triggered event, no actor
        parent::__construct(null, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'employees';
    }

    public function getComponentCode(): ?string
    {
        return 'documents';
    }

    public function getActionCode(): string
    {
        return 'expiring';
    }

    public function getEntityId(): int
    {
        return (int) $this->document->id;
    }

    public function getEntityType(): string
    {
        return 'employee_personal_document';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'document_id' => (int) $this->document->id,
            'document_type' => $this->document->document_type ?? 'unknown',
            'user_id' => $this->document->user_id,
            'days_until_expiry' => $this->daysUntilExpiry,
            'expiry_date' => $this->document->expiry_date?->toDateString(),
        ]);
    }
}
