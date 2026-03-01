<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Onboarding;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Onboarding;

/**
 * OnboardingStarted Event
 *
 * Dispatched when an onboarding process is initiated for a new employee.
 *
 * Triggers:
 * - Welcome email with onboarding checklist
 * - Manager notification
 * - HR notification
 * - Task assignment notifications
 * - System access provisioning
 */
class OnboardingStarted extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  int|null  $actorEmployeeId  Employee ID who initiated onboarding
     */
    public function __construct(
        public Onboarding $onboarding,
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId);
    }

    public function getSubModuleCode(): string
    {
        return 'onboarding';
    }

    public function getComponentCode(): ?string
    {
        return 'tasks';
    }

    public function getActionCode(): string
    {
        return 'start';
    }

    public function getEntityId(): int
    {
        return (int) $this->onboarding->id;
    }

    public function getEntityType(): string
    {
        return 'onboarding';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'employee_id' => $this->onboarding->employee_id,
            'start_date' => $this->onboarding->start_date?->toDateString(),
            'expected_completion' => $this->onboarding->expected_completion_date?->toDateString(),
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
