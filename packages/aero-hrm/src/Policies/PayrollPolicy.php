<?php

namespace Aero\HRM\Policies;

use Aero\Core\Policies\Concerns\ChecksModuleAccess;
use Aero\HRM\Models\Payroll;
use Aero\Core\Models\User;

class PayrollPolicy
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

        // Check module access: hrm.employees.employee-directory.view (using employee directory for payroll)
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Payroll $payroll): bool
    {
        // Users can view their own payroll
        if ($payroll->employee_id === $user->id) {
            return true;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access with scope
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'view', $payroll);
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

        // Check module access: hrm.employees.employee-directory.create
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Payroll $payroll): bool
    {
        // Cannot update locked payroll
        if ($payroll->status === 'locked') {
            return false;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'update', $payroll);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Payroll $payroll): bool
    {
        // Cannot delete locked payroll
        if ($payroll->status === 'locked') {
            return false;
        }

        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.delete
        return $this->canPerformActionWithScope($user, 'hrm', 'employees', 'employee-directory', 'delete', $payroll);
    }

    /**
     * Determine whether the user can lock the payroll.
     */
    public function lock(User $user, Payroll $payroll): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.update
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'update');
    }

    /**
     * Determine whether the user can process payroll.
     */
    public function process(User $user): bool
    {
        // Super Admin bypass
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Check module access: hrm.employees.employee-directory.create
        return $this->canPerformAction($user, 'hrm', 'employees', 'employee-directory', 'create');
    }
}
