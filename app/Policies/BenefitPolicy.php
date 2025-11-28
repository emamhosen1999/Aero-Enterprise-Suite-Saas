<?php

namespace App\Policies;

use App\Models\Benefit;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BenefitPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('hr.benefits.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Benefit $benefit): bool
    {
        // Basic permission check
        if (! $user->can('hr.benefits.view')) {
            return false;
        }

        // Employees can only see their assigned benefits
        if ($user->hasRole('Employee')) {
            return $benefit->employees()->where('user_id', $user->id)->exists();
        }

        // Department managers can only see benefits for their department members
        if ($user->hasRole('Department Manager') && $user->department_id) {
            return $benefit->employees()
                ->whereHas('department', function ($query) use ($user) {
                    $query->where('id', $user->department_id);
                })->exists();
        }

        // HR and higher roles can see all
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('hr.benefits.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Benefit $benefit): bool
    {
        return $user->can('hr.benefits.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Benefit $benefit): bool
    {
        return $user->can('hr.benefits.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Benefit $benefit): bool
    {
        return $user->can('hr.benefits.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Benefit $benefit): bool
    {
        return $user->can('hr.benefits.delete');
    }
}
