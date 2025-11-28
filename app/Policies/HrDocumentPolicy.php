<?php

namespace App\Policies;

use App\Models\HRM\HrDocument;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class HrDocumentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('hr.documents.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, HrDocument $document): bool
    {
        // Basic permission check
        if (! $user->can('hr.documents.view')) {
            return false;
        }

        // If the document is linked to a specific employee
        if ($document->user_id) {
            // Department managers can only see documents for their department members
            if ($user->hasRole('Department Manager') && $user->department_id) {
                return $document->user->department_id === $user->department_id;
            }

            // Employees can only see their own documents
            if ($user->hasRole('Employee')) {
                return $document->user_id === $user->id;
            }
        }

        // HR and higher roles can see all
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('hr.documents.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, HrDocument $document): bool
    {
        return $user->can('hr.documents.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, HrDocument $document): bool
    {
        return $user->can('hr.documents.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, HrDocument $document): bool
    {
        return $user->can('hr.documents.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, HrDocument $document): bool
    {
        return $user->can('hr.documents.delete');
    }
}
