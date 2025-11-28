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
     */
    public function delete(User $user, User $model): bool
    {
        // Cannot delete yourself
        if ($user->id === $model->id) {
            return false;
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
