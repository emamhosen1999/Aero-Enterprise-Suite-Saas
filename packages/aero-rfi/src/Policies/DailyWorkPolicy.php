<?php

namespace Aero\Rfi\Policies;

use Aero\Core\Models\User;
use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\Rfi\Models\DailyWork;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * DailyWorkPolicy
 *
 * Controls access to Daily Work (RFI) operations using module access hierarchy.
 *
 * Access Path: rfi.daily-works.daily-work-list.{action}
 */
class DailyWorkPolicy
{
    use ChecksModuleAccess, HandlesAuthorization;

    /**
     * Determine whether the user can view any daily works.
     */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'view');
    }

    /**
     * Determine whether the user can view the daily work.
     */
    public function view(User $user, DailyWork $dailyWork): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check if user is incharge or assigned
        if ($dailyWork->incharge_user_id === $user->id || $dailyWork->assigned_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'view');
    }

    /**
     * Determine whether the user can create daily works.
     */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'create');
    }

    /**
     * Determine whether the user can update the daily work.
     */
    public function update(User $user, DailyWork $dailyWork): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'update');
    }

    /**
     * Determine whether the user can delete the daily work.
     */
    public function delete(User $user, DailyWork $dailyWork): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'delete');
    }

    /**
     * Determine whether the user can submit an RFI.
     */
    public function submit(User $user, DailyWork $dailyWork): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'submit');
    }

    /**
     * Determine whether the user can approve/reject inspection.
     */
    public function inspect(User $user, DailyWork $dailyWork): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'inspection', 'approve');
    }

    /**
     * Determine whether the user can override objections during submission.
     */
    public function override(User $user, DailyWork $dailyWork): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'override');
    }

    /**
     * Determine whether the user can import daily works.
     */
    public function import(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'import');
    }

    /**
     * Determine whether the user can export daily works.
     */
    public function export(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'daily-work-list', 'export');
    }

    /**
     * Determine whether the user can manage RFI files.
     */
    public function manageFiles(User $user, DailyWork $dailyWork): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Allow incharge/assigned users to manage files
        if ($dailyWork->incharge_user_id === $user->id || $dailyWork->assigned_user_id === $user->id) {
            return true;
        }

        return $this->canPerformAction($user, 'rfi', 'daily-works', 'rfi-files', 'upload');
    }

    /**
     * Determine whether the user can view daily work summary.
     */
    public function viewSummary(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canAccessComponent($user, 'rfi', 'daily-works', 'daily-work-summary');
    }

    /**
     * Determine whether the user can restore the daily work.
     */
    public function restore(User $user, DailyWork $dailyWork): bool
    {
        return $this->delete($user, $dailyWork);
    }

    /**
     * Determine whether the user can permanently delete the daily work.
     */
    public function forceDelete(User $user, DailyWork $dailyWork): bool
    {
        return $this->isSuperAdmin($user);
    }
}
