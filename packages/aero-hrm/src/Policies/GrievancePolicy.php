<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\Grievance;

class GrievancePolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'grievances', 'grievance-list', 'view');
    }

    public function view(User $user, Grievance $model): bool
    {
        if (isset($model->employee_id) && $model->employee?->user_id === $user->id) {
            return true;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'grievances', 'grievance-list', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'grievances', 'grievance-list', 'create');
    }

    public function update(User $user, Grievance $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'grievances', 'grievance-list', 'update');
    }

    public function delete(User $user, Grievance $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'grievances', 'grievance-list', 'delete');
    }

    public function approve(User $user, Grievance $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'grievances', 'grievance-list', 'approve');
    }

    public function reject(User $user, Grievance $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'grievances', 'grievance-list', 'reject');
    }
}
