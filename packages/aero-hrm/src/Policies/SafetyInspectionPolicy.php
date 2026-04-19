<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\SafetyInspection;

class SafetyInspectionPolicy
{
    use ChecksHRMAC;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.safety.inspections.view
        return $this->canPerformAction($user, 'hrm', 'safety', 'inspections', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.safety.inspections.view
        return $this->canPerformAction($user, 'hrm', 'safety', 'inspections', 'view');
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

        // Check module access: hrm.safety.inspections.create
        return $this->canPerformAction($user, 'hrm', 'safety', 'inspections', 'create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.safety.inspections.update
        return $this->canPerformAction($user, 'hrm', 'safety', 'inspections', 'update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.safety.inspections.delete
        return $this->canPerformAction($user, 'hrm', 'safety', 'inspections', 'delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.safety.inspections.delete
        return $this->canPerformAction($user, 'hrm', 'safety', 'inspections', 'delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SafetyInspection $safetyInspection): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.safety.inspections.delete
        return $this->canPerformAction($user, 'hrm', 'safety', 'inspections', 'delete');
    }
}
