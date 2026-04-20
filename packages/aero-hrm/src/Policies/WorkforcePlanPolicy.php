<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\WorkforcePlan;

class WorkforcePlanPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'workforce-planning', 'workforce-plans', 'view');
    }

    public function view(User $user, WorkforcePlan $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'workforce-planning', 'workforce-plans', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'workforce-planning', 'workforce-plans', 'create');
    }

    public function update(User $user, WorkforcePlan $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'workforce-planning', 'workforce-plans', 'update');
    }

    public function delete(User $user, WorkforcePlan $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'workforce-planning', 'workforce-plans', 'delete');
    }
}
