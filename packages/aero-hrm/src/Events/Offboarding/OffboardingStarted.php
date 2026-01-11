<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Offboarding;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Offboarding;

/**
 * OffboardingStarted Event
 *
 * Dispatched when an offboarding process begins (resignation or termination).
 *
 * Triggers:
 * - Offboarding checklist notification to employee
 * - Manager notification
 * - HR notification
 * - Asset return reminders
 * - System access review
 * - Exit interview scheduling
 */
class OffboardingStarted extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Offboarding  $offboarding
     * @param  string  $reason  'resignation' or 'termination'
     * @param  int|null  $actorEmployeeId  Employee ID who initiated offboarding
     */
    public function __construct(
        public Offboarding $offboarding,
        public string $reason,
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
        return 'start';
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
            'reason' => $this->reason,
            'last_working_date' => $this->offboarding->last_working_date?->toDateString(),
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
