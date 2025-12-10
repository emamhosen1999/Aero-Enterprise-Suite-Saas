/**
 * Module Access Utility Functions
 * 
 * Used across the application for role-based module access control.
 * This replaces the permission-based system with direct role-module access checking.
 * 
 * Access is determined by checking the role_module_access table:
 * - User's role(s) are checked for access at module/submodule/component/action level
 * - Parent access grants access to all children (module access = all submodules, etc.)
 */

/**
 * Check if the current user has access to a specific module
 * @param {string} moduleCode - Module code (e.g., 'hr', 'crm', 'project_management')
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {boolean} True if user has module access
 */
export const hasModuleAccess = (moduleCode, auth = null) => {
    const user = auth?.user || window?.auth?.user || null;
    if (!user) return false;

    // Super Admin bypasses all checks
    if (isSuperAdmin(user)) return true;

    // Check module access tree
    const accessTree = user.module_access || {};
    
    // Check if module is in accessible modules
    const accessibleModules = user.accessible_modules || [];
    if (accessibleModules.some(m => m.code === moduleCode)) return true;

    // Check module IDs in access tree
    const moduleIds = accessTree.modules || [];
    const modules = user.modules_lookup || {};
    const moduleId = Object.keys(modules).find(id => modules[id] === moduleCode);
    
    return moduleId && moduleIds.includes(parseInt(moduleId));
};

/**
 * Check if user has access to a specific submodule
 * @param {string} moduleCode - Parent module code
 * @param {string} subModuleCode - SubModule code
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {boolean} True if user has access
 */
export const hasSubModuleAccess = (moduleCode, subModuleCode, auth = null) => {
    const user = auth?.user || window?.auth?.user || null;
    if (!user) return false;

    // Super Admin bypasses all checks
    if (isSuperAdmin(user)) return true;

    // If user has full module access, they have submodule access too
    if (hasModuleAccess(moduleCode, auth)) {
        const accessTree = user.module_access || {};
        const moduleIds = accessTree.modules || [];
        const modules = user.modules_lookup || {};
        const moduleId = Object.keys(modules).find(id => modules[id] === moduleCode);
        
        // Full module access means all submodules
        if (moduleId && moduleIds.includes(parseInt(moduleId))) return true;
    }

    // Check submodule-level access
    const accessTree = user.module_access || {};
    const subModuleIds = accessTree.sub_modules || [];
    const subModules = user.sub_modules_lookup || {};
    const subModuleKey = `${moduleCode}.${subModuleCode}`;
    const subModuleId = Object.keys(subModules).find(id => subModules[id] === subModuleKey);

    return subModuleId && subModuleIds.includes(parseInt(subModuleId));
};

/**
 * Check if user has access to a specific component
 * @param {string} moduleCode - Parent module code
 * @param {string} subModuleCode - Parent submodule code  
 * @param {string} componentCode - Component code
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {boolean} True if user has access
 */
export const hasComponentAccess = (moduleCode, subModuleCode, componentCode, auth = null) => {
    const user = auth?.user || window?.auth?.user || null;
    if (!user) return false;

    // Super Admin bypasses all checks
    if (isSuperAdmin(user)) return true;

    // Check parent access (grants all children)
    if (hasSubModuleAccess(moduleCode, subModuleCode, auth)) {
        const accessTree = user.module_access || {};
        const subModuleIds = accessTree.sub_modules || [];
        const subModules = user.sub_modules_lookup || {};
        const subModuleKey = `${moduleCode}.${subModuleCode}`;
        const subModuleId = Object.keys(subModules).find(id => subModules[id] === subModuleKey);
        
        // Full submodule access means all components
        if (subModuleId && subModuleIds.includes(parseInt(subModuleId))) return true;
    }

    // Check component-level access
    const accessTree = user.module_access || {};
    const componentIds = accessTree.components || [];
    const components = user.components_lookup || {};
    const componentKey = `${moduleCode}.${subModuleCode}.${componentCode}`;
    const componentId = Object.keys(components).find(id => components[id] === componentKey);

    return componentId && componentIds.includes(parseInt(componentId));
};

/**
 * Check if user can perform a specific action
 * @param {string} moduleCode - Parent module code
 * @param {string} subModuleCode - Parent submodule code
 * @param {string} componentCode - Parent component code
 * @param {string} actionCode - Action code (e.g., 'view', 'create', 'update', 'delete')
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {boolean} True if user can perform action
 */
export const canPerformAction = (moduleCode, subModuleCode, componentCode, actionCode, auth = null) => {
    const user = auth?.user || window?.auth?.user || null;
    if (!user) return false;

    // Super Admin bypasses all checks
    if (isSuperAdmin(user)) return true;

    // Check parent access (grants all children)
    if (hasComponentAccess(moduleCode, subModuleCode, componentCode, auth)) {
        const accessTree = user.module_access || {};
        const componentIds = accessTree.components || [];
        const components = user.components_lookup || {};
        const componentKey = `${moduleCode}.${subModuleCode}.${componentCode}`;
        const componentId = Object.keys(components).find(id => components[id] === componentKey);
        
        // Full component access means all actions
        if (componentId && componentIds.includes(parseInt(componentId))) return true;
    }

    // Check action-level access
    const accessTree = user.module_access || {};
    const actions = accessTree.actions || [];
    const actionsLookup = user.actions_lookup || {};
    const actionKey = `${moduleCode}.${subModuleCode}.${componentCode}.${actionCode}`;
    const actionId = Object.keys(actionsLookup).find(id => actionsLookup[id] === actionKey);

    return actionId && actions.some(a => a.id === parseInt(actionId));
};

