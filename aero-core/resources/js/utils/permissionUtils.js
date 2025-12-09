/**
 * Permission utility functions
 * Used across the HRM module for role-based access control
 */

/**
 * Check if the current user has a specific permission
 * @param {string|Array} permission - Permission name or array of permissions
 * @param {Object} user - User object with permissions/roles
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (permission, user = null) => {
    // If no user provided, try to get from global auth context
    if (!user) {
        // In a real application, this would be retrieved from auth context
        // For now, we'll use a mock implementation
        user = window?.auth?.user || null;
    }
    
    if (!user) {
        return false;
    }
    
    // If permission is an array, check if user has any of the permissions
    if (Array.isArray(permission)) {
        return permission.some(perm => checkSinglePermission(perm, user));
    }
    
    return checkSinglePermission(permission, user);
};

/**
 * Check a single permission against user's permissions
 * @param {string} permission - Permission name
 * @param {Object} user - User object
 * @returns {boolean} True if user has permission
 */
const checkSinglePermission = (permission, user) => {
    // Check direct permissions
    if (user.permissions && Array.isArray(user.permissions)) {
        if (user.permissions.includes(permission)) {
            return true;
        }
    }
    
    // Check permissions through roles
    if (user.roles && Array.isArray(user.roles)) {
        for (const role of user.roles) {
            if (role.permissions && role.permissions.includes(permission)) {
                return true;
            }
        }
    }
    
    // Check if user is super admin (has all permissions)
    if (user.is_super_admin || user.role === 'super_admin') {
        return true;
    }
    
    // Check role-based permissions
    const rolePermissions = getRolePermissions(user.role || user.user_type);
    return rolePermissions.includes(permission);
};

/**
 * Get permissions for a specific role
 * @param {string} role - Role name
 * @returns {Array} Array of permissions for the role
 */
const getRolePermissions = (role) => {
    const permissions = {
        'super_admin': ['*'], // All permissions
        'admin': [
            'hr.view',
            'hr.create',
            'hr.edit',
            'hr.delete',
            'hr.skills.view',
            'hr.skills.manage',
            'hr.benefits.view',
            'hr.benefits.manage',
            'hr.safety.view',
            'hr.safety.manage',
            'hr.analytics.view',
            'hr.documents.view',
            'hr.documents.manage',
            'hr.self_service.view',
            'employees.view',
            'employees.manage',
            'reports.view',
            'reports.generate'
        ],
        'hr_manager': [
            'hr.view',
            'hr.create',
            'hr.edit',
            'hr.skills.view',
            'hr.skills.manage',
            'hr.benefits.view',
            'hr.benefits.manage',
            'hr.safety.view',
            'hr.safety.manage',
            'hr.analytics.view',
            'hr.documents.view',
            'hr.documents.manage',
            'hr.self_service.view',
            'employees.view',
            'employees.manage',
            'reports.view'
        ],
        'hr_staff': [
            'hr.view',
            'hr.create',
            'hr.edit',
            'hr.skills.view',
            'hr.benefits.view',
            'hr.safety.view',
            'hr.analytics.view',
            'hr.documents.view',
            'hr.self_service.view',
            'employees.view',
            'reports.view'
        ],
        'manager': [
            'hr.view',
            'hr.skills.view',
            'hr.benefits.view',
            'hr.safety.view',
            'hr.analytics.view',
            'hr.documents.view',
            'hr.self_service.view',
            'employees.view',
            'reports.view'
        ],
        'employee': [
            'hr.self_service.view',
            'hr.documents.view',
            'hr.benefits.view'
        ],
        'user': [
            'hr.self_service.view'
        ]
    };
    
    return permissions[role] || permissions['user'];
};

/**
 * Check if user has any of the specified roles
 * @param {string|Array} roles - Role name or array of roles
 * @param {Object} user - User object
 * @returns {boolean} True if user has any of the roles
 */
export const hasRole = (roles, user = null) => {
    if (!user) {
        user = window?.auth?.user || null;
    }
    
    if (!user) {
        return false;
    }
    
    const userRoles = user.roles ? user.roles.map(r => r.name || r) : [user.role || user.user_type];
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    
    return rolesToCheck.some(role => userRoles.includes(role));
};

/**
 * Check if user can perform a specific action on a resource
 * @param {string} action - Action to perform (view, create, edit, delete)
 * @param {string} resource - Resource name (e.g., 'hr.skills', 'employees')
 * @param {Object} user - User object
 * @returns {boolean} True if user can perform action
 */
export const canPerformAction = (action, resource, user = null) => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission, user);
};

/**
 * Get all permissions for the current user
 * @param {Object} user - User object
 * @returns {Array} Array of all user permissions
 */
export const getUserPermissions = (user = null) => {
    if (!user) {
        user = window?.auth?.user || null;
    }
    
    if (!user) {
        return [];
    }
    
    let permissions = [];
    
    // Add direct permissions
    if (user.permissions && Array.isArray(user.permissions)) {
        permissions = [...permissions, ...user.permissions];
    }
    
    // Add role-based permissions
    if (user.roles && Array.isArray(user.roles)) {
        for (const role of user.roles) {
            if (role.permissions && Array.isArray(role.permissions)) {
                permissions = [...permissions, ...role.permissions];
            }
        }
    }
    
    // Add permissions from user role
    const rolePermissions = getRolePermissions(user.role || user.user_type);
    permissions = [...permissions, ...rolePermissions];
    
    // Remove duplicates and return
    return [...new Set(permissions)];
};

/**
 * Check if user is admin or has admin-level permissions
 * @param {Object} user - User object
 * @returns {boolean} True if user is admin
 */
export const isAdmin = (user = null) => {
    if (!user) {
        user = window?.auth?.user || null;
    }
    
    if (!user) {
        return false;
    }
    
    return user.is_super_admin || 
           user.role === 'super_admin' || 
           user.role === 'admin' ||
           hasRole(['super_admin', 'admin'], user);
};

/**
 * Check if user owns a resource or has permission to access it
 * @param {Object} resource - Resource object with user_id or owner_id
 * @param {Object} user - User object
 * @returns {boolean} True if user owns resource or has admin permissions
 */
export const canAccessResource = (resource, user = null) => {
    if (!user) {
        user = window?.auth?.user || null;
    }
    
    if (!user || !resource) {
        return false;
    }
    
    // Check if user owns the resource
    if (resource.user_id === user.id || resource.owner_id === user.id) {
        return true;
    }
    
    // Check if user has admin permissions
    return isAdmin(user);
};
