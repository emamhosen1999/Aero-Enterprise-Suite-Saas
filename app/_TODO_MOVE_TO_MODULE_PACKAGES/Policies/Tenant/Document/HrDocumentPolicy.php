<?php

namespace App\Policies\Tenant\Document;

use Aero\HRM\Models\HrDocument;
use App\Models\Shared\User;
use App\Policies\Concerns\ChecksModuleAccess;
use Illuminate\Auth\Access\HandlesAuthorization;

class HrDocumentPolicy
{
    use ChecksModuleAccess, HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-documents', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, HrDocument $document): bool
    {
        // Employees can only see their own documents
        if ($document->user_id === $user->id) {
            return true;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-documents', 'view', $document);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-documents', 'manage');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, HrDocument $document): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-documents', 'manage', $document);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, HrDocument $document): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-documents', 'manage', $document);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, HrDocument $document): bool
    {
        return $this->delete($user, $document);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, HrDocument $document): bool
    {
        return $this->isSuperAdmin($user);
    }
}
