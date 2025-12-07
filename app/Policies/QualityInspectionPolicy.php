<?php

namespace App\Policies;

use App\Models\QualityInspection;
use App\Models\User;
use App\Policies\Concerns\ChecksModuleAccess;
use Illuminate\Auth\Access\HandlesAuthorization;

class QualityInspectionPolicy
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

        // Check module access: quality.inspections.inspection-list.view
        return $this->canPerformAction($user, 'quality', 'inspections', 'inspection-list', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, QualityInspection $qualityInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: quality.inspections.inspection-list.view
        return $this->canPerformAction($user, 'quality', 'inspections', 'inspection-list', 'view');
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

        // Check module access: quality.inspections.inspection-list.create
        return $this->canPerformAction($user, 'quality', 'inspections', 'inspection-list', 'create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, QualityInspection $qualityInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: quality.inspections.inspection-list.update
        return $this->canPerformAction($user, 'quality', 'inspections', 'inspection-list', 'update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, QualityInspection $qualityInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: quality.inspections.inspection-list.delete
        return $this->canPerformAction($user, 'quality', 'inspections', 'inspection-list', 'delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, QualityInspection $qualityInspection): bool
    {
        return $this->update($user, $qualityInspection);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, QualityInspection $qualityInspection): bool
    {
        return $this->isSuperAdmin($user);
    }
}
