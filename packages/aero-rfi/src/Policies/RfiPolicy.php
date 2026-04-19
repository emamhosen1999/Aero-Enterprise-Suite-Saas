<?php

namespace Aero\Rfi\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\Rfi\Models\Rfi;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * RfiPolicy
 *
 * Controls access to RFI operations using module access hierarchy.
 *
 * Access Path: rfi.rfis.rfi-list.{action}
 */
class RfiPolicy
{
    use ChecksHRMAC, HandlesAuthorization;

    /**
     * Determine whether the user can view any RFIs.
     */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'view');
    }

    /**
     * Determine whether the user can view the RFI.
     */
    public function view(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check if user is incharge or assigned
        if ($rfi->incharge_user_id === $user->id || $rfi->assigned_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'view');
    }

    /**
     * Determine whether the user can create RFIs.
     */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'create');
    }

    /**
     * Determine whether the user can update the RFI.
     */
    public function update(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'update');
    }

    /**
     * Determine whether the user can delete the RFI.
     */
    public function delete(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'delete');
    }

    /**
     * Determine whether the user can submit an RFI.
     */
    public function submit(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'submit');
    }

    /**
     * Determine whether the user can approve/reject inspection.
     */
    public function inspect(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'inspection', 'approve');
    }

    /**
     * Determine whether the user can override objections during submission.
     */
    public function override(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'override');
    }

    /**
     * Determine whether the user can import RFIs.
     */
    public function import(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'import');
    }

    /**
     * Determine whether the user can export RFIs.
     */
    public function export(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'export');
    }

    /**
     * Determine whether the user can manage RFI files.
     */
    public function manageFiles(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Allow incharge/assigned users to manage files
        if ($rfi->incharge_user_id === $user->id || $rfi->assigned_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-files', 'upload');
    }

    /**
     * Determine whether the user can update the status of the RFI.
     */
    public function updateStatus(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Incharge or assigned can update status
        if ($rfi->incharge_user_id === $user->id || $rfi->assigned_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'update');
    }

    /**
     * Determine whether the user can update the completion time.
     */
    public function updateCompletionTime(User $user, Rfi $rfi): bool
    {
        return $this->updateStatus($user, $rfi);
    }

    /**
     * Determine whether the user can update the submission time.
     */
    public function updateSubmissionTime(User $user, Rfi $rfi): bool
    {
        return $this->updateStatus($user, $rfi);
    }

    /**
     * Determine whether the user can update the inspection details.
     */
    public function updateInspectionDetails(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Incharge or assigned can update inspection details
        if ($rfi->incharge_user_id === $user->id || $rfi->assigned_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'update');
    }

    /**
     * Determine whether the user can update the incharge.
     */
    public function updateIncharge(User $user, Rfi $rfi): bool
    {
        // Only admins can change incharge
        return $this->isSuperAdmin($user);
    }

    /**
     * Determine whether the user can update the assigned user.
     */
    public function updateAssigned(User $user, Rfi $rfi): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Incharge can assign
        if ($rfi->incharge_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'rfis', 'rfi-list', 'update');
    }

    /**
     * Determine whether the user can view RFI summary.
     */
    public function viewSummary(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canAccessComponent($user, 'rfi', 'rfis', 'rfi-summary');
    }

    /**
     * Determine whether the user can restore the RFI.
     */
    public function restore(User $user, Rfi $rfi): bool
    {
        return $this->delete($user, $rfi);
    }

    /**
     * Determine whether the user can permanently delete the RFI.
     */
    public function forceDelete(User $user, Rfi $rfi): bool
    {
        return $this->isSuperAdmin($user);
    }
}
