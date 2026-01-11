<?php

declare(strict_types=1);

namespace Aero\Project\Events\Project;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\Project;

/**
 * ProjectStatusChanged Event
 *
 * Dispatched when a project's status changes (e.g., in_progress → completed).
 *
 * Triggers:
 * - Stakeholder notifications
 * - Status board update
 * - Milestone check
 * - Audit log entry
 *
 * HRMAC Routing: Users with project.projects.update access
 */
class ProjectStatusChanged extends BaseProjectEvent
{
    public function __construct(
        public Project $project,
        public string $previousStatus,
        public string $newStatus,
        ?int $changedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($changedByUserId, array_merge($metadata, [
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
        ]));
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
        return 'update';
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
            'previous_status' => $this->previousStatus,
            'new_status' => $this->newStatus,
            'project_leader_id' => $this->project->project_leader_id,
        ]);
    }
}
