<?php

declare(strict_types=1);

namespace Aero\Project\Notifications\Task;

use Aero\Project\Events\Task\TaskAssigned;
use Aero\Project\Notifications\BaseProjectNotification;

/**
 * TaskAssignedNotification
 *
 * Sent when a task is assigned to a user.
 * Uses HRMAC for project managers + direct notification to assignee.
 */
class TaskAssignedNotification extends BaseProjectNotification
{
    protected string $eventType = 'project.task.assigned';

    protected string $subModuleCode = 'tasks';

    protected ?string $componentCode = 'task-list';

    protected string $actionCode = 'view';

    public function __construct(
        public int $taskId,
        public string $taskName,
        public int $projectId,
        public string $projectName,
        public int $assignedToUserId,
        public ?int $assignedByUserId,
        public ?string $dueDate,
        public string $priority
    ) {}

    /**
     * Create from TaskAssigned event.
     */
    public static function fromEvent(TaskAssigned $event): self
    {
        return new self(
            taskId: $event->task->id,
            taskName: $event->task->name,
            projectId: $event->task->project_id,
            projectName: $event->task->project->project_name ?? '',
            assignedToUserId: $event->assignedToUserId,
            assignedByUserId: $event->getActorUserId(),
            dueDate: $event->task->due_date?->format('Y-m-d'),
            priority: $event->task->priority ?? 'medium'
        );
    }

    /**
     * Direct notification to the assignee.
     */
    public function getDirectRecipientIds(): array
    {
        return [$this->assignedToUserId];
    }

    protected function getMailSubject(): string
    {
        return "Task Assigned: {$this->taskName}";
    }

    protected function getMailLine(): string
    {
        $message = "You have been assigned a new task '{$this->taskName}' in project '{$this->projectName}'.";

        if ($this->dueDate) {
            $message .= " Due date: {$this->dueDate}.";
        }

        return $message;
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
            'assigned_to' => $this->assignedToUserId,
            'assigned_by' => $this->assignedByUserId,
            'due_date' => $this->dueDate,
            'priority' => $this->priority,
        ];
    }
}
