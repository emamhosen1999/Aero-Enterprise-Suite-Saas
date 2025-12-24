<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\HRM\Models\Offboarding;
use Aero\Core\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OffboardingPolicy
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

        // Check module access: hrm.employees.exit-termination.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'exit-termination', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Offboarding $offboarding): bool
    {
        // Employees can only see their own offboarding
        if ($offboarding->employee_id === $user->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope: hrm.employees.exit-termination.view
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'exit-termination', 'view', $offboarding);
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

        // Check module access: hrm.employees.exit-termination.offboard
        return $this->canPerformAction($user, 'hrm', 'employees', 'exit-termination', 'offboard');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Offboarding $offboarding): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.exit-termination.offboard
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'exit-termination', 'offboard', $offboarding);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Offboarding $offboarding): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.exit-termination.offboard
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'exit-termination', 'offboard', $offboarding);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Offboarding $offboarding): bool
    {
        return $this->delete($user, $offboarding);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Offboarding $offboarding): bool
    {
        return $this->isSuperAdmin($user);
    }
}
