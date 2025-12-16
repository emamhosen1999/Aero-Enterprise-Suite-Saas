/**
 * Module Access Utility Functions
 * 
 * Used across the application for role-based module access control.
 * This replaces the permission-based system with direct role-module access checking.
 * 
 * Access is determined by checking the role_module_access table:
 * - User's role(s) are checked for access at module/submodule/component/action level
 * - Parent access grants access to all children (module access = all submodules, etc.)
 * 
 * SaaS Mode Integration:
 * - In SaaS mode, subscription checking is layered on top of RBAC
 * - Module must be subscribed (aero.subscriptions) AND user must have RBAC access
 * - Use useSaaSAccess hook for combined subscription + RBAC checking
 */

/**
 * Get aero config from global page props
 * @returns {Object} Aero configuration { mode, subscriptions }
 */
const getAeroConfig = () => {
    // Try to get from window (set by Inertia)
    if (typeof window !== 'undefined' && window.__page?.props?.aero) {
        return window.__page.props.aero;
    }
    return { mode: 'standalone', subscriptions: [] };
};

/**
 * Check if running in SaaS mode
 * @returns {boolean} True if SaaS mode
 */
export const isSaaSMode = () => {
    return getAeroConfig().mode === 'saas';
};

/**
 * Check if tenant has subscription for a module
 * @param {string} moduleCode - Module code (e.g., 'hrm', 'crm')
 * @returns {boolean} True if subscribed (or in standalone mode)
 */
export const hasSubscription = (moduleCode) => {
    const aero = getAeroConfig();
    
    // Standalone mode: all modules are "subscribed"
    if (aero.mode !== 'saas') return true;
    
    if (!moduleCode) return false;
    
    const subscriptions = Array.isArray(aero.subscriptions) ? aero.subscriptions : [];
    const normalizedCode = moduleCode.toLowerCase();
    
    return subscriptions.some(sub => sub.toLowerCase() === normalizedCode);
};

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
 * Check if auth object indicates platform super admin status
 * Used specifically for admin/landlord context
 * @param {Object} auth - Auth object from Inertia usePage().props
 * @returns {boolean} True if Platform Super Admin
 */
export const isPlatformSuperAdmin = (auth) => {
    if (!auth) return false;
    
    // Check auth-level flag for platform super admin
    if (auth.isPlatformSuperAdmin) return true;
    
    // Check user-level flag
    const user = auth.user;
    if (user) {
        if (user.is_platform_super_admin) return true;
        if (user.isPlatformSuperAdmin) return true;
        
        // Check roles for platform admin
        const roles = user.roles || [];
        if (roles.some(r => {
            const roleName = typeof r === 'string' ? r : r.name;
            return roleName === 'Platform Super Admin' || roleName === 'platform-super-admin';
        })) {
            return true;
        }
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
 * Supports both legacy 'module' and 'access' properties, and new 'access_key' property
 * 
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
        // No access requirement = visible to all (e.g., Dashboard)
        if (!item.access_key && !item.module && !item.access) {
            return true;
        }

        // Check new 'access_key' property (format: "module.submodule.component")
        if (item.access_key) {
            return hasAccess(item.access_key, auth);
        }

        // Check legacy 'module' property
        if (item.module) {
            return hasModuleAccess(item.module, auth);
        }
        
        // Check legacy 'access' property (full path)
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
    }).filter(item => {
        // Remove parent items that have no accessible children
        if (item.children && item.children.length === 0 && !item.href) {
            return false;
        }
        return true;
    });
};

/**
 * Get the current domain context from page props
 * @returns {string} 'admin' | 'tenant' | 'platform'
 */
export const getDomainContext = () => {
    if (typeof window !== 'undefined' && window.__page?.props?.context) {
        return window.__page.props.context;
    }
    return 'tenant'; // default to tenant
};

/**
 * Check if current context is admin (platform admin)
 * @returns {boolean}
 */
export const isAdminContext = () => {
    return getDomainContext() === 'admin';
};

/**
 * Get the correct dashboard route name based on context
 * @returns {string} Route name for dashboard
 */
export const getDashboardRouteName = () => {
    const context = getDomainContext();
    if (context === 'admin') {
        return 'admin.dashboard';
    }
    return 'dashboard';
};

/**
 * Get a context-aware route name
 * For admin context, prefixes route with 'admin.'
 * @param {string} routeName - Base route name (e.g., 'dashboard', 'profile')
 * @returns {string} Context-aware route name
 */
export const getContextRoute = (routeName) => {
    const context = getDomainContext();
    if (context === 'admin' && !routeName.startsWith('admin.')) {
        return `admin.${routeName}`;
    }
    return routeName;
};

/**
 * Get a route URL using context-aware route name
 * Safely handles missing routes by falling back to path-based URL
 * @param {string} routeName - Route name to resolve
 * @param {Object} params - Route parameters
 * @returns {string} Route URL
 */
export const safeRoute = (routeName, params = {}) => {
    try {
        if (typeof route === 'function') {
            // Check if route exists first to avoid Ziggy throwing
            if (route().has(routeName)) {
                return route(routeName, params);
            }
        }
    } catch (e) {
        // Silently handle route errors
        console.debug(`Route '${routeName}' not available, using fallback path`);
    }
    // Fallback to path-based URL if route function not available or route doesn't exist
    return isAdminContext() ? '/admin/dashboard' : '/dashboard';
};

/**
 * Get the dashboard URL for current context
 * @returns {string} Dashboard URL
 */
export const getDashboardUrl = () => {
    const routeName = getDashboardRouteName();
    return safeRoute(routeName);
};

// Default export for convenience
export default {
    // SaaS mode helpers
    isSaaSMode,
    hasSubscription,
    // RBAC access helpers
    hasModuleAccess,
    hasSubModuleAccess,
    hasComponentAccess,
    canPerformAction,
    getActionScope,
    isSuperAdmin,
    isPlatformSuperAdmin,
    isAuthSuperAdmin,
    getAccessibleModules,
    hasAccess,
    checkAccess,
    filterNavigationByAccess,
    // Context helpers
    getDomainContext,
    isAdminContext,
    getDashboardRouteName,
    getContextRoute,
    safeRoute,
    getDashboardUrl
};
