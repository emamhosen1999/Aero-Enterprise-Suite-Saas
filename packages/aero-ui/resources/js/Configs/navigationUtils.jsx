import React from 'react';
import {
    HomeIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    Cog8ToothIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    EnvelopeIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    FolderIcon,
    ChartBarSquareIcon,
    ChartBarIcon,
    ChartPieIcon,
    CreditCardIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon,
    BanknotesIcon,
    WrenchScrewdriverIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    DocumentDuplicateIcon,
    ShieldCheckIcon,
    UserIcon,
    UsersIcon,
    ArchiveBoxIcon,
    AcademicCapIcon,
    CubeIcon,
    ScaleIcon,
    BuildingStorefrontIcon,
    ArrowPathIcon,
    CurrencyDollarIcon,
    ClockIcon,
    UserCircleIcon,
    UserPlusIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    FunnelIcon,
    ViewColumnsIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    LinkIcon,
    KeyIcon,
    ArrowsRightLeftIcon,
    DocumentChartBarIcon,
    PresentationChartLineIcon,
    CommandLineIcon,
    ComputerDesktopIcon,
    PaintBrushIcon,
    LanguageIcon,
    GlobeAltIcon,
    CircleStackIcon,
    ServerIcon,
    PuzzlePieceIcon,
    QueueListIcon,
    RectangleStackIcon,
    ShoppingCartIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

/**
 * Icon Map - Maps string icon names to actual icon components
 */
const ICON_MAP = {
    HomeIcon: <HomeIcon />,
    UserGroupIcon: <UserGroupIcon />,
    UsersIcon: <UsersIcon />,
    CalendarDaysIcon: <CalendarDaysIcon />,
    Cog6ToothIcon: <Cog6ToothIcon />,
    Cog8ToothIcon: <Cog8ToothIcon />,
    CalendarIcon: <CalendarIcon />,
    ArrowRightOnRectangleIcon: <ArrowRightOnRectangleIcon />,
    EnvelopeIcon: <EnvelopeIcon />,
    DocumentTextIcon: <DocumentTextIcon />,
    BriefcaseIcon: <BriefcaseIcon />,
    FolderIcon: <FolderIcon />,
    ChartBarSquareIcon: <ChartBarSquareIcon />,
    ChartBarIcon: <ChartBarIcon />,
    ChartPieIcon: <ChartPieIcon />,
    CreditCardIcon: <CreditCardIcon />,
    BuildingOfficeIcon: <BuildingOfficeIcon />,
    BuildingOffice2Icon: <BuildingOffice2Icon />,
    BanknotesIcon: <BanknotesIcon />,
    WrenchScrewdriverIcon: <WrenchScrewdriverIcon />,
    ClipboardDocumentCheckIcon: <ClipboardDocumentCheckIcon />,
    ClipboardDocumentListIcon: <ClipboardDocumentListIcon />,
    DocumentDuplicateIcon: <DocumentDuplicateIcon />,
    ShieldCheckIcon: <ShieldCheckIcon />,
    UserIcon: <UserIcon />,
    ArchiveBoxIcon: <ArchiveBoxIcon />,
    AcademicCapIcon: <AcademicCapIcon />,
    CubeIcon: <CubeIcon />,
    ScaleIcon: <ScaleIcon />,
    BuildingStorefrontIcon: <BuildingStorefrontIcon />,
    ArrowPathIcon: <ArrowPathIcon />,
    CurrencyDollarIcon: <CurrencyDollarIcon />,
    ClockIcon: <ClockIcon />,
    UserCircleIcon: <UserCircleIcon />,
    UserPlusIcon: <UserPlusIcon />,
    SparklesIcon: <SparklesIcon />,
    ChatBubbleLeftRightIcon: <ChatBubbleLeftRightIcon />,
    FunnelIcon: <FunnelIcon />,
    ViewColumnsIcon: <ViewColumnsIcon />,
    ExclamationTriangleIcon: <ExclamationTriangleIcon />,
    ExclamationCircleIcon: <ExclamationCircleIcon />,
    LinkIcon: <LinkIcon />,
    KeyIcon: <KeyIcon />,
    ArrowsRightLeftIcon: <ArrowsRightLeftIcon />,
    DocumentChartBarIcon: <DocumentChartBarIcon />,
    PresentationChartLineIcon: <PresentationChartLineIcon />,
    CommandLineIcon: <CommandLineIcon />,
    ComputerDesktopIcon: <ComputerDesktopIcon />,
    PaintBrushIcon: <PaintBrushIcon />,
    LanguageIcon: <LanguageIcon />,
    GlobeAltIcon: <GlobeAltIcon />,
    CircleStackIcon: <CircleStackIcon />,
    ServerIcon: <ServerIcon />,
    PuzzlePieceIcon: <PuzzlePieceIcon />,
    QueueListIcon: <QueueListIcon />,
    RectangleStackIcon: <RectangleStackIcon />,
    ShoppingCartIcon: <ShoppingCartIcon />,
    TruckIcon: <TruckIcon />,
};

/**
 * Get icon component from string name or return existing component
 * Handles:
 * - String icon names (e.g., "HomeIcon") 
 * - React elements (e.g., <HomeIcon />)
 * - React component functions (e.g., HomeIcon)
 */
export function getIcon(iconName) {
    // If already a React element, return as-is
    if (React.isValidElement(iconName)) {
        return iconName;
    }
    // If it's a function (component), create element from it
    if (typeof iconName === 'function') {
        return React.createElement(iconName);
    }
    // If string, look up in map
    if (typeof iconName === 'string') {
        return ICON_MAP[iconName] || <CubeIcon />;
    }
    // Fallback
    return <CubeIcon />;
}

/**
 * Convert navigation config item to legacy pages format
 * 
 * This function transforms the new configuration-driven navigation format
 * into the legacy pages format used by the existing Sidebar component.
 * 
 * Backend sends: { name, path, icon, children, ... }
 * Sidebar expects: { name, route OR path, icon, subMenu, ... }
 * 
 * @param {Object} item - Navigation config item
 * @returns {Object} Legacy page format item
 */
export function convertToLegacyFormat(item) {
    // Backend uses 'name', some older configs might use 'label'
    const displayName = item.name || item.label || 'Unnamed';
    
    // Debug: Log if name is missing
    if (!item.name && !item.label) {
        console.warn('[Navigation] Item missing name/label:', item);
    }
    
    const legacyItem = {
        name: displayName,
        icon: getIcon(item.icon),
        priority: item.priority,
        module: item.module,
        path: item.path || item.href, // Backend uses 'path', normalize to also have 'path'
    };

    // Add route if exists
    if (item.route) {
        legacyItem.route = item.route;
    }

    // Add category if exists
    if (item.category) {
        legacyItem.category = item.category;
    }

    // Recursively convert children to subMenu
    if (item.children && item.children.length > 0) {
        legacyItem.subMenu = item.children.map(convertToLegacyFormat);
    }

    return legacyItem;
}

/**
 * Convert entire navigation array to legacy format
 * 
 * @param {Array} navigation - Filtered navigation from useNavigation hook
 * @returns {Array} Legacy pages format array
 */
export function convertNavigationToPages(navigation) {
    return navigation.map(convertToLegacyFormat);
}

/**
 * Hook to get pages in legacy format
 * 
 * This is a drop-in replacement for the getPages function that uses
 * the new configuration-driven navigation system.
 * 
 * @example
 * // Instead of:
 * const pages = getPages(roles, permissions, auth);
 * 
 * // Use:
 * const pages = useLegacyPages();
 */
import { useMemo } from 'react';
import { useNavigation } from '@/Hooks/useNavigation';

export function useLegacyPages() {
    const { navigation, rawNavigation } = useNavigation();

    return useMemo(() => {
        const pages = convertNavigationToPages(navigation);
        
        // Debug logging - remove in production
        if (typeof window !== 'undefined' && window.DEBUG_NAV) {
            console.group('[useLegacyPages] Navigation Debug');
            console.log('Raw navigation from backend:', rawNavigation);
            console.log('Processed navigation:', navigation);
            console.log('Converted to pages:', pages);
            console.log('First page name:', pages[0]?.name);
            console.log('First page subMenu:', pages[0]?.subMenu?.map(s => s.name));
            console.groupEnd();
        }
        
        return pages;
    }, [navigation, rawNavigation]);
}

export default {
    getIcon,
    convertToLegacyFormat,
    convertNavigationToPages,
    useLegacyPages,
    ICON_MAP,
};
