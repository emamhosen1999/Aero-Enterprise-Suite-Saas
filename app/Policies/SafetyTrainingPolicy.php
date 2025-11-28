<?php

namespace App\Policies;

use App\Models\SafetyTraining;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SafetyTrainingPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('hr.safety.training.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SafetyTraining $safetyTraining): bool
    {
        // Basic permission check
        if (! $user->can('hr.safety.training.view')) {
            return false;
        }

        // Employees can view trainings they're enrolled in
        if ($user->hasRole('Employee')) {
            return $safetyTraining->participants()->where('user_id', $user->id)->exists() ||
                   $safetyTraining->trainer_id === $user->id;
        }

        // Department managers can only see trainings in their department
        if ($user->hasRole('Department Manager') && $user->department_id) {
            return $safetyTraining->department_id === $user->department_id;
        }

        // HR, Safety Officers, and higher roles can see all
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('hr.safety.training.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SafetyTraining $safetyTraining): bool
    {
        return $user->can('hr.safety.training.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SafetyTraining $safetyTraining): bool
    {
        return $user->can('hr.safety.training.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SafetyTraining $safetyTraining): bool
    {
        return $user->can('hr.safety.training.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SafetyTraining $safetyTraining): bool
    {
        return $user->can('hr.safety.training.delete');
    }
}
