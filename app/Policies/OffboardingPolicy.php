<?php

namespace App\Policies;

use App\Models\HRM\Offboarding;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OffboardingPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('hr.offboarding.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Offboarding $offboarding): bool
    {
        // Basic permission check
        if (! $user->can('hr.offboarding.view')) {
            return false;
        }

        // Department managers can only see offboarding for their department members
        if ($user->hasRole('Department Manager') && $user->department_id) {
            return $offboarding->employee && $offboarding->employee->department_id === $user->department_id;
        }

        // Employees can only see their own offboarding
        if ($user->hasRole('Employee')) {
            return $offboarding->employee_id === $user->id;
        }

        // HR and higher roles can see all
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('hr.offboarding.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Offboarding $offboarding): bool
    {
        return $user->can('hr.offboarding.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Offboarding $offboarding): bool
    {
        return $user->can('hr.offboarding.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Offboarding $offboarding): bool
    {
        return $user->can('hr.offboarding.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Offboarding $offboarding): bool
    {
        return $user->can('hr.offboarding.delete');
    }
}
