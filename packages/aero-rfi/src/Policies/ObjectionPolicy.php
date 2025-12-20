<?php

namespace Aero\Rfi\Policies;

use Aero\Core\Models\User;
use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\Rfi\Models\Objection;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * ObjectionPolicy
 *
 * Controls access to Objection operations using module access hierarchy.
 *
 * Access Path: rfi.objections.objection-list.{action}
 */
class ObjectionPolicy
{
    use ChecksModuleAccess, HandlesAuthorization;

    /**
     * Determine whether the user can view any objections.
     */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'view');
    }

    /**
     * Determine whether the user can view the objection.
     */
    public function view(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Allow creator to view their own objections
        if ($objection->created_by === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'view');
    }

    /**
     * Determine whether the user can create objections.
     */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'create');
    }

    /**
     * Determine whether the user can update the objection.
     */
    public function update(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Only allow updates if objection is still in draft status
        if ($objection->status !== Objection::STATUS_DRAFT) {
            return false;
        }

        // Allow creator to update their own draft objections
        if ($objection->created_by === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'update');
    }

    /**
     * Determine whether the user can delete the objection.
     */
    public function delete(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Only allow deletion if objection is still in draft status
        if ($objection->status !== Objection::STATUS_DRAFT) {
            return false;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'delete');
    }

    /**
     * Determine whether the user can submit the objection.
     */
    public function submit(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Must be in draft status
        if ($objection->status !== Objection::STATUS_DRAFT) {
            return false;
        }

        // Allow creator to submit their own objections
        if ($objection->created_by === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'submit');
    }

    /**
     * Determine whether the user can review (start review process) the objection.
     */
    public function review(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canAccessComponent($user, 'rfi', 'objections', 'objection-review');
    }

    /**
     * Determine whether the user can resolve the objection.
     */
    public function resolve(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Must be in submitted or under_review status
        if (! in_array($objection->status, [Objection::STATUS_SUBMITTED, Objection::STATUS_UNDER_REVIEW])) {
            return false;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-review', 'resolve');
    }

    /**
     * Determine whether the user can reject the objection.
     */
    public function reject(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Must be in submitted or under_review status
        if (! in_array($objection->status, [Objection::STATUS_SUBMITTED, Objection::STATUS_UNDER_REVIEW])) {
            return false;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-review', 'reject');
    }

    /**
     * Determine whether the user can attach objection to RFIs.
     */
    public function attachToRfis(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Allow if user can create or update objections
        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'create')
            || $this->canPerformAction($user, 'rfi', 'objections', 'objection-list', 'update');
    }

    /**
     * Determine whether the user can manage objection files.
     */
    public function manageFiles(User $user, Objection $objection): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Allow creator to manage files on their objections
        if ($objection->created_by === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'objections', 'objection-files', 'upload');
    }

    /**
     * Determine whether the user can restore the objection.
     */
    public function restore(User $user, Objection $objection): bool
    {
        return $this->delete($user, $objection);
    }

    /**
     * Determine whether the user can permanently delete the objection.
     */
    public function forceDelete(User $user, Objection $objection): bool
    {
        return $this->isSuperAdmin($user);
    }
}
