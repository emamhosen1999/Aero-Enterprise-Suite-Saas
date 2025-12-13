<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\HRM\Models\OnboardingStep;
use Aero\Core\Models\User;

class OnboardingStepPolicy
{
    use ChecksModuleAccess;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'onboarding-wizard', 'view');
    }

    public function view(User $user, OnboardingStep $step): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'onboarding-wizard', 'view');
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'onboarding-wizard', 'onboard');
    }

    public function update(User $user, OnboardingStep $step): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'onboarding-wizard', 'onboard');
    }

    public function delete(User $user, OnboardingStep $step): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'employees', 'onboarding-wizard', 'onboard');
    }
}