/**
 * Get user's access scope for a specific action
 * @param {string} actionPath - Full action path (e.g., 'hr.employees.list.view')
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {string|null} Access scope: 'all', 'department', 'team', 'own', or null
 */
export const getActionScope = (actionPath, auth = null) => {
    const user = auth?.user || window?.auth?.user || null;
    if (!user) return null;

    // Super Admin has 'all' scope
    if (isSuperAdmin(user)) return 'all';

    const accessTree = user.module_access || {};
    const actions = accessTree.actions || [];
    const actionsLookup = user.actions_lookup || {};
    const actionId = Object.keys(actionsLookup).find(id => actionsLookup[id] === actionPath);

    if (!actionId) return null;

    const actionAccess = actions.find(a => a.id === parseInt(actionId));
    return actionAccess?.scope || 'all';
};

/**
 * Check if user is a Super Admin (platform or tenant)
 * @param {Object} user - User object
 * @returns {boolean} True if user is Super Admin
 */
export const isSuperAdmin = (user) => {
    if (!user) return false;
    
    // Check various super admin indicators on user object
    if (user.is_super_admin) return true;
    
    // Check platform super admin flag (passed from backend)
    if (user.is_platform_super_admin) return true;
    
    // Check tenant super admin flag
    if (user.is_tenant_super_admin) return true;
    
    // Check roles array
    if (user.roles && Array.isArray(user.roles)) {
        return user.roles.some(role => {
            const roleName = typeof role === 'string' ? role : role.name;
            return roleName === 'Super Administrator' || 
                   roleName === 'tenant_super_administrator' ||
                   roleName === 'Platform Super Admin' ||
                   roleName === 'platform_super_admin';
        });
    }
    
    // Check role string
    if (user.role === 'super_admin' || user.role === 'Super Administrator' || user.role === 'Platform Super Admin') {
        return true;
    }

    return false;
};

/**
 * Check if auth object indicates super admin status
 * Handles both admin context (isPlatformSuperAdmin on auth) and tenant context (on user)
 * @param {Object} auth - Auth object from Inertia usePage().props
 * @returns {boolean} True if Super Admin
 */
export const isAuthSuperAdmin = (auth) => {
    if (!auth) return false;
    
    // Check auth-level flags (admin context)
    if (auth.isPlatformSuperAdmin) return true;
    if (auth.isTenantSuperAdmin) return true;
    if (auth.isSuperAdmin) return true;
    
    // Check user-level flags
    const user = auth.user;
    if (user) {
        return isSuperAdmin(user);
    }
    
    return false;
};

/**
 * Get all accessible modules for a user
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {Array} Array of accessible module objects
 */
export const getAccessibleModules = (auth = null) => {
    const user = auth?.user || window?.auth?.user || null;
    if (!user) return [];

    return user.accessible_modules || [];
};

/**
 * Check access using a simple path string
 * Path format: "module.submodule.component.action"
 * 
 * @param {string} path - Access path to check
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {boolean} True if user has access
 */
export const hasAccess = (path, auth = null) => {
    const parts = path.split('.');
    
    switch (parts.length) {
        case 1:
            return hasModuleAccess(parts[0], auth);
        case 2:
            return hasSubModuleAccess(parts[0], parts[1], auth);
        case 3:
            return hasComponentAccess(parts[0], parts[1], parts[2], auth);
        case 4:
            return canPerformAction(parts[0], parts[1], parts[2], parts[3], auth);
        default:
            console.warn('Invalid access path:', path);
            return false;
    }
};

/**
 * React hook-friendly check that works with Inertia's usePage
 * Use inside React components like:
 * const { auth } = usePage().props;
 * if (checkAccess('hr.employees.list.view', auth)) { ... }
 */
export const checkAccess = hasAccess;

/**
 * Filter navigation items based on user's module access
 * @param {Array} navItems - Array of navigation items
 * @param {Object} auth - Auth object from Inertia usePage() props
 * @returns {Array} Filtered navigation items
 */
export const filterNavigationByAccess = (navItems, auth = null) => {
    const user = auth?.user || window?.auth?.user || null;
    if (!user) return [];

    // Super Admin sees all
    if (isSuperAdmin(user)) return navItems;

    return navItems.filter(item => {
        // Check if item has module requirement
        if (item.module) {
            return hasModuleAccess(item.module, auth);
        }
        
        // Check if item has full access path
        if (item.access) {
            return hasAccess(item.access, auth);
        }

        // No access requirement = visible to all
        return true;
    }).map(item => {
        // Recursively filter children
        if (item.children && item.children.length > 0) {
            return {
                ...item,
                children: filterNavigationByAccess(item.children, auth)
            };
        }
        return item;
    });
};

// Default export for convenience
export default {
    hasModuleAccess,
    hasSubModuleAccess,
    hasComponentAccess,
    canPerformAction,
    getActionScope,
    isSuperAdmin,
    isAuthSuperAdmin,
    getAccessibleModules,
    hasAccess,
    checkAccess,
    filterNavigationByAccess
};
