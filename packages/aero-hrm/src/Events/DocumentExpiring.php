<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\EmployeePersonalDocument;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when an employee's document is about to expire.
 *
 * This event is typically dispatched by a scheduled job that
 * checks for expiring documents.
 */
class DocumentExpiring
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public EmployeePersonalDocument $document,
        public int $daysUntilExpiry
    ) {}
}
