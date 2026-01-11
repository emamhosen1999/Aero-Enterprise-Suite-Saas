<?php

declare(strict_types=1);

namespace Aero\Project\Notifications\Milestone;

use Aero\Project\Events\Milestone\MilestoneReached;
use Aero\Project\Notifications\BaseProjectNotification;

/**
 * MilestoneReachedNotification
 *
 * Sent when a project milestone is completed.
 * Notifies stakeholders via HRMAC access.
 */
class MilestoneReachedNotification extends BaseProjectNotification
{
    protected string $eventType = 'project.milestone.reached';
    protected string $subModuleCode = 'milestones';
    protected ?string $componentCode = 'milestone-list';
    protected string $actionCode = 'view';

    public function __construct(
        public int $milestoneId,
        public string $milestoneName,
        public int $projectId,
        public string $projectName,
        public bool $completedOnTime,
        public ?int $completedByUserId
    ) {
    }

    /**
     * Create from MilestoneReached event.
     */
    public static function fromEvent(MilestoneReached $event): self
    {
        $completedOnTime = $event->milestone->due_date
            ? now()->lte($event->milestone->due_date)
            : true;

        return new self(
            milestoneId: $event->milestone->id,
            milestoneName: $event->milestone->name,
            projectId: $event->milestone->project_id,
            projectName: $event->milestone->project->project_name ?? '',
            completedOnTime: $completedOnTime,
            completedByUserId: $event->getActorUserId()
        );
    }

    protected function getMailSubject(): string
    {
        $emoji = $this->completedOnTime ? '🎉' : '✅';
        return "{$emoji} Milestone Reached: {$this->milestoneName}";
    }

    protected function getMailLine(): string
    {
        $status = $this->completedOnTime ? 'on time' : 'with delay';
        return "Milestone '{$this->milestoneName}' in project '{$this->projectName}' has been completed {$status}!";
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
            'milestone_id' => $this->milestoneId,
            'milestone_name' => $this->milestoneName,
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'completed_on_time' => $this->completedOnTime,
            'completed_by' => $this->completedByUserId,
        ];
    }
}
