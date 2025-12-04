<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('users.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        // Users can view themselves, or if they have permission
        return $user->id === $model->id || $user->hasPermissionTo('users.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('users.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Users can update themselves (limited fields), or with permission
        if ($user->id === $model->id) {
            return true;
        }

        // Super admins can update anyone
        if ($user->hasRole('Super Administrator')) {
            return true;
        }

        // HR managers can update employees in their organization
        if ($user->hasRole(['Administrator', 'HR Manager'])) {
            return $user->hasPermissionTo('users.update');
        }

        // Department managers can update users in their department
        if ($user->hasRole('Department Manager') &&
            $user->department_id === $model->department_id) {
            return $user->hasPermissionTo('users.update');
        }

        return false;
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

        // Platform Super admins can delete anyone (after last super admin check)
        if ($user->hasRole('platform_super_administrator')) {
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
        // Check if user has platform_super_administrator role
        if ($user->hasRole('platform_super_administrator')) {
            $platformSuperAdminCount = User::whereHas('roles', function ($query) {
                $query->where('name', 'platform_super_administrator')
                    ->where('scope', 'platform');
            })->count();

            // If this is the last platform super admin, block deletion
            if ($platformSuperAdminCount <= 1) {
                return true;
            }
        }

        // Check if user has tenant_super_administrator role
        if ($user->hasRole('tenant_super_administrator') && $user->tenant_id) {
            $tenantSuperAdminCount = User::whereHas('roles', function ($query) use ($user) {
                $query->where('name', 'tenant_super_administrator')
                    ->where('scope', 'tenant')
                    ->where('tenant_id', $user->tenant_id);
            })
                ->where('tenant_id', $user->tenant_id)
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
        return $user->hasPermissionTo('users.delete'); // Same as delete permission
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        // Only super administrators can permanently delete
        return $user->hasRole('Super Administrator');
    }

    /**
     * Determine whether the user can update roles.
     */
    public function updateRoles(User $user, User $model): bool
    {
        // Cannot change your own roles
        if ($user->id === $model->id) {
            return false;
        }

        return $user->hasPermissionTo('users.update') &&
               $user->hasRole(['Super Administrator', 'Administrator']);
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

        return $user->hasPermissionTo('users.update');
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

        // Admins can manage any user's devices
        return $user->hasPermissionTo('users.update');
    }

    /**
     * Determine whether the user can update department.
     */
    public function updateDepartment(User $user, User $model): bool
    {
        // HR managers and admins can update departments
        return $user->hasRole(['Super Administrator', 'Administrator', 'HR Manager']) &&
               $user->hasPermissionTo('users.update');
    }

    /**
     * Determine whether the user can update designation.
     */
    public function updateDesignation(User $user, User $model): bool
    {
        // HR managers and admins can update designations
        return $user->hasRole(['Super Administrator', 'Administrator', 'HR Manager']) &&
               $user->hasPermissionTo('users.update');
    }

    /**
     * Determine whether the user can update attendance type.
     */
    public function updateAttendanceType(User $user, User $model): bool
    {
        // HR managers and admins can update attendance types
        return $user->hasRole(['Super Administrator', 'Administrator', 'HR Manager']) &&
               $user->hasPermissionTo('users.update');
    }
}
