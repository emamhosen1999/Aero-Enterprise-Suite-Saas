<?php

declare(strict_types=1);

namespace Aero\Project\Notifications\Member;

use Aero\Project\Events\Member\MemberAdded;
use Aero\Project\Notifications\BaseProjectNotification;

/**
 * MemberAddedNotification
 *
 * Sent when a user is added to a project team.
 * Direct notification to new member + HRMAC for project managers.
 */
class MemberAddedNotification extends BaseProjectNotification
{
    protected string $eventType = 'project.member.added';

    protected string $subModuleCode = 'projects';

    protected ?string $componentCode = 'team-management';

    protected string $actionCode = 'view';

    public function __construct(
        public int $memberId,
        public int $memberUserId,
        public int $projectId,
        public string $projectName,
        public string $role,
        public float $allocationPercentage,
        public ?int $addedByUserId
    ) {}

    /**
     * Create from MemberAdded event.
     */
    public static function fromEvent(MemberAdded $event): self
    {
        return new self(
            memberId: $event->member->id,
            memberUserId: $event->member->user_id,
            projectId: $event->member->project_id,
            projectName: $event->member->project->project_name ?? '',
            role: $event->member->role,
            allocationPercentage: (float) $event->member->allocation_percentage,
            addedByUserId: $event->getActorUserId()
        );
    }

    /**
     * Direct notification to the new member.
     */
    public function getDirectRecipientIds(): array
    {
        return [$this->memberUserId];
    }

    protected function getMailSubject(): string
    {
        return "Welcome to Project: {$this->projectName}";
    }

    protected function getMailLine(): string
    {
        $roleText = ucfirst(str_replace('_', ' ', $this->role));

        return "You have been added to project '{$this->projectName}' as a {$roleText} with {$this->allocationPercentage}% allocation.";
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
            'member_id' => $this->memberId,
            'member_user_id' => $this->memberUserId,
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'role' => $this->role,
            'allocation_percentage' => $this->allocationPercentage,
            'added_by' => $this->addedByUserId,
        ];
    }
}
