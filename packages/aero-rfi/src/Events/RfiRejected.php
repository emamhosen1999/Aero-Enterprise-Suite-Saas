<?php

namespace Aero\Rfi\Events;

use Aero\Rfi\Models\DailyWork;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * RfiRejected Event
 * 
 * Dispatched when an RFI is rejected.
 * Triggers:
 * - NCR auto-creation (if severity is high)
 * - ChainageProgress status update to 'rejected'
 * - Notification to contractor
 */
class RfiRejected
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public DailyWork $rfi,
        public int $rejectedByUserId,
        public string $reason,
        public bool $createNcr = false,
        public ?array $metadata = null
    ) {}
}
