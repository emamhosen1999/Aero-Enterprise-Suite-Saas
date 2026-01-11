<?php

declare(strict_types=1);

namespace Aero\Project\Notifications\Sprint;

use Aero\Project\Events\Sprint\SprintStarted;
use Aero\Project\Notifications\BaseProjectNotification;

/**
 * SprintStartedNotification
 *
 * Sent when a sprint is started.
 * Notifies project team via HRMAC access.
 */
class SprintStartedNotification extends BaseProjectNotification
{
    protected string $eventType = 'project.sprint.started';
    protected string $subModuleCode = 'sprints';
    protected ?string $componentCode = 'sprint-board';
    protected string $actionCode = 'view';

    public function __construct(
        public int $sprintId,
        public string $sprintName,
        public int $projectId,
        public string $projectName,
        public ?string $goal,
        public ?int $capacityPoints,
        public string $startDate,
        public string $endDate
    ) {
    }

    /**
     * Create from SprintStarted event.
     */
    public static function fromEvent(SprintStarted $event): self
    {
        return new self(
            sprintId: $event->sprint->id,
            sprintName: $event->sprint->name,
            projectId: $event->sprint->project_id,
            projectName: $event->sprint->project->project_name ?? '',
            goal: $event->sprint->goal,
            capacityPoints: $event->sprint->capacity_points,
            startDate: $event->sprint->start_date->format('Y-m-d'),
            endDate: $event->sprint->end_date->format('Y-m-d')
        );
    }

    protected function getMailSubject(): string
    {
        return "🚀 Sprint Started: {$this->sprintName}";
    }

    protected function getMailLine(): string
    {
        $message = "Sprint '{$this->sprintName}' has started for project '{$this->projectName}'.";

        if ($this->goal) {
            $message .= " Goal: {$this->goal}";
        }

        return $message;
    }

    protected function getMailActionText(): string
    {
        return 'View Sprint Board';
    }

    protected function getMailActionUrl(): string
    {
        return route('project.sprints.show', ['project' => $this->projectId, 'sprint' => $this->sprintId]);
    }

    protected function getNotificationData(): array
    {
        return [
            'sprint_id' => $this->sprintId,
            'sprint_name' => $this->sprintName,
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'goal' => $this->goal,
            'capacity_points' => $this->capacityPoints,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
        ];
    }
}
