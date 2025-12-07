<?php

namespace App\Policies\Tenant\Safety;

use App\Models\SafetyTraining;
use App\Models\User;
use App\Policies\Concerns\ChecksModuleAccess;
use Illuminate\Auth\Access\HandlesAuthorization;

class SafetyTrainingPolicy
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

        // Check module access: hrm.employees.employee-directory.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SafetyTraining $safetyTraining): bool
    {
        // Employees can view trainings they're enrolled in
        if ($safetyTraining->participants()->where('user_id', $user->id)->exists() ||
            $safetyTraining->trainer_id === $user->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'view', $safetyTraining);
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
    public function update(User $user, SafetyTraining $safetyTraining): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'update', $safetyTraining);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SafetyTraining $safetyTraining): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.delete
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'delete', $safetyTraining);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SafetyTraining $safetyTraining): bool
    {
        return $this->delete($user, $safetyTraining);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SafetyTraining $safetyTraining): bool
    {
        return $this->isSuperAdmin($user);
    }
}
