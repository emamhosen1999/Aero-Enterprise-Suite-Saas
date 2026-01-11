<?php

declare(strict_types=1);

namespace Aero\Project\Events\Task;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\ProjectTask;

/**
 * TaskCompleted Event
 *
 * Dispatched when a task is marked as completed.
 *
 * Triggers:
 * - Project progress recalculation
 * - Dependent task unblocking
 * - Sprint velocity update
 * - Milestone completion check
 * - Audit log entry
 *
 * HRMAC Routing: Project managers and task creator get notifications
 */
class TaskCompleted extends BaseProjectEvent
{
    public function __construct(
        public ProjectTask $task,
        public ?float $actualHours = null,
        ?int $completedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($completedByUserId, array_merge($metadata, [
            'actual_hours' => $actualHours,
            'estimated_hours' => $task->estimated_hours,
        ]));
    }

    public function getSubModuleCode(): string
    {
        return 'tasks';
    }

    public function getComponentCode(): ?string
    {
        return 'task-list';
    }

    public function getActionCode(): string
    {
        return 'complete';
    }

    public function getEntityId(): int
    {
        return $this->task->id;
    }

    public function getEntityType(): string
    {
        return 'task';
    }

    public function getProjectId(): int
    {
        return $this->task->project_id;
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'task_id' => $this->task->id,
            'task_name' => $this->task->name,
            'project_id' => $this->task->project_id,
            'milestone_id' => $this->task->milestone_id,
            'sprint_id' => $this->task->sprint_id ?? null,
            'actual_hours' => $this->actualHours,
            'estimated_hours' => $this->task->estimated_hours,
            'assigned_to' => $this->task->assigned_to,
        ]);
    }
}
