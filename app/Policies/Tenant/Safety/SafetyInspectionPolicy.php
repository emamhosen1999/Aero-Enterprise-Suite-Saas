<?php

namespace App\Policies\Tenant\Safety;

use App\Models\Tenant\HRM\SafetyInspection;
use App\Models\Shared\User;
use App\Policies\Concerns\ChecksModuleAccess;
use Illuminate\Auth\Access\HandlesAuthorization;

class SafetyInspectionPolicy
{
    use ChecksModuleAccess, HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.view (safety is part of employee management)
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'view', $safetyInspection);
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
    public function update(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'update', $safetyInspection);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.delete
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'delete', $safetyInspection);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SafetyInspection $safetyInspection): bool
    {
        return $this->delete($user, $safetyInspection);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SafetyInspection $safetyInspection): bool
    {
        return $this->isSuperAdmin($user);
    }
}
