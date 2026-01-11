<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Recruitment;

use Aero\HRM\Models\JobOffer;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * OfferExtended Event
 *
 * Dispatched when a job offer is extended to a candidate.
 *
 * Triggers:
 * - Offer letter email to candidate
 * - Manager notification
 * - HR notification
 * - Offer acceptance tracking
 */
class OfferExtended
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public JobOffer $offer
    ) {}
}
