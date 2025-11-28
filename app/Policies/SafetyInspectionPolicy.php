<?php

namespace App\Policies;

use App\Models\SafetyInspection;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SafetyInspectionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('hr.safety.inspections.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SafetyInspection $safetyInspection): bool
    {
        // Basic permission check
        if (! $user->can('hr.safety.inspections.view')) {
            return false;
        }

        // Department managers can only see inspections in their department
        if ($user->hasRole('Department Manager') && $user->department_id) {
            return $safetyInspection->department_id === $user->department_id;
        }

        // HR, Safety Officers, and higher roles can see all
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('hr.safety.inspections.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SafetyInspection $safetyInspection): bool
    {
        return $user->can('hr.safety.inspections.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SafetyInspection $safetyInspection): bool
    {
        return $user->can('hr.safety.inspections.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SafetyInspection $safetyInspection): bool
    {
        return $user->can('hr.safety.inspections.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SafetyInspection $safetyInspection): bool
    {
        return $user->can('hr.safety.inspections.delete');
    }
}
