/**
 * useNavigation Hook - BACKEND-DRIVEN NAVIGATION
 * 
 * Simple architecture: module.php → Backend NavigationRegistry → Inertia props.navigation → Frontend
 * 
 * Features:
 * - Reads navigation from `props.navigation` (supplied by HandleInertiaRequests)
 * - Resolves icon strings to HeroIcon components
 * - Applies role-based access control filtering
 * - Super Admin bypass for full visibility
 * 
 * Backend Flow:
 * 1. Each module's ServiceProvider registers navigation from its config/module.php
 * 2. NavigationRegistry aggregates all module navigation
 * 3. HandleInertiaRequests shares navigation via Inertia props
 * 4. This hook consumes props.navigation directly
 * 
 * @example
 * const { navigation } = useNavigation();
 * 
 * @returns {Object} Navigation state with processed items
 */



import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { filterNavigationByAccess, isSuperAdmin, isPlatformSuperAdmin } from '../utils/moduleAccessUtils';

// Import Core Icons statically - expanded for all navigation icons
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
    FolderIcon,
    CalendarIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    AcademicCapIcon,
    ArchiveBoxIcon,
    ScaleIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    FunnelIcon,
    DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

// Icon name to component mapping
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
    FolderIcon,
    CalendarIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    AcademicCapIcon,
    ArchiveBoxIcon,
    ScaleIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    FunnelIcon,
    DocumentChartBarIcon,
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
    return {
        ...navItem,
        href: itemPath,
        icon,
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
