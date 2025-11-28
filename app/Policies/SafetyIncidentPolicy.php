<?php

namespace App\Policies;

use App\Models\SafetyIncident;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SafetyIncidentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('hr.safety.incidents.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SafetyIncident $safetyIncident): bool
    {
        // Basic permission check
        if (! $user->can('hr.safety.incidents.view')) {
            return false;
        }

        // Employees can view incidents they're involved in
        if ($user->hasRole('Employee')) {
            return $safetyIncident->participants()->where('user_id', $user->id)->exists() ||
                   $safetyIncident->reported_by === $user->id;
        }

        // Department managers can only see incidents in their department
        if ($user->hasRole('Department Manager') && $user->department_id) {
            // Check if incident is in manager's department
            return $safetyIncident->department_id === $user->department_id;
        }

        // HR, Safety Officers, and higher roles can see all
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('hr.safety.incidents.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SafetyIncident $safetyIncident): bool
    {
        return $user->can('hr.safety.incidents.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SafetyIncident $safetyIncident): bool
    {
        return $user->can('hr.safety.incidents.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SafetyIncident $safetyIncident): bool
    {
        return $user->can('hr.safety.incidents.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SafetyIncident $safetyIncident): bool
    {
        return $user->can('hr.safety.incidents.delete');
    }
}
