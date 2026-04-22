<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\SafetyTraining;

class SafetyTrainingPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-training', 'view');
    }

    public function view(User $user, SafetyTraining $safetyTraining): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-training', 'view');
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-training', 'create');
    }

    public function update(User $user, SafetyTraining $safetyTraining): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-training', 'update');
    }

    public function delete(User $user, SafetyTraining $safetyTraining): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-training', 'delete');
    }

    public function restore(User $user, SafetyTraining $safetyTraining): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-training', 'delete');
    }

    public function forceDelete(User $user, SafetyTraining $safetyTraining): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-training', 'delete');
    }
}
