<?php

namespace App\Policies;

use App\Models\HRM\Payroll;
use App\Models\User;

class PayrollPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('hr.payroll.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Payroll $payroll): bool
    {
        return $user->hasPermissionTo('hr.payroll.view') || $payroll->employee_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('hr.payroll.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Payroll $payroll): bool
    {
        return $user->hasPermissionTo('hr.payroll.edit') && $payroll->status !== 'locked';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Payroll $payroll): bool
    {
        return $user->hasPermissionTo('hr.payroll.delete') && $payroll->status !== 'locked';
    }

    /**
     * Determine whether the user can lock the payroll.
     */
    public function lock(User $user, Payroll $payroll): bool
    {
        return $user->hasPermissionTo('hr.payroll.lock');
    }

    /**
     * Determine whether the user can process payroll.
     */
    public function process(User $user): bool
    {
        return $user->hasPermissionTo('hr.payroll.process');
    }
}
