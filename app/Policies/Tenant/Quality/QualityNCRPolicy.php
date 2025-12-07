<?php

namespace App\Policies\Tenant\Quality;

use App\Models\Tenant\Quality\QualityNCR;
use App\Models\Shared\User;
use App\Policies\Concerns\ChecksModuleAccess;
use Illuminate\Auth\Access\HandlesAuthorization;

class QualityNCRPolicy
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

        // Check module access: quality.ncr.ncr-list.view
        return $this->canPerformAction($user, 'quality', 'ncr', 'ncr-list', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, QualityNCR $qualityNCR): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: quality.ncr.ncr-list.view
        return $this->canPerformAction($user, 'quality', 'ncr', 'ncr-list', 'view');
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

        // Check module access: quality.ncr.ncr-list.create
        return $this->canPerformAction($user, 'quality', 'ncr', 'ncr-list', 'create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, QualityNCR $qualityNCR): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: quality.ncr.ncr-list.update
        return $this->canPerformAction($user, 'quality', 'ncr', 'ncr-list', 'update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, QualityNCR $qualityNCR): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: quality.ncr.ncr-list.delete
        return $this->canPerformAction($user, 'quality', 'ncr', 'ncr-list', 'delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, QualityNCR $qualityNCR): bool
    {
        return $this->update($user, $qualityNCR);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, QualityNCR $qualityNCR): bool
    {
        return $this->isSuperAdmin($user);
    }
}
