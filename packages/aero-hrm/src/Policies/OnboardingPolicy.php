<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\HRM\Models\Onboarding;
use Aero\Core\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OnboardingPolicy
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

        // Check module access: hrm.employees.onboarding-wizard.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'onboarding-wizard', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Onboarding $onboarding): bool
    {
        // Employees can only see their own onboarding
        if ($onboarding->employee_id === $user->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope: hrm.employees.onboarding-wizard.view
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'onboarding-wizard', 'view', $onboarding);
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

        // Check module access: hrm.employees.onboarding-wizard.onboard
        return $this->canPerformAction($user, 'hrm', 'employees', 'onboarding-wizard', 'onboard');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Onboarding $onboarding): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.onboarding-wizard.onboard
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'onboarding-wizard', 'onboard', $onboarding);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Onboarding $onboarding): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.onboarding-wizard.onboard
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'onboarding-wizard', 'onboard', $onboarding);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Onboarding $onboarding): bool
    {
        return $this->delete($user, $onboarding);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Onboarding $onboarding): bool
    {
        return $this->isSuperAdmin($user);
    }
}
