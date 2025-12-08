<?php

namespace App\Policies\Tenant\Document;

use Aero\HRM\Models\Checklist;
use App\Models\Shared\User;
use App\Policies\Concerns\ChecksModuleAccess;

class ChecklistPolicy
{
    use ChecksModuleAccess;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
    }

    public function view(User $user, Checklist $checklist): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'create');
    }

    public function update(User $user, Checklist $checklist): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'update');
    }

    public function delete(User $user, Checklist $checklist): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'delete');
    }

    public function restore(User $user, Checklist $checklist): bool
    {
        return $this->update($user, $checklist);
    }

    public function forceDelete(User $user, Checklist $checklist): bool
    {
        return false; // not allowed
    }
}
