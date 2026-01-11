<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Onboarding;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Onboarding;

/**
 * OnboardingCompleted Event
 *
 * Dispatched when all onboarding tasks are completed.
 *
 * Triggers:
 * - Completion congratulations to employee
 * - Manager notification
 * - HR notification
 * - Probation period start (if applicable)
 * - Full system access grant
 */
class OnboardingCompleted extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Onboarding  $onboarding
     * @param  \DateTimeInterface  $completedAt
     * @param  int  $daysTaken  Number of days to complete onboarding
     * @param  int|null  $actorEmployeeId  Employee ID who marked completion
     */
    public function __construct(
        public Onboarding $onboarding,
        public \DateTimeInterface $completedAt,
        public int $daysTaken,
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId ?? $onboarding->employee_id);
    }

    public function getSubModuleCode(): string
    {
        return 'onboarding';
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
        return $this->onboarding->id;
    }

    public function getEntityType(): string
    {
        return 'onboarding';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'employee_id' => $this->onboarding->employee_id,
            'completed_at' => $this->completedAt->format('Y-m-d H:i:s'),
            'days_taken' => $this->daysTaken,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
