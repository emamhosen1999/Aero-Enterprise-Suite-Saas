<?php

declare(strict_types=1);

namespace Aero\Project\Events\Sprint;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\Sprint;

/**
 * SprintCompleted Event
 *
 * Dispatched when a sprint is completed.
 *
 * Triggers:
 * - Team notification
 * - Velocity calculation
 * - Burndown chart finalization
 * - Retrospective reminder
 * - Audit log entry
 *
 * HRMAC Routing: Users with project.sprints.update access
 */
class SprintCompleted extends BaseProjectEvent
{
    public function __construct(
        public Sprint $sprint,
        public int $completedPoints,
        public float $velocity,
        ?int $completedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($completedByUserId, array_merge($metadata, [
            'completed_points' => $completedPoints,
            'velocity' => $velocity,
            'capacity_points' => $sprint->capacity_points,
        ]));
    }

    public function getSubModuleCode(): string
    {
        return 'sprints';
    }

    public function getComponentCode(): ?string
    {
        return 'sprint-board';
    }

    public function getActionCode(): string
    {
        return 'complete';
    }

    public function getEntityId(): int
    {
        return $this->sprint->id;
    }

    public function getEntityType(): string
    {
        return 'sprint';
    }

    public function getProjectId(): int
    {
        return $this->sprint->project_id;
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'sprint_id' => $this->sprint->id,
            'sprint_name' => $this->sprint->name,
            'project_id' => $this->sprint->project_id,
            'completed_points' => $this->completedPoints,
            'capacity_points' => $this->sprint->capacity_points,
            'velocity' => $this->velocity,
            'completion_rate' => $this->sprint->capacity_points > 0
                ? round(($this->completedPoints / $this->sprint->capacity_points) * 100, 1)
                : 0,
        ]);
    }
}
