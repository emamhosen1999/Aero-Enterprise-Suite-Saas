<?php

namespace Aero\Rfi\Events;

use Aero\Rfi\Models\Rfi;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * RfiSubmitted Event
 *
 * Dispatched when a new RFI is submitted.
 * Triggers:
 * - ChainageProgress record creation
 * - Notification to Inspector
 * - SLA timer start
 */
class RfiSubmitted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Rfi $rfi,
        public int $submittedByUserId,
        public ?int $workLayerId = null,
        public ?array $metadata = null
    ) {}
}
