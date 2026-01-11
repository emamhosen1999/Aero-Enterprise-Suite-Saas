<?php

declare(strict_types=1);

namespace Aero\Project\Events\Milestone;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\ProjectMilestone;

/**
 * MilestoneReached Event
 *
 * Dispatched when a project milestone is completed.
 *
 * Triggers:
 * - Stakeholder notification
 * - Progress update broadcast
 * - Invoice trigger (if billing milestone)
 * - Celebration/kudos
 * - Audit log entry
 *
 * HRMAC Routing: Users with project.milestones.update access
 */
class MilestoneReached extends BaseProjectEvent
{
    public function __construct(
        public ProjectMilestone $milestone,
        ?int $completedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($completedByUserId, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'milestones';
    }

    public function getComponentCode(): ?string
    {
        return 'milestone-list';
    }

    public function getActionCode(): string
    {
        return 'complete';
    }

    public function getEntityId(): int
    {
        return $this->milestone->id;
    }

    public function getEntityType(): string
    {
        return 'milestone';
    }

    public function getProjectId(): int
    {
        return $this->milestone->project_id;
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'milestone_id' => $this->milestone->id,
            'milestone_name' => $this->milestone->name,
            'project_id' => $this->milestone->project_id,
            'due_date' => $this->milestone->due_date?->toIso8601String(),
            'completed_on_time' => $this->milestone->due_date
                ? now()->lte($this->milestone->due_date)
                : true,
        ]);
    }
}
