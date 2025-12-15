/**
 * useNavigation Hook - DECENTRALIZED VERSION with Access Control
 * 
 * This hook merges Core's static navigation with dynamically registered
 * module navigation from window.Aero.navigation.
 * 
 * It replaces the old monolithic pages.jsx approach with a decentralized system.
 * 
 * Features:
 * - Context-aware: Returns admin navigation for 'admin' context, tenant for others
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
import { adminNavigationRegistry } from '../Services/AdminNavigationRegistry';
import { filterNavigationByAccess, isSuperAdmin, isPlatformSuperAdmin } from '../utils/moduleAccessUtils';

// Import Core Icons statically - expanded for admin navigation
import { 
    HomeIcon, 
    UsersIcon, 
    Cog6ToothIcon,
    Cog8ToothIcon,
    ShieldCheckIcon,
    UserIcon,
    UserGroupIcon,
    UserPlusIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    ChartBarSquareIcon,
    ChartPieIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon,
    CurrencyDollarIcon,
    CreditCardIcon,
    BanknotesIcon,
    ShoppingCartIcon,
    TruckIcon,
    DocumentTextIcon,
    CubeIcon,
    GlobeAltIcon,
    CircleStackIcon,
    ServerIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    LinkIcon,
    KeyIcon,
    ArrowsRightLeftIcon,
    ArrowPathIcon,
    PuzzlePieceIcon,
    CommandLineIcon,
    ComputerDesktopIcon,
    PaintBrushIcon,
    EnvelopeIcon,
    LanguageIcon,
    WrenchScrewdriverIcon,
    QueueListIcon,
    ViewColumnsIcon,
    RectangleStackIcon,
    PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

// Icon name to component mapping - expanded for all platform icons
const ICON_MAP = {
    HomeIcon,
    UsersIcon,
    UserIcon,
    UserGroupIcon,
    UserPlusIcon,
    Cog6ToothIcon,
    Cog8ToothIcon,
    ShieldCheckIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    ChartBarSquareIcon,
    ChartPieIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon,
    CurrencyDollarIcon,
    CreditCardIcon,
    BanknotesIcon,
    ShoppingCartIcon,
    TruckIcon,
    DocumentTextIcon,
    CubeIcon,
    GlobeAltIcon,
    CircleStackIcon,
    ServerIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    LinkIcon,
    KeyIcon,
    ArrowsRightLeftIcon,
    ArrowPathIcon,
    PuzzlePieceIcon,
    CommandLineIcon,
    ComputerDesktopIcon,
    PaintBrushIcon,
    EnvelopeIcon,
    LanguageIcon,
    WrenchScrewdriverIcon,
    QueueListIcon,
    ViewColumnsIcon,
    RectangleStackIcon,
    PresentationChartLineIcon,
};

/**
 * Process a navigation item - resolve icons and check current route
 */
function processNavItem(navItem, url) {
    // Resolve icon from string to component if needed
    const icon = typeof navItem.icon === 'string' 
        ? ICON_MAP[navItem.icon] 
        : navItem.icon;

    // Check if current route matches this item
    let current = false;
    if (navItem.href) {
        current = url === navItem.href || url.startsWith(navItem.href + '/');
    } else if (navItem.active_rule) {
        try {
            current = typeof route === 'function' && route().current(navItem.active_rule);
        } catch (e) {
            // route() may not be available in all contexts
            current = false;
        }
    }

    // Process children recursively
    const children = navItem.children?.map(child => processNavItem(child, url));

    return {
        ...navItem,
        icon,
        current,
        children
    };
}

export function useNavigation() {
    const { auth, url, context: domainContext = 'tenant' } = usePage().props;
    const isAdminContext = domainContext === 'admin';

    // 1. Get Base Navigation based on context
    const baseNavigation = useMemo(() => {
        if (isAdminContext) {
            // Use admin navigation registry for platform admin context
            return adminNavigationRegistry.get().map(item => processNavItem(item, url));
        }
        // Use tenant navigation registry for tenant context
        return navigationRegistry.get().map(item => processNavItem(item, url));
    }, [isAdminContext, url]);

    // 2. Merge with Module Navigation
    const mergedNavigation = useMemo(() => {
        // Get dynamic navigation from window.Aero
        const registeredNav = window.Aero?.navigation || [];
        
        // Filter navigation based on context
        const contextNav = isAdminContext
            ? registeredNav.filter(item => item.module === 'platform' || item._registeredBy === 'platform')
            : registeredNav.filter(item => item.module !== 'platform' && item._registeredBy !== 'platform');

        const moduleNav = contextNav.map(item => processNavItem(item, url));

        // Combine base + module navigation
        const allNav = [...baseNavigation, ...moduleNav];

        // Remove duplicates by href or name
        const seen = new Set();
        const dedupedNav = allNav.filter(item => {
            const key = item.href || item.name;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sort by 'order' property (default 500 if not specified)
        return dedupedNav.sort((a, b) => (a.order || 500) - (b.order || 500));
    }, [baseNavigation, isAdminContext, url]);

    // 3. Filter based on user permissions
    const filteredNavigation = useMemo(() => {
        const user = auth?.user;
        
        // Platform Super Admin sees all admin navigation
        if (isAdminContext && (auth?.isPlatformSuperAdmin || isPlatformSuperAdmin(auth))) {
            return mergedNavigation;
        }
        
        // Tenant Super Admin sees all tenant navigation
        if (!isAdminContext && user && isSuperAdmin(user)) {
            return mergedNavigation;
        }

        // Apply access control filtering
        return filterNavigationByAccess(mergedNavigation, auth);
    }, [mergedNavigation, auth, isAdminContext]);

    return { 
        navigation: filteredNavigation,
        baseNavigation,
        moduleNavigation: window.Aero?.navigation || [],
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
