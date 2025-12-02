<?php

namespace App\Policies;

use App\Models\HRM\Leave;
use App\Models\User;

class LeavePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('leaves.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Leave $leave): bool
    {
        return $user->hasPermissionTo('leaves.view') || $leave->user_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('leaves.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Leave $leave): bool
    {
        // Can update if has permission, or is own leave and status is pending
        return $user->hasPermissionTo('leaves.edit') ||
               ($leave->user_id === $user->id && $leave->status === 'pending');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Leave $leave): bool
    {
        return $user->hasPermissionTo('leaves.delete') ||
               ($leave->user_id === $user->id && $leave->status === 'pending');
    }

    /**
     * Determine whether the user can approve the leave.
     */
    public function approve(User $user, Leave $leave): bool
    {
        return $user->hasPermissionTo('leaves.approve') ||
               $leave->user->manager_id === $user->id;
    }

    /**
     * Determine whether the user can reject the leave.
     */
    public function reject(User $user, Leave $leave): bool
    {
        return $user->hasPermissionTo('leaves.approve') ||
               $leave->user->manager_id === $user->id;
    }
}
