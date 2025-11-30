/**
 * Configuration-Driven Pages Generator
 * 
 * This file provides a drop-in replacement for the legacy getPages function
 * that uses the new configuration-driven navigation system with module filtering.
 * 
 * The key difference is that this version:
 * 1. Uses centralized navigation configuration (@/Configs/navigation.js)
 * 2. Filters by enabled modules (from tenant subscription)
 * 3. Filters by user permissions (from Spatie permissions)
 * 4. Maintains backward compatibility with existing Sidebar component
 * 
 * @example
 * // In App.jsx, replace:
 * import { getPages } from '@/Props/pages.jsx';
 * 
 * // With:
 * import { getConfigDrivenPages } from '@/Props/configDrivenPages.jsx';
 * 
 * // Then use:
 * const pages = getConfigDrivenPages(roles, permissions, auth, enabledModules);
 */

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

import { navigationConfig, MODULES } from '@/Configs/navigation';

// =============================================================================
// ICON MAP
// =============================================================================
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
const getIcon = (iconName) => ICON_MAP[iconName] || <CubeIcon />;

/**
 * Check if a module is enabled
 */
const isModuleEnabled = (moduleCode, enabledModules) => {
    if (!moduleCode) return true; // null = always visible
    return enabledModules.includes(moduleCode.toLowerCase());
};

/**
 * Check if user has permission
 */
const hasPermission = (permission, permissions) => {
    if (!permission) return true; // null = always visible
    return permissions.includes(permission);
};

/**
 * Convert config item to legacy page format
 */
const convertToPageFormat = (item) => {
    const page = {
        name: item.label,
        icon: getIcon(item.icon),
        priority: item.priority,
        module: item.module,
    };

    if (item.route) {
        page.route = item.route;
    }

    if (item.category) {
        page.category = item.category;
    }

    return page;
};

/**
 * Recursively filter and convert navigation items
 */
const filterAndConvert = (items, permissions, enabledModules) => {
    return items
        .filter(item => {
            // Check module access
            if (!isModuleEnabled(item.module, enabledModules)) {
                return false;
            }

            // Check permission for leaf items
            if (!item.children && item.permission && !hasPermission(item.permission, permissions)) {
                return false;
            }

            return true;
        })
        .map(item => {
            const page = convertToPageFormat(item);

            // Recursively process children
            if (item.children && item.children.length > 0) {
                const filteredChildren = filterAndConvert(item.children, permissions, enabledModules);
                
                // Only include parent if it has visible children
                if (filteredChildren.length === 0) {
                    return null;
                }

                page.subMenu = filteredChildren;
            }

            return page;
        })
        .filter(Boolean)
        .sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

/**
 * Get pages using configuration-driven navigation
 * 
 * This is a drop-in replacement for the legacy getPages function.
 * 
 * @param {Array} roles - User roles
 * @param {Array} permissions - User permissions
 * @param {Object} auth - Auth object with user info
 * @param {Array} enabledModules - Array of enabled module codes (optional)
 * @returns {Array} Pages array compatible with existing Sidebar
 */
export const getConfigDrivenPages = (roles, permissions, auth = null, enabledModules = null) => {
    // Determine enabled modules
    const modules = enabledModules || extractEnabledModules(auth);
    
    // Check if user is employee-only
    const isOnlyEmployee = roles?.length === 1 && roles[0] === 'Employee';

    // Filter navigation based on permissions and modules
    let pages = filterAndConvert(navigationConfig, permissions || [], modules);

    // For employee-only users, flatten workspace items
    if (isOnlyEmployee) {
        pages = pages.flatMap(page => {
            if (page.module === 'self-service' && page.subMenu) {
                return page.subMenu;
            }
            return page;
        });
    }

    return pages;
};

/**
 * Extract enabled modules from auth object
 */
const extractEnabledModules = (auth) => {
    // Always include core modules
    const baseModules = ['core', 'self-service'];

    // Check for accessibleModules (from tenant subscription)
    if (auth?.accessibleModules) {
        const moduleCodes = auth.accessibleModules.map(m => 
            (m.code?.toLowerCase() || m.code || '').toLowerCase()
        );
        return [...baseModules, ...moduleCodes];
    }

    // Check for enabled_modules prop
    if (auth?.enabled_modules) {
        return [...baseModules, ...auth.enabled_modules.map(m => m.toLowerCase())];
    }

    // Default: only base modules
    return baseModules;
};

/**
 * Legacy-compatible wrapper that matches the original getPages signature
 * 
 * This can be used as a direct replacement in existing code.
 */
export const getPages = (roles, permissions, auth = null) => {
    return getConfigDrivenPages(roles, permissions, auth);
};

export default getConfigDrivenPages;
