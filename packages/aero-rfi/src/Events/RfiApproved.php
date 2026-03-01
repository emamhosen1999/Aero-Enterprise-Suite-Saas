<?php

namespace Aero\Rfi\Events;

use Aero\Rfi\Models\Rfi;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * RfiApproved Event
 *
 * Dispatched when an RFI is approved after inspection.
 * Triggers:
 * - Auto-generation of BoqMeasurement
 * - Update of ChainageProgress to 'approved'
 * - Notification to QS team
 */
class RfiApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Rfi $rfi,
        public int $approvedByUserId,
        public ?string $inspectionResult = null,
        public ?array $metadata = null
    ) {}
}
