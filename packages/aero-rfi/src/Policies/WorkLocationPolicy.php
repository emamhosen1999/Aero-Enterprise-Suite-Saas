<?php

namespace Aero\Rfi\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\Rfi\Models\WorkLocation;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * WorkLocationPolicy
 *
 * Controls access to Work Location operations using module access hierarchy.
 *
 * Access Path: rfi.work-locations.work-location-list.{action}
 */
class WorkLocationPolicy
{
    use ChecksHRMAC, HandlesAuthorization;

    /**
     * Determine whether the user can view any work locations.
     */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'work-locations', 'work-location-list', 'view');
    }

    /**
     * Determine whether the user can view the work location.
     */
    public function view(User $user, WorkLocation $workLocation): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Allow incharge user to view their locations
        if ($workLocation->incharge_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'work-locations', 'work-location-list', 'view');
    }

    /**
     * Determine whether the user can create work locations.
     */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'work-locations', 'work-location-list', 'create');
    }

    /**
     * Determine whether the user can update the work location.
     */
    public function update(User $user, WorkLocation $workLocation): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'work-locations', 'work-location-list', 'update');
    }

    /**
     * Determine whether the user can delete the work location.
     */
    public function delete(User $user, WorkLocation $workLocation): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Prevent deletion if work location has RFIs
        if ($workLocation->rfis()->count() > 0) {
            return false;
        }

        return $this->canPerformAction($user, 'rfi', 'work-locations', 'work-location-list', 'delete');
    }

    /**
     * Determine whether the user can restore the work location.
     */
    public function restore(User $user, WorkLocation $workLocation): bool
    {
        return $this->delete($user, $workLocation);
    }

    /**
     * Determine whether the user can permanently delete the work location.
     */
    public function forceDelete(User $user, WorkLocation $workLocation): bool
    {
        return $this->isSuperAdmin($user);
    }
}
