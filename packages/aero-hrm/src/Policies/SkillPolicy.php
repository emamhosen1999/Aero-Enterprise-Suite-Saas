<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\HRM\Models\Skill;
use Aero\Core\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SkillPolicy
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

        // Check module access: hrm.employees.employee-directory.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Skill $skill): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
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

        // Check module access: hrm.employees.employee-directory.create
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Skill $skill): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Skill $skill): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.delete
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Skill $skill): bool
    {
        return $this->delete($user, $skill);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Skill $skill): bool
    {
        return $this->isSuperAdmin($user);
    }
}
