<?php

namespace Aero\Rfi\Events;

use Aero\Rfi\Models\DailyWork;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * RfiApproved Event
 * 
 * Dispatched when an RFI (DailyWork) is approved after inspection.
 * Triggers:
 * - Auto-generation of BoqMeasurement
 * - Update of ChainageProgress to 'approved'
 * - Notification to QS team
 */
class RfiApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public DailyWork $rfi,
        public int $approvedByUserId,
        public ?string $inspectionResult = null,
        public ?array $metadata = null
    ) {}
}
