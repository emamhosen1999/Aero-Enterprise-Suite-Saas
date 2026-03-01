<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Recruitment;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\JobOffer;

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
class OfferExtended extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  int|null  $actorEmployeeId  Employee ID (HR) who extended the offer
     */
    public function __construct(
        public JobOffer $offer,
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId);
    }

    public function getSubModuleCode(): string
    {
        return 'recruitment';
    }

    public function getComponentCode(): ?string
    {
        return 'offers';
    }

    public function getActionCode(): string
    {
        return 'extend';
    }

    public function getEntityId(): int
    {
        return (int) $this->offer->id;
    }

    public function getEntityType(): string
    {
        return 'job_offer';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'application_id' => $this->offer->application_id,
            'offered_salary' => $this->offer->offered_salary,
            'joining_date' => $this->offer->joining_date?->toDateString(),
            'offer_valid_until' => $this->offer->offer_valid_until?->toDateString(),
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
