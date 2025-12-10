<?php

namespace Aero\Core\Policies;

use Aero\Core\Models\User;
use Aero\Core\Policies\Concerns\ChecksModuleAccess;

class UserPolicy
{
    use ChecksModuleAccess;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        // Users can view themselves
        if ($user->id === $model->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'view', $model);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.create
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'create');
    }


    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Users can update themselves (limited fields)
        if ($user->id === $model->id) {
            return true;
        }

        // Super admins can update anyone
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'update', $model);
    }

    /**
     * Determine whether the user can delete the model.
     *
     * CRITICAL: Users with protected Super Admin roles cannot be deleted if they are the last one.
     */
    public function delete(User $user, User $model): bool
    {
        // Cannot delete yourself
        if ($user->id === $model->id) {
            return false;
        }

        // CRITICAL: Check if user being deleted has a protected role (Super Administrator)
        // If so, ensure they are not the last Super Admin in their scope (Section 3, Rule 3)
        if ($this->isLastSuperAdminInScope($model)) {
            return false;
        }

        // Super admins can delete anyone (after last super admin check)
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Tenant Super admins can delete users in their tenant
        if ($user->hasRole('tenant_super_administrator')) {
            return true;
        }

        // Super admins can delete anyone
        if ($user->hasRole('Super Administrator')) {
            return true;
        }

        // HR managers and administrators can delete
        if ($user->hasRole(['Administrator', 'HR Manager'])) {
            return $user->hasPermissionTo('users.delete');
        }

        return false;
    }

    /**
     * Check if user is the last Super Administrator in their scope.
     *
     * Compliance: Section 3, Rule 3 & 4
     */
    protected function isLastSuperAdminInScope(User $user): bool
    {
        // Check if user has Super Administrator role
        if ($user->hasRole('Super Administrator')) {
            $platformSuperAdminCount = User::whereHas('roles', function ($query) {
                $query->where('name', 'Super Administrator')
                    ->where('scope', 'platform');
            })->count();

            // If this is the last platform super admin, block deletion
            if ($platformSuperAdminCount <= 1) {
                return true;
            }
        }

        // Check if user has tenant_super_administrator role
        if ($user->hasRole('Super Administrator')) {
            $tenantSuperAdminCount = User::whereHas('roles', function ($query) {
                $query->where('name', 'Super Administrator')
                    ->where('scope', 'tenant');
            })
                ->count();

            // If this is the last tenant super admin, block deletion
            if ($tenantSuperAdminCount <= 1) {
                return true;
            }
        }

        return false;
    }


    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.delete (same as delete)
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'delete', $model);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        // Only super administrators can permanently delete
        return $this->isSuperAdmin($user);
    }

    /**
     * Determine whether the user can update roles.
     *
     * CRITICAL: Super Administrator users' roles cannot be changed.
     */
    public function updateRoles(User $user, User $model): bool
    {
        // Cannot change your own roles
        if ($user->id === $model->id) {
            return false;
        }

        // CRITICAL: Super Administrator users' roles cannot be changed (Protected)
        if ($model->hasRole(['Super Administrator'])) {
            return false;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'update');
    }

    /**
     * Determine whether the user can toggle status (active/inactive).
     */
    public function toggleStatus(User $user, User $model): bool
    {
        // Cannot deactivate yourself
        if ($user->id === $model->id) {
            return false;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.change-status
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'change-status');
    }

    /**
     * Determine whether the user can manage devices.
     */
    public function manageDevices(User $user, User $model): bool
    {
        // Users can manage their own devices
        if ($user->id === $model->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'update', $model);
    }

    /**
     * Determine whether the user can update department.
     */
    public function updateDepartment(User $user, User $model): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'update');
    }

    /**
     * Determine whether the user can update designation.
     */
    public function updateDesignation(User $user, User $model): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'update');
    }

    /**
     * Determine whether the user can update attendance type.
     */
    public function updateAttendanceType(User $user, User $model): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'update');
    }
}
