<?php

declare(strict_types=1);

namespace Aero\Project\Events\Task;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\ProjectTask;

/**
 * TaskAssigned Event
 *
 * Dispatched when a task is assigned to a user.
 *
 * Triggers:
 * - Notification to assigned user
 * - Calendar/workload update
 * - Audit log entry
 *
 * HRMAC Routing: Task assignee gets direct notification,
 * project managers get via project.tasks.assign access
 */
class TaskAssigned extends BaseProjectEvent
{
    public function __construct(
        public ProjectTask $task,
        public int $assignedToUserId,
        public ?int $previousAssigneeId = null,
        ?int $assignedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($assignedByUserId, array_merge($metadata, [
            'assigned_to_user_id' => $assignedToUserId,
            'previous_assignee_id' => $previousAssigneeId,
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
        return 'assign';
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
            'assigned_to_user_id' => $this->assignedToUserId,
            'previous_assignee_id' => $this->previousAssigneeId,
            'due_date' => $this->task->due_date?->toIso8601String(),
            'priority' => $this->task->priority,
        ]);
    }
}
