<?php

namespace App\Policies\Tenant\HRM;

use App\Models\Tenant\HRM\OffboardingStep;
use App\Models\Shared\User;
use App\Policies\Concerns\ChecksModuleAccess;

class OffboardingStepPolicy
{
    use ChecksModuleAccess;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'exit-termination', 'view');
    }

    public function view(User $user, OffboardingStep $step): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'exit-termination', 'view');
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'exit-termination', 'offboard');
    }

    public function update(User $user, OffboardingStep $step): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'exit-termination', 'offboard');
    }

    public function delete(User $user, OffboardingStep $step): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'exit-termination', 'offboard');
    }
}
