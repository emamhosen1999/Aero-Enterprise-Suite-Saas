<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\Core\Models\User;
use App\Models\Tenant\HRM\Job;

class RecruitmentPolicy
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

        // Check module access: hrm.recruitment.job-openings.view
        return $this->canPerformAction($user, 'hrm', 'recruitment', 'job-openings', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Job $job): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.recruitment.job-openings.view
        return $this->canPerformAction($user, 'hrm', 'recruitment', 'job-openings', 'view');
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

        // Check module access: hrm.recruitment.job-openings.create
        return $this->canPerformAction($user, 'hrm', 'recruitment', 'job-openings', 'create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Job $job): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.recruitment.job-openings.update
        return $this->canPerformAction($user, 'hrm', 'recruitment', 'job-openings', 'update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Job $job): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.recruitment.job-openings.delete
        return $this->canPerformAction($user, 'hrm', 'recruitment', 'job-openings', 'delete');
    }

    /**
     * Determine whether the user can publish the job.
     */
    public function publish(User $user, Job $job): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.recruitment.job-openings.create (publish requires create permission)
        return $this->canPerformAction($user, 'hrm', 'recruitment', 'job-openings', 'create');
    }

    /**
     * Determine whether the user can close the job.
     */
    public function close(User $user, Job $job): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.recruitment.job-openings.update (close requires update permission)
        return $this->canPerformAction($user, 'hrm', 'recruitment', 'job-openings', 'update');
    }
}
