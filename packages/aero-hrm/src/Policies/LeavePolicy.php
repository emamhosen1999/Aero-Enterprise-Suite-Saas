<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\HRM\Models\Leave;
use Aero\Core\Models\User;

class LeavePolicy
{
    use ChecksModuleAccess;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.leaves.leave-requests.view
        return $this->canPerformAction($user, 'hrm', 'leaves', 'leave-requests', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Leave $leave): bool
    {
        // Users can view their own leave
        if ($leave->user_id === $user->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope: hrm.leaves.leave-requests.view
        return $this->canPerformActionWithScope($user, 'hrm', 'leaves', 'leave-requests', 'view', $leave);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.leaves.leave-requests.create
        return $this->canPerformAction($user, 'hrm', 'leaves', 'leave-requests', 'create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Leave $leave): bool
    {
        // Can update if is own leave and status is pending
        if ($leave->user_id === $user->id && $leave->status === 'pending') {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.leaves.leave-requests.update
        return $this->canPerformActionWithScope($user, 'hrm', 'leaves', 'leave-requests', 'update', $leave);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Leave $leave): bool
    {
        // Can delete own pending leave
        if ($leave->user_id === $user->id && $leave->status === 'pending') {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.leaves.leave-requests.delete
        return $this->canPerformActionWithScope($user, 'hrm', 'leaves', 'leave-requests', 'delete', $leave);
    }

    /**
     * Determine whether the user can approve the leave.
     */
    public function approve(User $user, Leave $leave): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check if user is the manager of the leave requester
        if ($leave->user->manager_id === $user->id) {
            return true;
        }

        // Check module access: hrm.leaves.leave-requests.approve
        return $this->canPerformActionWithScope($user, 'hrm', 'leaves', 'leave-requests', 'approve', $leave);
    }

    /**
     * Determine whether the user can reject the leave.
     */
    public function reject(User $user, Leave $leave): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check if user is the manager of the leave requester
        if ($leave->user->manager_id === $user->id) {
            return true;
        }

        // Check module access: hrm.leaves.leave-requests.reject
        return $this->canPerformActionWithScope($user, 'hrm', 'leaves', 'leave-requests', 'reject', $leave);
    }
}
