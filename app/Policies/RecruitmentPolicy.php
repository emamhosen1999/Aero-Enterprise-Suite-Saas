<?php

namespace App\Policies;

use App\Models\HRM\Job;
use App\Models\User;

class RecruitmentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('hr.recruitment.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Job $job): bool
    {
        return $user->hasPermissionTo('hr.recruitment.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('hr.recruitment.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Job $job): bool
    {
        return $user->hasPermissionTo('hr.recruitment.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Job $job): bool
    {
        return $user->hasPermissionTo('hr.recruitment.delete');
    }

    /**
     * Determine whether the user can publish the job.
     */
    public function publish(User $user, Job $job): bool
    {
        return $user->hasPermissionTo('hr.recruitment.publish');
    }

    /**
     * Determine whether the user can close the job.
     */
    public function close(User $user, Job $job): bool
    {
        return $user->hasPermissionTo('hr.recruitment.close');
    }
}
