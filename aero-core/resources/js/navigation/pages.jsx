/**
 * Aero Core Navigation Configuration
 *
 * This file defines the navigation structure for the Core module.
 * Core provides: Dashboard, Users, Roles & Permissions, Settings
 *
 * This navigation is auto-discovered by the NavigationRegistry.
 */

import {
    HomeIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    Cog6ToothIcon,
    UserIcon,
    KeyIcon,
    BuildingOfficeIcon,
    BellIcon,
    SwatchIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';

/**
 * Core module navigation items
 */
export const coreNavigation = {
    moduleCode: 'core',
    moduleName: 'Core',
    priority: 1,
    items: [
        // Dashboard
        {
            name: 'Dashboard',
            icon: 'HomeIcon',
            route: 'dashboard',
            access: 'core.dashboard',
            priority: 1,
        },

        // User Management
        {
            name: 'Users',
            icon: 'UserGroupIcon',
            access: 'core.users',
            priority: 2,
            subMenu: [
                {
                    name: 'All Users',
                    icon: 'UserGroupIcon',
                    route: 'users.index',
                    access: 'core.users.user-list.view',
                },
                {
                    name: 'Invite User',
                    icon: 'UserIcon',
                    route: 'users.invite',
                    access: 'core.users.user-list.create',
                },
            ],
        },

        // Roles & Permissions
        {
            name: 'Roles & Permissions',
            icon: 'ShieldCheckIcon',
            access: 'core.roles',
            priority: 3,
            subMenu: [
                {
                    name: 'Roles',
                    icon: 'ShieldCheckIcon',
                    route: 'roles.index',
                    access: 'core.roles.role-list.view',
                },
                {
                    name: 'Permissions',
                    icon: 'KeyIcon',
                    route: 'permissions.index',
                    access: 'core.roles.permissions.view',
                },
                {
                    name: 'Module Access',
                    icon: 'BuildingOfficeIcon',
                    route: 'modules.access',
                    access: 'core.modules.module-access.manage',
                },
            ],
        },

        // Settings (lowest priority - appears last)
        {
            name: 'Settings',
            icon: 'Cog6ToothIcon',
            access: 'core.settings',
            priority: 99,
            subMenu: [
                {
                    name: 'General',
                    icon: 'Cog6ToothIcon',
                    route: 'settings.general',
                    access: 'core.settings.general.view',
                },
                {
                    name: 'Company Profile',
                    icon: 'BuildingOfficeIcon',
                    route: 'settings.company',
                    access: 'core.settings.company.view',
                },
                {
                    name: 'Notifications',
                    icon: 'BellIcon',
                    route: 'settings.notifications',
                    access: 'core.settings.notifications.view',
                },
                {
                    name: 'Appearance',
                    icon: 'SwatchIcon',
                    route: 'settings.appearance',
                    access: 'core.settings.appearance.view',
                },
                {
                    name: 'Localization',
                    icon: 'GlobeAltIcon',
                    route: 'settings.localization',
                    access: 'core.settings.localization.view',
                },
            ],
        },
    ],
};

/**
 * Icon mapping for rendering
 */
export const iconMap = {
    HomeIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    Cog6ToothIcon,
    UserIcon,
    KeyIcon,
    BuildingOfficeIcon,
    BellIcon,
    SwatchIcon,
    GlobeAltIcon,
};

/**
 * Get Core navigation items
 *
 * @returns {Object} Navigation configuration
 */
export function getCoreNavigation() {
    return coreNavigation;
}

export default coreNavigation;
