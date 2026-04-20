<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\AssetAllocation;

class AssetAllocationPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'assets', 'asset-allocations', 'view');
    }

    public function view(User $user, AssetAllocation $model): bool
    {
        if (isset($model->employee_id) && $model->employee?->user_id === $user->id) {
            return true;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'assets', 'asset-allocations', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'assets', 'asset-allocations', 'create');
    }

    public function update(User $user, AssetAllocation $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'assets', 'asset-allocations', 'update');
    }

    public function delete(User $user, AssetAllocation $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'assets', 'asset-allocations', 'delete');
    }
}
