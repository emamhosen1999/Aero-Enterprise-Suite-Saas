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
    CubeIcon,
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
            name: 'Users & Auth',
            icon: 'UserGroupIcon',
            access: 'core.users',
            priority: 2,
            subMenu: [
                {
                    name: 'User Management',
                    icon: 'UserGroupIcon',
                    route: 'users.index',
                    access: 'core.users.user-list.view',
                },
            ],
        },

        // Access Control (Roles & Modules)
        {
            name: 'Access Control',
            icon: 'ShieldCheckIcon',
            access: 'core.roles',
            priority: 3,
            subMenu: [
                {
                    name: 'Role Management',
                    icon: 'ShieldCheckIcon',
                    route: 'roles.index',
                    access: 'core.roles.role-list.view',
                },
                {
                    name: 'Feature Access',
                    icon: 'CubeIcon',
                    route: 'modules.index',
                    access: 'core.module-access.module-list.view',
                },
            ],
        },

        // Settings
        {
            name: 'Settings',
            icon: 'Cog6ToothIcon',
            access: 'core.settings',
            priority: 99,
            subMenu: [
                {
                    name: 'General Settings',
                    icon: 'Cog6ToothIcon',
                    route: 'settings.system.index',
                    access: 'core.settings.general.view',
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
    CubeIcon,
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
