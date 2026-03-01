<?php

declare(strict_types=1);

namespace Aero\Project\Contracts;

/**
 * ProjectAuthorizationContract
 *
 * Contract for HRMAC-based authorization checks.
 * Wraps HRMAC facade to provide project-specific authorization methods.
 *
 * ARCHITECTURAL RULE: NO hardcoded role names.
 * All authorization is based on HRMAC module/submodule/component/action access.
 */
interface ProjectAuthorizationContract
{
    /**
     * Check if current user can access project module.
     */
    public function canAccessProjectModule(mixed $user): bool;

    /**
     * Check if user can access a specific submodule.
     *
     * @param  string  $subModuleCode  e.g., 'projects', 'tasks', 'sprints', 'milestones', 'risks'
     */
    public function canAccessSubModule(mixed $user, string $subModuleCode): bool;

    /**
     * Check if user can perform action on a component.
     *
     * @param  string  $actionCode  e.g., 'view', 'create', 'update', 'delete', 'assign', 'complete'
     */
    public function canPerformAction(
        mixed $user,
        string $subModuleCode,
        string $componentCode,
        string $actionCode
    ): bool;

    /**
     * Check if user is a project member with specific project role.
     *
     * @param  string|null  $projectRole  Optional specific project role to check
     */
    public function isProjectMember(mixed $user, int $projectId, ?string $projectRole = null): bool;

    /**
     * Check if user can manage project team.
     */
    public function canManageTeam(mixed $user, int $projectId): bool;

    /**
     * Get all accessible project IDs for a user.
     * Based on HRMAC access + project membership.
     *
     * @return array<int>
     */
    public function getAccessibleProjectIds(mixed $user): array;
}
