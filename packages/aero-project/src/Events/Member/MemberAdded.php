<?php

declare(strict_types=1);

namespace Aero\Project\Events\Member;

use Aero\Project\Events\BaseProjectEvent;
use Aero\Project\Models\ProjectMember;

/**
 * MemberAdded Event
 *
 * Dispatched when a new member is added to a project.
 *
 * Triggers:
 * - Welcome notification to new member
 * - Team notification
 * - Resource allocation update
 * - Audit log entry
 *
 * HRMAC Routing: New member gets direct notification,
 * project managers via project.members.create access
 */
class MemberAdded extends BaseProjectEvent
{
    public function __construct(
        public ProjectMember $member,
        ?int $addedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($addedByUserId, array_merge($metadata, [
            'member_role' => $member->role,
            'allocation_percentage' => $member->allocation_percentage,
        ]));
    }

    public function getSubModuleCode(): string
    {
        return 'projects';
    }

    public function getComponentCode(): ?string
    {
        return 'team-management';
    }

    public function getActionCode(): string
    {
        return 'create';
    }

    public function getEntityId(): int
    {
        return $this->member->id;
    }

    public function getEntityType(): string
    {
        return 'project_member';
    }

    public function getProjectId(): int
    {
        return $this->member->project_id;
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'member_id' => $this->member->id,
            'member_user_id' => $this->member->user_id,
            'project_id' => $this->member->project_id,
            'role' => $this->member->role,
            'allocation_percentage' => $this->member->allocation_percentage,
        ]);
    }

    /**
     * Get the user ID of the newly added member.
     * Used for direct notification routing.
     */
    public function getNewMemberUserId(): int
    {
        return $this->member->user_id;
    }
}
