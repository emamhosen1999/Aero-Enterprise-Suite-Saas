/**
 * useNavigation Hook - BACKEND-DRIVEN NAVIGATION
 * 
 * Simple architecture: module.php → Backend NavigationRegistry → Inertia props.navigation → Frontend
 * 
 * Features:
 * - Reads navigation from `props.navigation` (supplied by HandleInertiaRequests)
 * - Applies role-based access control filtering
 * - Super Admin bypass for full visibility
 * 
 * NOTE: Icon resolution happens in navigationUtils.jsx (single source of truth)
 * 
 * Backend Flow:
 * 1. Each module's ServiceProvider registers navigation from its config/module.php
 * 2. NavigationRegistry aggregates all module navigation
 * 3. HandleInertiaRequests shares navigation via Inertia props
 * 4. This hook consumes props.navigation directly
 * 5. navigationUtils.jsx resolves icon strings to React components
 * 
 * @example
 * const { navigation } = useNavigation();
 * 
 * @returns {Object} Navigation state with processed items
 */

import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { filterNavigationByAccess, isSuperAdmin, isPlatformSuperAdmin } from '../utils/moduleAccessUtils';

/**
 * Process a navigation item - check current route
 * NOTE: Icon resolution happens in navigationUtils.jsx, not here
 */
function processNavItem(navItem, url) {
    // Check if current route matches this item
    let current = false;
    const itemPath = navItem.href || navItem.path;
    if (itemPath) {
        current = url === itemPath || url.startsWith(itemPath + '/');
    } else if (navItem.active_rule) {
        try {
            current = typeof route === 'function' && route().current(navItem.active_rule);
        } catch (e) {
            current = false;
        }
    }

    // Process children recursively
    const children = navItem.children?.map(child => processNavItem(child, url));

    // Normalize the item structure (backend uses 'path', frontend expects 'href')
    // Keep icon as string - it will be resolved in navigationUtils.jsx
    return {
        ...navItem,
        href: itemPath,
        current,
        children: children?.length ? children : undefined,
    };
}

export function useNavigation() {
    const { auth, url, context: domainContext = 'tenant', navigation: backendNavigation = [] } = usePage().props;
    const isAdminContext = domainContext === 'admin';

    // 1. Process backend navigation (primary source)
    const processedNavigation = useMemo(() => {
        // Use navigation from Inertia props (supplied by HandleInertiaRequests)
        const rawNavigation = Array.isArray(backendNavigation) ? backendNavigation : [];
        
        // Process each item (resolve icons, check current route)
        return rawNavigation.map(item => processNavItem(item, url));
    }, [backendNavigation, url]);

    // 2. Sort by priority
    const sortedNavigation = useMemo(() => {
        return [...processedNavigation].sort((a, b) => (a.priority || 500) - (b.priority || 500));
    }, [processedNavigation]);

    // 3. Filter based on user permissions
    const filteredNavigation = useMemo(() => {
        const user = auth?.user;
        
        // Platform Super Admin sees all admin navigation
        if (isAdminContext && (auth?.isPlatformSuperAdmin || isPlatformSuperAdmin(auth))) {
            return sortedNavigation;
        }
        
        // Tenant Super Admin sees all tenant navigation
        if (!isAdminContext && user && isSuperAdmin(user)) {
            return sortedNavigation;
        }

        // Apply access control filtering
        return filterNavigationByAccess(sortedNavigation, auth);
    }, [sortedNavigation, auth, isAdminContext]);

    return { 
        navigation: filteredNavigation,
        rawNavigation: backendNavigation,
        isAdminContext
    };
}

/**
 * Shorthand hook for checking module access (legacy compatibility)
 */
export function useModuleAccess(moduleCode) {
    return true; // TODO: Implement proper module access check
}

/**
 * Hook to get navigation items for a specific module (legacy compatibility)
 */
export function useModuleNavigation(moduleCode) {
    const { navigation } = useNavigation();
    return navigation.filter(item => item.module === moduleCode);
}
