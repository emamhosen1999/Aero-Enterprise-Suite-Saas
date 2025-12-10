import React from 'react';
import {
    HomeIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    EnvelopeIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    FolderIcon,
    ChartBarSquareIcon,
    CreditCardIcon,
    BuildingOffice2Icon,
    BanknotesIcon,
    WrenchScrewdriverIcon,
    ClipboardDocumentCheckIcon,
    DocumentDuplicateIcon,
    ShieldCheckIcon,
    UserIcon,
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
    ChartBarIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    ArrowsRightLeftIcon,
    DocumentChartBarIcon,
    PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

/**
 * Icon Map - Maps string icon names to actual icon components
 */
const ICON_MAP = {
    HomeIcon: <HomeIcon />,
    UserGroupIcon: <UserGroupIcon />,
    CalendarDaysIcon: <CalendarDaysIcon />,
    Cog6ToothIcon: <Cog6ToothIcon />,
    CalendarIcon: <CalendarIcon />,
    ArrowRightOnRectangleIcon: <ArrowRightOnRectangleIcon />,
    EnvelopeIcon: <EnvelopeIcon />,
    DocumentTextIcon: <DocumentTextIcon />,
    BriefcaseIcon: <BriefcaseIcon />,
    FolderIcon: <FolderIcon />,
    ChartBarSquareIcon: <ChartBarSquareIcon />,
    CreditCardIcon: <CreditCardIcon />,
    BuildingOffice2Icon: <BuildingOffice2Icon />,
    BanknotesIcon: <BanknotesIcon />,
    WrenchScrewdriverIcon: <WrenchScrewdriverIcon />,
    ClipboardDocumentCheckIcon: <ClipboardDocumentCheckIcon />,
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
    ChartBarIcon: <ChartBarIcon />,
    ExclamationTriangleIcon: <ExclamationTriangleIcon />,
    LinkIcon: <LinkIcon />,
    ArrowsRightLeftIcon: <ArrowsRightLeftIcon />,
    DocumentChartBarIcon: <DocumentChartBarIcon />,
    PresentationChartLineIcon: <PresentationChartLineIcon />,
};

/**
 * Get icon component from string name
 */
export function getIcon(iconName) {
    return ICON_MAP[iconName] || <CubeIcon />;
}

/**
 * Convert navigation config item to legacy pages format
 * 
 * This function transforms the new configuration-driven navigation format
 * into the legacy pages format used by the existing Sidebar component.
 * 
 * @param {Object} item - Navigation config item
 * @returns {Object} Legacy page format item
 */
export function convertToLegacyFormat(item) {
    const legacyItem = {
        name: item.label,
        icon: getIcon(item.icon),
        priority: item.priority,
        module: item.module,
    };

    // Add route if exists
    if (item.route) {
        legacyItem.route = item.route;
    }

    // Add category if exists
    if (item.category) {
        legacyItem.category = item.category;
    }

    // Recursively convert children
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
    const { navigation } = useNavigation();

    return useMemo(() => {
        return convertNavigationToPages(navigation);
    }, [navigation]);
}

export default {
    getIcon,
    convertToLegacyFormat,
    convertNavigationToPages,
    useLegacyPages,
    ICON_MAP,
};
