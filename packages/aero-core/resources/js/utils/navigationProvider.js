/**
 * Navigation Provider for Aero Modules
 * 
 * Merges navigation from Core and other active modules (HRM, CRM, etc.)
 */

import React from 'react';
import { getCoreNavigation, iconMap } from '@/navigation/pages.jsx';

// Try to import HRM navigation - fallback to empty objects if not available
let hrmNavigation = null;
let hrmIconMap = {};

// Check if HRM module is available at build time
// Vite will handle this at build time and tree-shake if not available
const moduleNavigations = import.meta.glob('../../../../aero-*/resources/js/navigation/pages.jsx', { eager: true });

// Load available module navigations
Object.entries(moduleNavigations).forEach(([path, module]) => {
    if (path.includes('aero-hrm')) {
        hrmNavigation = module.hrmNavigation || module.default;
        hrmIconMap = module.iconMap || {};
    }
    // Add more modules here as needed (CRM, etc.)
});

/**
 * Merge icon maps from all modules
 */
const allIconMaps = { ...iconMap, ...hrmIconMap };

/**
 * Get all module navigations
 * Returns array of all available module navigations sorted by priority
 * 
 * @returns {Array} All module navigations
 */
const getAllModuleNavigations = () => {
    const navigations = [
        getCoreNavigation(),
    ];
    
    // Add HRM navigation if available
    if (hrmNavigation) {
        navigations.push(hrmNavigation);
    }
    
    // Sort by priority (lower number = higher priority)
    return navigations.sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

/**
 * Get pages for sidebar navigation
 * Merges navigation from all active modules
 * 
 * @param {Array} roles - User roles (not used yet, for future access control)
 * @param {Array} permissions - User permissions (not used yet)
 * @param {Object} auth - Auth object from Inertia
 * @returns {Array} Navigation pages
 */
export const getPages = (roles = [], permissions = [], auth = null) => {
    const allNavigations = getAllModuleNavigations();
    const allPages = [];
    
    // Process each module's navigation
    allNavigations.forEach(moduleNav => {
        moduleNav.items.forEach(item => {
            const IconComponent = allIconMaps[item.icon];
            
            allPages.push({
                name: item.name,
                icon: IconComponent || null,  // Store component reference, not instantiated element
                route: item.route,
                access: item.access,
                priority: item.priority,
                module: moduleNav.moduleCode,
                subMenu: item.subMenu?.map(sub => {
                    const SubIconComponent = allIconMaps[sub.icon];
                    return {
                        name: sub.name,
                        icon: SubIconComponent || null,  // Store component reference, not instantiated element
                        route: sub.route,
                        access: sub.access,
                        subMenu: sub.subMenu?.map(subSub => {
                            const SubSubIconComponent = allIconMaps[subSub.icon];
                            return {
                                name: subSub.name,
                                icon: SubSubIconComponent || null,
                                route: subSub.route,
                                access: subSub.access,
                            };
                        })
                    };
                })
            });
        });
    });
    
    // Sort by priority
    return allPages.sort((a, b) => (a.priority || 999) - (b.priority || 999));
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
    
    return settingsItem.subMenu.map(sub => {
        const IconComponent = iconMap[sub.icon];
        return {
            name: sub.name,
            icon: IconComponent || null,  // Store component reference, not instantiated element
            route: sub.route,
            access: sub.access,
        };
    });
};

/**
 * Get admin pages (for platform admin context)
 * For now, returns empty array - can be extended later
 */
export const getAdminPages = (roles = [], permissions = [], auth = null) => {
    return [];
};

export default { getPages, getSettingsPages, getAdminPages };
