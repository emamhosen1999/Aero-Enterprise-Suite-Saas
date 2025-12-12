<?php

namespace Aero\Core\Policies\Concerns;

use Aero\Core\Models\User;
use Aero\Core\Services\ModuleAccessService;

/**
 * Trait ChecksModuleAccess
 *
 * Provides consistent module access checking for policies.
 * Replaces permission-based checks with role-based module access.
 *
 * Access Formula: User Access = Super Admin Bypass OR (Plan Access ∩ Role Module Access)
 *
 * Usage in policies:
 * ```php
 * use ChecksModuleAccess;
 *
 * public function viewAny(User $user): bool
 * {
 *     return $this->canAccessModule($user, 'hrm');
 * }
 *
 * public function create(User $user): bool
 * {
 *     return $this->canPerformAction($user, 'hrm', 'employees', 'employee-list', 'create');
 * }
 * ```
 */
trait ChecksModuleAccess
{
    /**
     * Get the module access service instance.
     */
    protected function getModuleAccessService(): ModuleAccessService
    {
        return app(ModuleAccessService::class);
    }

    /**
     * Check if user is Super Administrator (bypasses all checks).
     */
    protected function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('Super Administrator') || $user->hasRole('tenant_super_administrator');
    }

    /**
     * Check if user can access a module.
     *
     * @param User $user The user to check
     * @param string $moduleCode The module code (e.g., 'hrm')
     * @return bool
     */
    protected function canAccessModule(User $user, string $moduleCode): bool
    {
        // Super Admins bypass all checks
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        $result = $this->getModuleAccessService()->canAccessModule($user, $moduleCode);

        return $result['allowed'];
    }

    /**
     * Check if user can access a submodule.
     *
     * @param User $user The user to check
     * @param string $moduleCode The module code (e.g., 'hrm')
     * @param string $subModuleCode The submodule code (e.g., 'employees')
     * @return bool
     */
    protected function canAccessSubModule(User $user, string $moduleCode, string $subModuleCode): bool
    {
        // Super Admins bypass all checks
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        $result = $this->getModuleAccessService()->canAccessSubModule($user, $moduleCode, $subModuleCode);

        return $result['allowed'];
    }

    /**
     * Check if user can access a component.
     *
     * @param User $user The user to check
     * @param string $moduleCode The module code (e.g., 'hrm')
     * @param string $subModuleCode The submodule code (e.g., 'employees')
     * @param string $componentCode The component code (e.g., 'employee-list')
     * @return bool
     */
    protected function canAccessComponent(User $user, string $moduleCode, string $subModuleCode, string $componentCode): bool
    {
        // Super Admins bypass all checks
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        $result = $this->getModuleAccessService()->canAccessComponent($user, $moduleCode, $subModuleCode, $componentCode);

        return $result['allowed'];
    }

    /**
     * Check if user can perform an action.
     *
     * @param User $user The user to check
     * @param string $moduleCode The module code (e.g., 'hrm')
     * @param string $subModuleCode The submodule code (e.g., 'employees')
     * @param string $componentCode The component code (e.g., 'employee-list')
     * @param string $actionCode The action code (e.g., 'create', 'view', 'update', 'delete')
     * @return bool
     */
    protected function canPerformAction(
        User $user,
        string $moduleCode,
        string $subModuleCode,
        string $componentCode,
        string $actionCode
    ): bool {
        // Super Admins bypass all checks
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        $result = $this->getModuleAccessService()->canPerformAction(
            $user,
            $moduleCode,
            $subModuleCode,
            $componentCode,
            $actionCode
        );

        return $result['allowed'];
    }

    /**
     * Check if user can access their own resources (for own-scope access).
     *
     * @param User $user The authenticated user
     * @param User|object $model The model being accessed (should have user_id or similar)
     * @param string $ownerField The field that identifies ownership (default: 'user_id')
     * @return bool
     */
    protected function isOwner(User $user, $model, string $ownerField = 'user_id'): bool
    {
        if (! isset($model->$ownerField)) {
            return false;
        }

        return $user->id === $model->$ownerField;
    }

    /**
     * Check if user is in the same department as the model.
     *
     * @param User $user The authenticated user
     * @param object $model The model being accessed (should have department_id or employee.department_id)
     * @return bool
     */
    protected function isSameDepartment(User $user, $model): bool
    {
        $userDepartmentId = $user->employee?->department_id;

        if (! $userDepartmentId) {
            return false;
        }

        // Check direct department_id
        if (isset($model->department_id)) {
            return $userDepartmentId === $model->department_id;
        }

        // Check through employee relationship
        if (isset($model->user) && isset($model->user->employee)) {
            return $userDepartmentId === $model->user->employee->department_id;
        }

        return false;
    }

    /**
     * Check access with scope consideration.
     *
     * This method checks both module access AND scope-based restrictions.
     * Useful for policies that need to respect data access scopes (own, department, team, all).
     *
     * @param User $user The user to check
     * @param string $moduleCode Module code
     * @param string $subModuleCode Submodule code
     * @param string $componentCode Component code
     * @param string $actionCode Action code
     * @param object|null $model The model being accessed (for scope checking)
     * @return bool
     */
    protected function canPerformActionWithScope(
        User $user,
        string $moduleCode,
        string $subModuleCode,
        string $componentCode,
        string $actionCode,
        ?object $model = null
    ): bool {
        // Super Admins bypass all checks
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // First check if user has action access
        $result = $this->getModuleAccessService()->canPerformAction(
            $user,
            $moduleCode,
            $subModuleCode,
            $componentCode,
            $actionCode
        );

        if (! $result['allowed']) {
            return false;
        }

        // If no model provided, only check action access
        if ($model === null) {
            return true;
        }

        // Get user's access scope for this action
        $service = $this->getModuleAccessService();
        $actionRecord = \App\Models\ModuleComponentAction::whereHas('component', function ($q) use ($componentCode, $subModuleCode, $moduleCode) {
            $q->where('code', $componentCode)
                ->whereHas('subModule', function ($q2) use ($subModuleCode, $moduleCode) {
                    $q2->where('code', $subModuleCode)
                        ->whereHas('module', function ($q3) use ($moduleCode) {
                            $q3->where('code', $moduleCode);
                        });
                });
        })->where('code', $actionCode)->first();

        if (! $actionRecord) {
            return true; // If action not found, allow (fallback)
        }

        $scope = $service->getUserAccessScope($user, $actionRecord->id);

        // Check scope
        switch ($scope) {
            case 'all':
                return true;

            case 'department':
                return $this->isSameDepartment($user, $model);

            case 'team':
                // Team logic can be implemented based on your team structure
                // For now, fallback to department
                return $this->isSameDepartment($user, $model);

            case 'own':
                return $this->isOwner($user, $model);

            default:
                return false;
        }
    }
}
