/**
 * SaaS Access Hook
 * 
 * Provides unified access control that combines:
 * 1. SaaS subscription checking (aero.subscriptions) - Platform layer
 * 2. RBAC permission checking (role_module_access) - Core layer
 * 
 * In Standalone mode: All modules are "subscribed" - only RBAC applies
 * In SaaS mode: Module must be subscribed AND user must have RBAC access
 * 
 * Usage:
 *   const { hasAccess, hasSubscription, isSaaSMode } = useSaaSAccess();
 *   
 *   if (hasAccess('hrm')) { // Shows HRM in sidebar }
 *   if (hasSubscription('crm')) { // Tenant has CRM subscription }
 */

import { usePage } from '@inertiajs/react';
import { useMemo, useCallback } from 'react';
import { 
    hasModuleAccess, 
    hasAccess as hasRBACAccess,
    isSuperAdmin,
    isAuthSuperAdmin,
    filterNavigationByAccess 
} from '@/utils/moduleAccessUtils';

/**
 * Extract the module code from a path like 'hrm.employees.list.view' => 'hrm'
 * @param {string} path - Access path
 * @returns {string} Module code
 */
const extractModuleCode = (path) => {
    if (!path || typeof path !== 'string') return null;
    const parts = path.split('.');
    return parts[0] || null;
};

/**
 * Main SaaS Access Hook
 * @returns {Object} Access control utilities
 */
export const useSaaSAccess = () => {
    const { auth, aero } = usePage().props;
    
    // Memoize mode detection
    const mode = useMemo(() => aero?.mode || 'standalone', [aero?.mode]);
    const isSaaSMode = useMemo(() => mode === 'saas', [mode]);
    const isStandaloneMode = useMemo(() => mode === 'standalone', [mode]);
    
    // Memoize subscriptions array
    const subscriptions = useMemo(() => {
        if (!isSaaSMode) return []; // In standalone, subscriptions don't apply
        return Array.isArray(aero?.subscriptions) ? aero.subscriptions : [];
    }, [aero?.subscriptions, isSaaSMode]);
    
    /**
     * Check if tenant has subscription for a module (SaaS layer)
     * In standalone mode, always returns true
     * 
     * @param {string} moduleCode - Module code (e.g., 'hrm', 'crm')
     * @returns {boolean} True if subscribed (or standalone mode)
     */
    const hasSubscription = useCallback((moduleCode) => {
        // Standalone mode: all modules are "subscribed"
        if (!isSaaSMode) return true;
        
        // SaaS mode: check if module is in subscriptions
        if (!moduleCode) return false;
        
        // Normalize to lowercase for comparison
        const normalizedCode = moduleCode.toLowerCase();
        return subscriptions.some(sub => sub.toLowerCase() === normalizedCode);
    }, [isSaaSMode, subscriptions]);
    
    /**
     * Combined access check: Subscription + RBAC
     * 
     * Logic:
     * - Standalone: Only RBAC matters
     * - SaaS: Module must be subscribed AND user must have RBAC access
     * 
     * @param {string} path - Access path (e.g., 'hrm' or 'hrm.employees.list')
     * @returns {boolean} True if user has access
     */
    const hasAccess = useCallback((path) => {
        if (!path) return false;
        
        // Super admins bypass subscription checks but still need the module subscribed
        const isSuperUser = isAuthSuperAdmin(auth);
        
        // Extract module code from path
        const moduleCode = extractModuleCode(path);
        
        // In SaaS mode, first check subscription
        if (isSaaSMode && moduleCode) {
            if (!hasSubscription(moduleCode)) {
                // Module not subscribed - no access even for super admins
                return false;
            }
        }
        
        // Super admins bypass RBAC checks
        if (isSuperUser) return true;
        
        // Check RBAC access
        return hasRBACAccess(path, auth);
    }, [auth, isSaaSMode, hasSubscription]);
    
    /**
     * Check if user can access a specific module
     * Combines subscription + RBAC at module level
     * 
     * @param {string} moduleCode - Module code
     * @returns {boolean} True if accessible
     */
    const canAccessModule = useCallback((moduleCode) => {
        if (!moduleCode) return false;
        
        // Check subscription first (in SaaS mode)
        if (isSaaSMode && !hasSubscription(moduleCode)) {
            return false;
        }
        
        // Check RBAC module access
        return hasModuleAccess(moduleCode, auth);
    }, [auth, isSaaSMode, hasSubscription]);
    
    /**
     * Filter navigation items by subscription + RBAC
     * Applies both layers of access control
     * 
     * @param {Array} navItems - Navigation items
     * @returns {Array} Filtered items
     */
    const filterNavigation = useCallback((navItems) => {
        if (!Array.isArray(navItems)) return [];
        
        // First: Filter by RBAC
        let filtered = filterNavigationByAccess(navItems, auth);
        
        // Second: Filter by subscription (SaaS mode only)
        if (isSaaSMode) {
            filtered = filterBySubscription(filtered, subscriptions);
        }
        
        return filtered;
    }, [auth, isSaaSMode, subscriptions]);
    
    /**
     * Get list of locked modules (subscribed but user has no RBAC access)
     * Useful for showing "Request Access" prompts
     */
    const getLockedModules = useCallback(() => {
        if (!isSaaSMode) return [];
        
        return subscriptions.filter(moduleCode => {
            // Subscribed but no RBAC access
            return !hasModuleAccess(moduleCode, auth);
        });
    }, [auth, isSaaSMode, subscriptions]);
    
    /**
     * Get list of unsubscribed modules
     * Useful for showing "Upgrade" prompts
     * 
     * @param {Array} allModules - All available module codes
     * @returns {Array} Unsubscribed module codes
     */
    const getUnsubscribedModules = useCallback((allModules = []) => {
        if (!isSaaSMode) return [];
        
        return allModules.filter(moduleCode => {
            return !hasSubscription(moduleCode);
        });
    }, [isSaaSMode, hasSubscription]);
    
    return {
        // Mode detection
        mode,
        isSaaSMode,
        isStandaloneMode,
        
        // Subscription data
        subscriptions,
        
        // Access checks
        hasSubscription,
        hasAccess,
        canAccessModule,
        
        // Navigation filtering
        filterNavigation,
        
        // Utility
        getLockedModules,
        getUnsubscribedModules,
    };
};

