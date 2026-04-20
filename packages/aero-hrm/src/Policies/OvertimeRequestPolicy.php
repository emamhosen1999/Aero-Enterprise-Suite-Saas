<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\OvertimeRequest;

class OvertimeRequestPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'overtime', 'overtime-records', 'view');
    }

    public function view(User $user, OvertimeRequest $model): bool
    {
        if (isset($model->employee_id) && $model->employee?->user_id === $user->id) {
            return true;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'overtime', 'overtime-records', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'overtime', 'overtime-records', 'create');
    }

    public function update(User $user, OvertimeRequest $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'overtime', 'overtime-records', 'update');
    }

    public function delete(User $user, OvertimeRequest $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'overtime', 'overtime-records', 'delete');
    }

    public function approve(User $user, OvertimeRequest $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'overtime', 'overtime-records', 'approve');
    }

    public function reject(User $user, OvertimeRequest $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'overtime', 'overtime-records', 'reject');
    }
}
