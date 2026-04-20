<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\Warning;

class WarningPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'disciplinary', 'warnings', 'view');
    }

    public function view(User $user, Warning $model): bool
    {
        if (isset($model->employee_id) && $model->employee?->user_id === $user->id) {
            return true;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'disciplinary', 'warnings', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'disciplinary', 'warnings', 'create');
    }

    public function update(User $user, Warning $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'disciplinary', 'warnings', 'update');
    }

    public function delete(User $user, Warning $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'disciplinary', 'warnings', 'delete');
    }
}
