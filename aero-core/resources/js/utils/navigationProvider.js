/**
 * Navigation Provider for Aero Core
 * 
 * Provides navigation structure from the Core module
 */

import React from 'react';
import { getCoreNavigation, iconMap } from '@/navigation/pages.jsx';

/**
 * Get pages for sidebar navigation
 * Uses Core module navigation structure
 * 
 * @param {Array} roles - User roles (not used yet, for future access control)
 * @param {Array} permissions - User permissions (not used yet)
 * @param {Object} auth - Auth object from Inertia
 * @returns {Array} Navigation pages
 */
export const getPages = (roles = [], permissions = [], auth = null) => {
    const coreNav = getCoreNavigation();
    
    // Convert core navigation to pages format expected by Sidebar
    return coreNav.items.map(item => {
        const icon = iconMap[item.icon];
        
        return {
            name: item.name,
            icon: icon ? React.createElement(icon, { className: '' }) : null,
            route: item.route,
            access: item.access,
            priority: item.priority,
            module: coreNav.moduleCode,
            subMenu: item.subMenu?.map(sub => ({
                name: sub.name,
                icon: iconMap[sub.icon] ? React.createElement(iconMap[sub.icon]) : null,
                route: sub.route,
                access: sub.access,
            }))
        };
    });
};

/**
 * Get settings pages
 * Extracts settings from Core navigation
 */
export const getSettingsPages = (roles = [], permissions = [], auth = null) => {
    const coreNav = getCoreNavigation();
    const settingsItem = coreNav.items.find(item => item.name === 'Settings');
    
    if (!settingsItem || !settingsItem.subMenu) {
        return [];
    }
    
    return settingsItem.subMenu.map(sub => ({
        name: sub.name,
        icon: iconMap[sub.icon] ? React.createElement(iconMap[sub.icon]) : null,
        route: sub.route,
        access: sub.access,
    }));
};

/**
 * Get admin pages (for platform admin context)
 * For now, returns empty array - can be extended later
 */
export const getAdminPages = (roles = [], permissions = [], auth = null) => {
    return [];
};

export default { getPages, getSettingsPages, getAdminPages };
