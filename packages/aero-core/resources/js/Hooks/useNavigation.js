/**
 * useNavigation Hook - DECENTRALIZED VERSION
 * 
 * This hook merges Core's static navigation with dynamically registered
 * module navigation from window.Aero.navigation.
 * 
 * It replaces the old monolithic pages.jsx approach with a decentralized system.
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

// Import Core Icons statically
import { 
    HomeIcon, 
    UsersIcon, 
    Cog6ToothIcon,
    ShieldCheckIcon,
    UserIcon
} from '@heroicons/react/24/outline';

export function useNavigation() {
    const { auth, url } = usePage().props;

    // 1. Define Core Navigation (Static)
    const coreNavigation = useMemo(() => [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: HomeIcon,
            current: route().current('dashboard'),
            order: 0
        },
        {
            name: 'User Management',
            icon: UsersIcon,
            order: 900, // Near the bottom
            children: [
                { 
                    name: 'Users', 
                    href: route('admin.users.index'), 
                    current: route().current('admin.users.*'),
                    icon: UserIcon
                },
                { 
                    name: 'Roles & Permissions', 
                    href: route('admin.roles.index'), 
                    current: route().current('admin.roles.*'),
                    icon: ShieldCheckIcon
                },
            ]
        },
        {
            name: 'Settings',
            href: route('admin.settings.index'),
            icon: Cog6ToothIcon,
            current: route().current('admin.settings.*'),
            order: 1000 // Last item
        }
    ], []);

    // 2. Merge with Module Navigation
    const mergedNavigation = useMemo(() => {
        // Get dynamic navigation from window.Aero
        const moduleNav = (window.Aero?.navigation || []).map(item => {
            // Process each navigation item
            const processItem = (navItem) => {
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

    // 4. Filter based on user permissions (if needed)
    const filteredNavigation = useMemo(() => {
        // TODO: Implement permission-based filtering
        // For now, return all navigation items
        // In the future: check auth.permissions against item.access property
        return mergedNavigation;
    }, [mergedNavigation]);

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
