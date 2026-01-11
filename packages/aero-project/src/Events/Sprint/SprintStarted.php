<?php

declare(strict_types=1);

namespace Aero\Project\Events\Sprint;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\Sprint;

/**
 * SprintStarted Event
 *
 * Dispatched when a sprint is activated.
 *
 * Triggers:
 * - Team notification
 * - Dashboard sprint board activation
 * - Daily standup reminder setup
 * - Audit log entry
 *
 * HRMAC Routing: Users with project.sprints.update access
 */
class SprintStarted extends BaseProjectEvent
{
    public function __construct(
        public Sprint $sprint,
        ?int $startedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($startedByUserId, array_merge($metadata, [
            'capacity_points' => $sprint->capacity_points,
            'start_date' => $sprint->start_date?->toIso8601String(),
            'end_date' => $sprint->end_date?->toIso8601String(),
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
        return 'update';
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
            'goal' => $this->sprint->goal,
            'capacity_points' => $this->sprint->capacity_points,
            'start_date' => $this->sprint->start_date?->toIso8601String(),
            'end_date' => $this->sprint->end_date?->toIso8601String(),
        ]);
    }
}
