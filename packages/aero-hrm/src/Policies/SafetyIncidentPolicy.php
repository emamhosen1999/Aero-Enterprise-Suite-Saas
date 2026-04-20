<?php

namespace Aero\HRM\Policies;

use Aero\Core\Models\User;
use Aero\HRMAC\Concerns\ChecksHRMAC;
use Aero\HRM\Models\SafetyIncident;

class SafetyIncidentPolicy
{
    use ChecksHRMAC;

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-incidents', 'view');
    }

    public function view(User $user, SafetyIncident $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformActionWithScope($user, 'hrm', 'safety', 'safety-incidents', 'view', $model);
    }

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-incidents', 'create');
    }

    public function update(User $user, SafetyIncident $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-incidents', 'update');
    }

    public function delete(User $user, SafetyIncident $model): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->canPerformAction($user, 'hrm', 'safety', 'safety-incidents', 'delete');
    }
}
