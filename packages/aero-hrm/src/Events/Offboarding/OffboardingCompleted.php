<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Offboarding;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Offboarding;

/**
 * OffboardingCompleted Event
 *
 * Dispatched when all offboarding tasks are completed.
 *
 * Triggers:
 * - Final settlement processing
 * - System access revocation
 * - Asset clearance confirmation
 * - Exit interview completion
 * - Manager notification
 * - HR notification
 */
class OffboardingCompleted extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Offboarding  $offboarding
     * @param  \DateTimeInterface  $completedAt
     * @param  bool  $allClearancesObtained
     * @param  int|null  $actorEmployeeId  Employee ID who marked completion
     */
    public function __construct(
        public Offboarding $offboarding,
        public \DateTimeInterface $completedAt,
        public bool $allClearancesObtained,
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId);
    }

    public function getSubModuleCode(): string
    {
        return 'offboarding';
    }

    public function getComponentCode(): ?string
    {
        return 'tasks';
    }

    public function getActionCode(): ?string
    {
        return 'complete';
    }

    public function getEntityId(): int|string
    {
        return $this->offboarding->id;
    }

    public function getEntityType(): string
    {
        return 'offboarding';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'employee_id' => $this->offboarding->employee_id,
            'completed_at' => $this->completedAt->format('Y-m-d H:i:s'),
            'all_clearances_obtained' => $this->allClearancesObtained,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