/**
 * Filter navigation items by subscription
 * Removes items for modules that aren't subscribed
 * 
 * @param {Array} navItems - Navigation items
 * @param {Array} subscriptions - Subscribed module codes
 * @returns {Array} Filtered items
 */
const filterBySubscription = (navItems, subscriptions) => {
    if (!Array.isArray(navItems)) return [];
    if (!Array.isArray(subscriptions)) return navItems;
    
    // Normalize subscriptions to lowercase
    const normalizedSubs = subscriptions.map(s => s.toLowerCase());
    
    return navItems.filter(item => {
        // Get module code from item
        const moduleCode = item.module || extractModuleCode(item.access || item.access_key || '');
        
        // No module requirement (e.g., Dashboard) - always show
        if (!moduleCode) return true;
        
        // Check if subscribed
        return normalizedSubs.includes(moduleCode.toLowerCase());
    }).map(item => {
        // Recursively filter children
        if (item.children && item.children.length > 0) {
            return {
                ...item,
                children: filterBySubscription(item.children, subscriptions)
            };
        }
        return item;
    }).filter(item => {
        // Remove parent items with no accessible children
        if (item.children && item.children.length === 0 && !item.path && !item.href) {
            return false;
        }
        return true;
    });
};

/**
 * HOC to inject SaaS access into a component
 * 
 * Usage:
 *   export default withSaaSAccess(MyComponent);
 */
export const withSaaSAccess = (WrappedComponent) => {
    return function WithSaaSAccess(props) {
        const saasAccess = useSaaSAccess();
        return <WrappedComponent {...props} saasAccess={saasAccess} />;
    };
};

export default useSaaSAccess;
