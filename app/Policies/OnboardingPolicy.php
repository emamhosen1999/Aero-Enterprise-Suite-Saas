<?php

namespace App\Policies;

use App\Models\HRM\Onboarding;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OnboardingPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('hr.onboarding.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Onboarding $onboarding): bool
    {
        // Basic permission check
        if (! $user->can('hr.onboarding.view')) {
            return false;
        }

        // Department managers can only see onboarding for their department members
        if ($user->hasRole('Department Manager') && $user->department_id) {
            return $onboarding->employee && $onboarding->employee->department_id === $user->department_id;
        }

        // Employees can only see their own onboarding
        if ($user->hasRole('Employee')) {
            return $onboarding->employee_id === $user->id;
        }

        // HR and higher roles can see all
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('hr.onboarding.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Onboarding $onboarding): bool
    {
        return $user->can('hr.onboarding.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Onboarding $onboarding): bool
    {
        return $user->can('hr.onboarding.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Onboarding $onboarding): bool
    {
        return $user->can('hr.onboarding.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Onboarding $onboarding): bool
    {
        return $user->can('hr.onboarding.delete');
    }
}
