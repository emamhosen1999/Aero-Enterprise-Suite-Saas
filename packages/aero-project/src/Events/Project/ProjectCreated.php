<?php

declare(strict_types=1);

namespace Aero\Project\Events\Project;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\Project;

/**
 * ProjectCreated Event
 *
 * Dispatched when a new project is created.
 *
 * Triggers:
 * - Welcome notification to project team
 * - Manager notification
 * - Dashboard widget update
 * - Audit log entry
 *
 * HRMAC Routing: Users with access to project.projects.create action
 */
class ProjectCreated extends BaseProjectEvent
{
    public function __construct(
        public Project $project,
        ?int $createdByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($createdByUserId, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'projects';
    }

    public function getComponentCode(): ?string
    {
        return 'project-list';
    }

    public function getActionCode(): string
    {
        return 'create';
    }

    public function getEntityId(): int
    {
        return $this->project->id;
    }

    public function getEntityType(): string
    {
        return 'project';
    }

    public function getProjectId(): int
    {
        return $this->project->id;
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'project_id' => $this->project->id,
            'project_name' => $this->project->project_name,
            'project_code' => $this->project->code,
            'project_leader_id' => $this->project->project_leader_id,
            'department_id' => $this->project->department_id,
            'start_date' => $this->project->start_date?->toIso8601String(),
            'end_date' => $this->project->end_date?->toIso8601String(),
            'budget' => $this->project->budget,
            'priority' => $this->project->priority,
        ]);
    }
}
