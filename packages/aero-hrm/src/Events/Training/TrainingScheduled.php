<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Training;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Training;

/**
 * TrainingScheduled Event
 *
 * Dispatched when a training session is scheduled.
 *
 * Triggers:
 * - Training invitation to employees
 * - Calendar invites
 * - Reminder notifications
 * - Training materials distribution
 */
class TrainingScheduled extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Training  $training
     * @param  array<int>  $enrolledEmployeeIds  Array of employee IDs enrolled
     * @param  int|null  $actorEmployeeId  Employee ID who scheduled the training
     */
    public function __construct(
        public Training $training,
        public array $enrolledEmployeeIds = [],
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId);
    }

    public function getSubModuleCode(): string
    {
        return 'training';
    }

    public function getComponentCode(): ?string
    {
        return 'sessions';
    }

    public function getActionCode(): string
    {
        return 'schedule';
    }

    public function getEntityId(): int
    {
        return (int) $this->training->id;
    }

    public function getEntityType(): string
    {
        return 'training';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'training_title' => $this->training->title,
            'training_type' => $this->training->type,
            'start_date' => $this->training->start_date?->toDateString(),
            'end_date' => $this->training->end_date?->toDateString(),
            'enrolled_employee_ids' => $this->enrolledEmployeeIds,
            'enrolled_count' => count($this->enrolledEmployeeIds),
        ]);
    }

    public function shouldNotify(): bool
    {
        return !empty($this->enrolledEmployeeIds);
    }
}
