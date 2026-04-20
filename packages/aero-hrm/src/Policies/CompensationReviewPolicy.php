<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\CompensationReview;

class CompensationReviewPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'compensation-planning', 'compensation-reviews', 'view');
    }

    public function view(User $user, CompensationReview $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'compensation-planning', 'compensation-reviews', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'compensation-planning', 'compensation-reviews', 'create');
    }

    public function update(User $user, CompensationReview $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'compensation-planning', 'compensation-reviews', 'update');
    }

    public function delete(User $user, CompensationReview $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'compensation-planning', 'compensation-reviews', 'delete');
    }
}
