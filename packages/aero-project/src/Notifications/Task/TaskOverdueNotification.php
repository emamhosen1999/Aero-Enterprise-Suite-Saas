<?php

declare(strict_types=1);

namespace Aero\Project\Notifications\Task;

use Aero\Project\Events\Task\TaskOverdue;
use Aero\Project\Notifications\BaseProjectNotification;

/**
 * TaskOverdueNotification
 *
 * Sent when a task becomes overdue.
 * Escalates to assignee and project managers.
 */
class TaskOverdueNotification extends BaseProjectNotification
{
    protected string $eventType = 'project.task.overdue';

    protected string $subModuleCode = 'tasks';

    protected ?string $componentCode = 'task-list';

    protected string $actionCode = 'view';

    public function __construct(
        public int $taskId,
        public string $taskName,
        public int $projectId,
        public string $projectName,
        public int $daysOverdue,
        public ?int $assignedToUserId,
        public string $priority
    ) {}

    /**
     * Create from TaskOverdue event.
     */
    public static function fromEvent(TaskOverdue $event): self
    {
        return new self(
            taskId: $event->task->id,
            taskName: $event->task->name,
            projectId: $event->task->project_id,
            projectName: $event->task->project->project_name ?? '',
            daysOverdue: $event->daysOverdue,
            assignedToUserId: $event->task->assigned_to,
            priority: $event->task->priority ?? 'medium'
        );
    }

    /**
     * Direct notification to the assignee.
     */
    public function getDirectRecipientIds(): array
    {
        return $this->assignedToUserId ? [$this->assignedToUserId] : [];
    }

    protected function getMailSubject(): string
    {
        return "⚠️ Task Overdue: {$this->taskName} ({$this->daysOverdue} days)";
    }

    protected function getMailLine(): string
    {
        return "Task '{$this->taskName}' in project '{$this->projectName}' is {$this->daysOverdue} day(s) overdue. Please take immediate action.";
    }

    protected function getMailActionText(): string
    {
        return 'View Task';
    }

    protected function getMailActionUrl(): string
    {
        return route('project.tasks.show', ['project' => $this->projectId, 'task' => $this->taskId]);
    }

    protected function getNotificationData(): array
    {
        return [
            'task_id' => $this->taskId,
            'task_name' => $this->taskName,
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'days_overdue' => $this->daysOverdue,
            'assigned_to' => $this->assignedToUserId,
            'priority' => $this->priority,
            'is_urgent' => $this->daysOverdue > 3 || $this->priority === 'critical',
        ];
    }
}
