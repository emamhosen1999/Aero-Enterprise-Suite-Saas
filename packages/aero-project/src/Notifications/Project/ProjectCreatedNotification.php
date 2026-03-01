<?php

declare(strict_types=1);

namespace Aero\Project\Notifications\Project;

use Aero\Project\Events\Project\ProjectCreated;
use Aero\Project\Notifications\BaseProjectNotification;

/**
 * ProjectCreatedNotification
 *
 * Sent when a new project is created.
 * Notifies project team and stakeholders via HRMAC access.
 */
class ProjectCreatedNotification extends BaseProjectNotification
{
    protected string $eventType = 'project.created';

    protected string $subModuleCode = 'projects';

    protected ?string $componentCode = 'project-list';

    protected string $actionCode = 'view';

    public function __construct(
        public int $projectId,
        public string $projectName,
        public ?string $projectCode,
        public ?int $projectLeaderId,
        public ?string $startDate,
        public ?string $endDate,
        public ?float $budget,
        public ?int $createdByUserId
    ) {}

    /**
     * Create from ProjectCreated event.
     */
    public static function fromEvent(ProjectCreated $event): self
    {
        return new self(
            projectId: $event->project->id,
            projectName: $event->project->project_name,
            projectCode: $event->project->code,
            projectLeaderId: $event->project->project_leader_id,
            startDate: $event->project->start_date?->format('Y-m-d'),
            endDate: $event->project->end_date?->format('Y-m-d'),
            budget: (float) $event->project->budget,
            createdByUserId: $event->getActorUserId()
        );
    }

    /**
     * Direct notification to project leader.
     */
    public function getDirectRecipientIds(): array
    {
        return $this->projectLeaderId ? [$this->projectLeaderId] : [];
    }

    protected function getMailSubject(): string
    {
        return "New Project Created: {$this->projectName}";
    }

    protected function getMailLine(): string
    {
        $message = "A new project '{$this->projectName}' has been created.";

        if ($this->startDate && $this->endDate) {
            $message .= " Timeline: {$this->startDate} to {$this->endDate}.";
        }

        return $message;
    }

    protected function getMailActionText(): string
    {
        return 'View Project';
    }

    protected function getMailActionUrl(): string
    {
        return route('project.projects.show', ['project' => $this->projectId]);
    }

    protected function getNotificationData(): array
    {
        return [
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'project_code' => $this->projectCode,
            'project_leader_id' => $this->projectLeaderId,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
            'budget' => $this->budget,
            'created_by' => $this->createdByUserId,
        ];
    }
}
