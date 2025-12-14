/**
 * Navigation Registry Service
 * 
 * Centralized store for Core navigation items.
 * Modules can register additional navigation at runtime via window.Aero.registerNavigation()
 * 
 * Architecture:
 * - Core defines base navigation (Dashboard, Users, Roles, etc.)
 * - Modules inject their navigation via window.Aero.registerNavigation()
 * - useNavigation hook merges both sources and applies access control
 */

class NavigationRegistry {
    constructor() {
        this.coreNavigation = [
            {
                name: 'Dashboard',
                icon: 'HomeIcon',
                href: '/dashboard',
                active_rule: 'dashboard',
                order: 0,
                access_key: null, // No access control - always visible
            },
            {
                name: 'Users',
                icon: 'UsersIcon',
                href: '/users',
                active_rule: 'users*',
                order: 10,
                access_key: 'core.user_management.users',
            },
            {
                name: 'Roles & Permissions',
                icon: 'ShieldCheckIcon',
                href: '/roles',
                active_rule: 'roles*',
                order: 20,
                access_key: 'core.access_control.roles',
            },
            {
                name: 'Modules',
                icon: 'CubeIcon',
                href: '/modules',
                active_rule: 'modules*',
                order: 30,
                access_key: 'core.module_management.modules',
            },
            {
                name: 'Settings',
                icon: 'Cog6ToothIcon',
                href: '/settings',
                active_rule: 'settings*',
                order: 1000,
                access_key: 'core.settings.general',
            },
        ];
    }

    /**
     * Get core navigation items
     */
    get() {
        return this.coreNavigation;
    }

    /**
     * Register additional navigation items (used by modules)
     * This is a convenience method, but modules typically use window.Aero.registerNavigation()
     */
    register(moduleName, items) {
        if (!Array.isArray(items)) {
            console.error(`[NavigationRegistry] Module "${moduleName}" provided invalid navigation items`);
            return;
        }

        // Modules should use window.Aero.registerNavigation() instead
        // This method is kept for backward compatibility
        if (window.Aero && typeof window.Aero.registerNavigation === 'function') {
            items.forEach(item => window.Aero.registerNavigation(item));
        }
    }

    /**
     * Update a specific core navigation item
     */
    update(name, updates) {
        const index = this.coreNavigation.findIndex(item => item.name === name);
        if (index !== -1) {
            this.coreNavigation[index] = { ...this.coreNavigation[index], ...updates };
        }
    }
}

// Export singleton instance
export const navigationRegistry = new NavigationRegistry();
export default navigationRegistry;
