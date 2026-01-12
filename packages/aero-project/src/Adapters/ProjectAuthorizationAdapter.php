<?php

declare(strict_types=1);

namespace Aero\Project\Adapters;

use Aero\Project\Contracts\ProjectAuthorizationContract;
use Aero\Project\Models\ProjectMember;
use Illuminate\Support\Facades\DB;

/**
 * ProjectAuthorizationAdapter
 *
 * Default implementation of HRMAC-based authorization for project module.
 * Uses the HRMAC facade if available, otherwise falls back to basic checks.
 *
 * ARCHITECTURAL PRINCIPLE: All authorization is HRMAC-based.
 * NO hardcoded role names. Permission paths follow:
 * module → submodule → component → action
 */
class ProjectAuthorizationAdapter implements ProjectAuthorizationContract
{
    /**
     * Module code for project management.
     */
    protected string $moduleCode = 'project';

    /**
     * Check if current user can access project module.
     */
    public function canAccessProjectModule(mixed $user): bool
    {
        return $this->checkHrmacAccess($user, $this->moduleCode);
    }

    /**
     * Check if user can access a specific submodule.
     */
    public function canAccessSubModule(mixed $user, string $subModuleCode): bool
    {
        $permissionPath = "{$this->moduleCode}.{$subModuleCode}";

        return $this->checkHrmacAccess($user, $permissionPath);
    }

    /**
     * Check if user can perform action on a component.
     */
    public function canPerformAction(
        mixed $user,
        string $subModuleCode,
        string $componentCode,
        string $actionCode
    ): bool {
        // Build full permission path: module.submodule.component.action
        $permissionPath = "{$this->moduleCode}.{$subModuleCode}.{$componentCode}.{$actionCode}";

        return $this->checkHrmacAccess($user, $permissionPath);
    }

    /**
     * Check if user is a project member with specific project role.
     */
    public function isProjectMember(mixed $user, int $projectId, ?string $projectRole = null): bool
    {
        $userId = is_object($user) ? $user->id : $user;

        $query = ProjectMember::where('project_id', $projectId)
            ->where('user_id', $userId);

        if ($projectRole !== null) {
            $query->where('role', $projectRole);
        }

        return $query->exists();
    }

    /**
     * Check if user can manage project team.
     */
    public function canManageTeam(mixed $user, int $projectId): bool
    {
        // First check HRMAC permission
        if ($this->canPerformAction($user, 'projects', 'team', 'manage')) {
            return true;
        }

        $userId = is_object($user) ? $user->id : $user;

        // Check if user is project leader or manager role
        return ProjectMember::where('project_id', $projectId)
            ->where('user_id', $userId)
            ->whereIn('role', ['project_leader', 'project_manager', 'team_lead'])
            ->exists();
    }

    /**
     * Get all accessible project IDs for a user.
     */
    public function getAccessibleProjectIds(mixed $user): array
    {
        $userId = is_object($user) ? $user->id : $user;

        // If user has full module access, return all projects
        if ($this->canAccessProjectModule($user)) {
            return DB::table('projects')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        // Otherwise, only return projects where user is a member
        return ProjectMember::where('user_id', $userId)
            ->pluck('project_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Check HRMAC access using facade or fallback.
     */
    protected function checkHrmacAccess(mixed $user, string $permissionPath): bool
    {
        // Try to use HRMAC facade if available
        if (class_exists('Aero\Hrmac\Facades\HRMAC')) {
            try {
                return \Aero\Hrmac\Facades\HRMAC::hasAccess($user, $permissionPath);
            } catch (\Throwable $e) {
                // Fall through to basic check
            }
        }

        // Try via Core's permission check if available
        if (is_object($user) && method_exists($user, 'can')) {
            return $user->can($permissionPath);
        }

        // Fallback: Check if permission exists in user's permissions
        if (is_object($user) && method_exists($user, 'getAllPermissions')) {
            $permissions = $user->getAllPermissions();

            return $permissions->contains('name', $permissionPath);
        }

        // Default: Deny access
        return false;
    }
}
