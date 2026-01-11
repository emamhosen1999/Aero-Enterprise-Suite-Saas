<?php

declare(strict_types=1);

namespace Aero\Project\Events\Task;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\ProjectTask;

/**
 * TaskOverdue Event
 *
 * Dispatched when a task becomes overdue (due_date passed without completion).
 * Typically triggered by a scheduled job.
 *
 * Triggers:
 * - Alert to task assignee
 * - Escalation to project manager
 * - Dashboard risk indicator
 * - Audit log entry
 *
 * HRMAC Routing: Task assignee + project.tasks.view access holders
 */
class TaskOverdue extends BaseProjectEvent
{
    public function __construct(
        public ProjectTask $task,
        public int $daysOverdue,
        array $metadata = []
    ) {
        parent::__construct(null, array_merge($metadata, [
            'days_overdue' => $daysOverdue,
            'due_date' => $task->due_date?->toIso8601String(),
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
        return 'view'; // For notification routing purposes
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
            'assigned_to' => $this->task->assigned_to,
            'days_overdue' => $this->daysOverdue,
            'due_date' => $this->task->due_date?->toIso8601String(),
            'priority' => $this->task->priority,
        ]);
    }

    public function shouldNotify(): bool
    {
        // Always notify for overdue tasks
        return true;
    }
}
