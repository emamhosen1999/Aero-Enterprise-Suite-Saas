<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\Training;

class TrainingPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'training', 'training-programs', 'view');
    }

    public function view(User $user, Training $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'training', 'training-programs', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'training', 'training-programs', 'create');
    }

    public function update(User $user, Training $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'training', 'training-programs', 'update');
    }

    public function delete(User $user, Training $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'training', 'training-programs', 'delete');
    }
}
