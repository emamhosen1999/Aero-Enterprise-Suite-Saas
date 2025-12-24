<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\HRM\Models\Attendance;
use Aero\Core\Models\User;

class AttendancePolicy
{
    use ChecksModuleAccess;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.attendance.daily-attendance.view
        return $this->canPerformAction($user, 'hrm', 'attendance', 'daily-attendance', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Attendance $attendance): bool
    {
        // Users can view their own attendance
        if ($attendance->user_id === $user->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope: hrm.attendance.daily-attendance.view
        return $this->canPerformActionWithScope($user, 'hrm', 'attendance', 'daily-attendance', 'view', $attendance);
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

        // Check module access: hrm.attendance.daily-attendance.mark
        return $this->canPerformAction($user, 'hrm', 'attendance', 'daily-attendance', 'mark');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Attendance $attendance): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.attendance.daily-attendance.update
        return $this->canPerformActionWithScope($user, 'hrm', 'attendance', 'daily-attendance', 'update', $attendance);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Attendance $attendance): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.attendance.daily-attendance.delete
        return $this->canPerformActionWithScope($user, 'hrm', 'attendance', 'daily-attendance', 'delete', $attendance);
    }
}
