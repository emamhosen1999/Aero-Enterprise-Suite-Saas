<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Spatie\Permission\Models\Role;

/**
 * Role Policy
 *
 * Enforces protection rules for roles, especially Super Administrator roles.
 *
 * Compliance:
 * - Section 3: Super Administrator Role Rules
 * - Section 10: Role Modification Protection
 * - Section 12: Deletion Rules
 */
class RolePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Platform Super Admin can view all roles
        if ($user->hasRole('platform_super_administrator')) {
            return true;
        }

        // Tenant Super Admin can view tenant roles
        if ($user->hasRole('tenant_super_administrator')) {
            return true;
        }

        // Other users with role management permissions
        return $user->can('tenant.manage_roles') || $user->can('platform.manage_roles');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Role $role): bool
    {
        // Platform Super Admin can view all roles
        if ($user->hasRole('platform_super_administrator')) {
            return true;
        }

        // Tenant Super Admin can view roles in their tenant
        if ($user->hasRole('tenant_super_administrator') && $role->tenant_id === $user->tenant_id) {
            return true;
        }

        return $user->can('tenant.manage_roles') || $user->can('platform.manage_roles');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Platform Super Admin can create roles
        if ($user->hasRole('platform_super_administrator')) {
            return true;
        }

        // Tenant Super Admin can create tenant roles
        if ($user->hasRole('tenant_super_administrator')) {
            return true;
        }

        return $user->can('tenant.manage_roles') || $user->can('platform.manage_roles');
    }

    /**
     * Determine whether the user can update the model.
     *
     * Protected roles (Super Administrators) cannot be modified.
     */
    public function update(User $user, Role $role): Response
    {
        // CRITICAL: Protected roles cannot be modified (Section 3, Rule 2)
        if ($role->is_protected) {
            return Response::deny('This role is protected and cannot be modified. Super Administrator roles are permanent.');
        }

        // Platform Super Admin can update non-protected roles
        if ($user->hasRole('platform_super_administrator')) {
            return Response::allow();
        }

        // Tenant Super Admin can update non-protected tenant roles
        if ($user->hasRole('tenant_super_administrator') && $role->tenant_id === $user->tenant_id) {
            return Response::allow();
        }

        if ($user->can('tenant.manage_roles') || $user->can('platform.manage_roles')) {
            return Response::allow();
        }

        return Response::deny('You do not have permission to update roles.');
    }

    /**
     * Determine whether the user can delete the model.
     *
     * Protected roles (Super Administrators) cannot be deleted.
     */
    public function delete(User $user, Role $role): Response
    {
        // CRITICAL: Protected roles cannot be deleted (Section 3, Rule 1)
        if ($role->is_protected) {
            return Response::deny('This role is protected and cannot be deleted. Super Administrator roles are permanent.');
        }

        // Platform Super Admin can delete non-protected roles
        if ($user->hasRole('platform_super_administrator')) {
            return Response::allow();
        }

        // Tenant Super Admin can delete non-protected tenant roles
        if ($user->hasRole('tenant_super_administrator') && $role->tenant_id === $user->tenant_id) {
            return Response::allow();
        }

        if ($user->can('tenant.manage_roles') || $user->can('platform.manage_roles')) {
            return Response::allow();
        }

        return Response::deny('You do not have permission to delete roles.');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Role $role): bool
    {
        return $this->delete($user, $role)->allowed();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Role $role): Response
    {
        // Protected roles can never be force deleted
        if ($role->is_protected) {
            return Response::deny('This role is protected and cannot be permanently deleted.');
        }

        return $this->delete($user, $role);
    }
}
