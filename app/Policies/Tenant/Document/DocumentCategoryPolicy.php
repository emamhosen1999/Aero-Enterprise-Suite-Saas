<?php

namespace App\Policies\Tenant\Document;

use App\Models\Tenant\DMS\DocumentCategory;
use App\Models\Shared\User;
use App\Policies\Concerns\ChecksModuleAccess;
use Illuminate\Auth\Access\HandlesAuthorization;

class DocumentCategoryPolicy
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

        // Check module access: hrm.employees.employee-documents.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-documents', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, DocumentCategory $documentCategory): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-documents.view
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-documents', 'view');
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

        // Check module access: hrm.employees.employee-documents.manage
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-documents', 'manage');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, DocumentCategory $documentCategory): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-documents.manage
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-documents', 'manage');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, DocumentCategory $documentCategory): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-documents.manage
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-documents', 'manage');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, DocumentCategory $documentCategory): bool
    {
        return $this->delete($user, $documentCategory);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, DocumentCategory $documentCategory): bool
    {
        return $this->isSuperAdmin($user);
    }
}
