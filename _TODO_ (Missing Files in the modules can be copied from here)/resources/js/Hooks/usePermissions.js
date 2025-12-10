import { useMemo, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * usePermissions Hook
 * 
 * A comprehensive React hook for role-based access control.
 * Integrates with Inertia.js shared props for permission/role checking.
 * 
 * @example
 * // Basic usage
 * const { can, hasRole, isAdmin } = usePermissions();
 * if (can('users.create')) { ... }
 * if (hasRole('hr_manager')) { ... }
 * 
 * @example
 * // Check multiple permissions
 * const { canAny, canAll } = usePermissions();
 * if (canAny(['users.view', 'users.edit'])) { ... }
 * if (canAll(['users.create', 'users.delete'])) { ... }
 * 
 * @example
 * // Check ownership
 * const { canAccessOwn } = usePermissions();
 * if (canAccessOwn(resource, 'documents.edit')) { ... }
 */
export function usePermissions() {
    const { auth } = usePage().props;

    /**
     * Get the current user from auth props
     */
    const user = useMemo(() => auth?.user || null, [auth?.user]);

    /**
     * Get user's direct permissions
     */
    const permissions = useMemo(() => {
        if (!user) return [];
        return user.permissions || [];
    }, [user]);

    /**
     * Get user's roles
     */
    const roles = useMemo(() => {
        if (!user) return [];
        
        // Support both array of role objects and array of role names
        const userRoles = user.roles || [];
        return userRoles.map(role => {
            if (typeof role === 'string') return role;
            return role.name || role;
        });
    }, [user]);

    /**
     * Check if user has a specific permission
     * 
     * @param {string} permission - Permission name (e.g., 'users.create')
     * @returns {boolean}
     */
    const can = useCallback((permission) => {
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.is_super_admin || roles.includes('super_admin')) {
            return true;
        }

        // Check direct permissions
        if (permissions.includes(permission)) {
            return true;
        }

        // Check wildcard permissions (e.g., 'users.*' matches 'users.create')
        const [resource] = permission.split('.');
        if (permissions.includes(`${resource}.*`) || permissions.includes('*')) {
            return true;
        }

        return false;
    }, [user, permissions, roles]);

    /**
     * Check if user has ANY of the specified permissions
     * 
     * @param {string[]} perms - Array of permission names
     * @returns {boolean}
     */
    const canAny = useCallback((perms) => {
        if (!Array.isArray(perms)) return can(perms);
        return perms.some(permission => can(permission));
    }, [can]);

    /**
     * Check if user has ALL of the specified permissions
     * 
     * @param {string[]} perms - Array of permission names
     * @returns {boolean}
     */
    const canAll = useCallback((perms) => {
        if (!Array.isArray(perms)) return can(perms);
        return perms.every(permission => can(permission));
    }, [can]);

    /**
     * Check if user has a specific role
     * 
     * @param {string|string[]} role - Role name or array of role names
     * @returns {boolean}
     */
    const hasRole = useCallback((role) => {
        if (!user) return false;
        
        const rolesToCheck = Array.isArray(role) ? role : [role];
        return rolesToCheck.some(r => roles.includes(r));
    }, [user, roles]);

    /**
     * Check if user has ALL of the specified roles
     * 
     * @param {string[]} requiredRoles - Array of role names
     * @returns {boolean}
     */
    const hasAllRoles = useCallback((requiredRoles) => {
        if (!user) return false;
        return requiredRoles.every(r => roles.includes(r));
    }, [user, roles]);

    /**
     * Check if user is a super admin
     * 
     * @returns {boolean}
     */
    const isAdmin = useMemo(() => {
        if (!user) return false;
        return user.is_super_admin || roles.includes('super_admin') || roles.includes('admin');
    }, [user, roles]);

    /**
     * Check if user is the tenant owner
     * 
     * @returns {boolean}
     */
    const isTenantOwner = useMemo(() => {
        if (!user) return false;
        return user.is_tenant_owner || roles.includes('tenant_owner');
    }, [user, roles]);

    /**
     * Check if user can access a resource based on ownership
     * 
     * @param {Object} resource - Resource object with user_id or owner_id
     * @param {string} permission - Permission to check if not owner
     * @returns {boolean}
     */
    const canAccessOwn = useCallback((resource, permission = null) => {
        if (!user || !resource) return false;

        // Check ownership
        const isOwner = resource.user_id === user.id || 
                       resource.owner_id === user.id ||
                       resource.created_by === user.id;
        
        if (isOwner) return true;

        // If not owner and permission provided, check permission
        if (permission) {
            return can(permission);
        }

        // Admins can access all resources
        return isAdmin;
    }, [user, can, isAdmin]);

    /**
     * Get permission check for a specific module
     * 
     * @param {string} module - Module name (e.g., 'hr', 'crm')
     * @returns {Object} Object with module-specific permission checks
     */
    const forModule = useCallback((module) => {
        return {
            canView: can(`${module}.view`),
            canCreate: can(`${module}.create`),
            canEdit: can(`${module}.edit`),
            canDelete: can(`${module}.delete`),
            canManage: can(`${module}.manage`) || canAll([
                `${module}.view`,
                `${module}.create`,
                `${module}.edit`,
                `${module}.delete`
            ]),
            can: (action) => can(`${module}.${action}`),
        };
    }, [can, canAll]);

    return {
        // User data
        user,
        permissions,
        roles,
        
        // Permission checks
        can,
        canAny,
        canAll,
        
        // Role checks
        hasRole,
        hasAllRoles,
        
        // Special role checks
        isAdmin,
        isTenantOwner,
        
        // Resource ownership
        canAccessOwn,
        
        // Module-scoped permissions
        forModule,
        
        // Raw authentication state
        isAuthenticated: !!user,
    };
}

/**
 * Shorthand hook for simple permission check
 * 
 * @example
 * const canCreate = useCan('users.create');
 */
export function useCan(permission) {
    const { can } = usePermissions();
    return can(permission);
}

/**
 * Shorthand hook for role check
 * 
 * @example
 * const isManager = useHasRole('hr_manager');
 */
export function useHasRole(role) {
    const { hasRole } = usePermissions();
    return hasRole(role);
}

export default usePermissions;
