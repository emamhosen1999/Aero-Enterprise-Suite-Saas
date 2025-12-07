<?php

namespace App\Policies\Tenant\Safety;

use App\Models\Tenant\HRM\SafetyIncident;
use App\Models\Shared\User;
use App\Policies\Concerns\ChecksModuleAccess;
use Illuminate\Auth\Access\HandlesAuthorization;

class SafetyIncidentPolicy
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
    public function view(User $user, SafetyIncident $safetyIncident): bool
    {
        // Employees can view incidents they're involved in
        if ($safetyIncident->participants()->where('user_id', $user->id)->exists() ||
            $safetyIncident->reported_by === $user->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'view', $safetyIncident);
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
    public function update(User $user, SafetyIncident $safetyIncident): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'update', $safetyIncident);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SafetyIncident $safetyIncident): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.delete
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'delete', $safetyIncident);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SafetyIncident $safetyIncident): bool
    {
        return $this->delete($user, $safetyIncident);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SafetyIncident $safetyIncident): bool
    {
        return $this->isSuperAdmin($user);
    }
}
