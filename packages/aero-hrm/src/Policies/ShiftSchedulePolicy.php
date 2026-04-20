<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\ShiftSchedule;

class ShiftSchedulePolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'attendance', 'shift-scheduling', 'view');
    }

    public function view(User $user, ShiftSchedule $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'attendance', 'shift-scheduling', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'attendance', 'shift-scheduling', 'create');
    }

    public function update(User $user, ShiftSchedule $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'attendance', 'shift-scheduling', 'update');
    }

    public function delete(User $user, ShiftSchedule $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'attendance', 'shift-scheduling', 'delete');
    }
}
