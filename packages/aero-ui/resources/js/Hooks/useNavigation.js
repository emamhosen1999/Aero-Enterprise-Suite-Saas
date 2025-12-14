/**
 * useNavigation Hook - DECENTRALIZED VERSION with Access Control
 * 
 * This hook merges Core's static navigation with dynamically registered
 * module navigation from window.Aero.navigation.
 * 
 * It replaces the old monolithic pages.jsx approach with a decentralized system.
 * 
 * Features:
 * - Merges Core + Module navigation
 * - Applies role-based access control filtering
 * - Resolves icon strings to HeroIcon components
 * - Sorts by order property
 * - Super Admin bypass for full visibility
 * 
 * Each module registers its own navigation via:
 *   window.Aero.registerNavigation('moduleName', navigationArray)
 * 
 * @example
 * const { navigation } = useNavigation();
 * 
 * @returns {Object} Navigation state with merged Core + Module items
 */

import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { navigationRegistry } from '../Services/NavigationRegistry';
import { filterNavigationByAccess, isSuperAdmin } from '../utils/moduleAccessUtils';

// Import Core Icons statically
import { 
    HomeIcon, 
    UsersIcon, 
    Cog6ToothIcon,
    ShieldCheckIcon,
    UserIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    TruckIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

// Icon name to component mapping
const ICON_MAP = {
    HomeIcon,
    UsersIcon,
    UserIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    TruckIcon,
    DocumentTextIcon
};

export function useNavigation() {
    const { auth, url } = usePage().props;

    // 1. Get Core Navigation from NavigationRegistry
    const coreNavigation = useMemo(() => {
        return navigationRegistry.get().map(item => ({
            ...item,
            // Resolve icon from string to component
            icon: typeof item.icon === 'string' ? ICON_MAP[item.icon] : item.icon
        }));
    }, []);

    // 2. Merge with Module Navigation
    const mergedNavigation = useMemo(() => {
        // Get dynamic navigation from window.Aero
        const moduleNav = (window.Aero?.navigation || []).map(item => {
            // Process each navigation item recursively
            const processItem = (navItem) => {
                // Resolve icon from string to component if needed
                const icon = typeof navItem.icon === 'string' 
                    ? ICON_MAP[navItem.icon] 
                    : navItem.icon;

                // Check if current route matches this item
                let current = false;
                if (navItem.href) {
                    current = url === navItem.href || url.startsWith(navItem.href + '/');
                } else if (navItem.active_rule) {
                    current = route().current(navItem.active_rule);
                }

                // Process children recursively
                const children = navItem.children?.map(processItem);

                return {
                    ...navItem,
                    icon,
                    current,
                    children
                };
            };

            return processItem(item);
        });

        // Combine Core + Module navigation
        const allNav = [...coreNavigation, ...moduleNav];

        // 3. Sort by 'order' property (default 500 if not specified)
        return allNav.sort((a, b) => (a.order || 500) - (b.order || 500));
    }, [coreNavigation, url]);

    // 4. Filter based on user permissions
    const filteredNavigation = useMemo(() => {
        const user = auth?.user;
        
        // Super Admin sees all navigation
        if (user && isSuperAdmin(user)) {
            return mergedNavigation;
        }

        // Apply access control filtering
        return filterNavigationByAccess(mergedNavigation, auth);
    }, [mergedNavigation, auth]);

    return { 
        navigation: filteredNavigation,
        coreNavigation,
        moduleNavigation: window.Aero?.navigation || []
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
