/**
 * Admin Navigation Registry Service
 * 
 * Centralized store for Platform Admin navigation items.
 * This mirrors the NavigationRegistry but for the admin/landlord context.
 * 
 * Architecture:
 * - Platform defines base admin navigation (Dashboard, Tenants, Plans, etc.)
 * - Additional admin-level modules can register via window.Aero.registerAdminNavigation()
 * - useAdminNavigation hook merges all sources and applies access control
 */

class AdminNavigationRegistry {
    constructor() {
        // Base platform admin navigation
        // This is the minimal navigation that's always available for platform admins
        this.coreNavigation = [
            {
                name: 'Dashboard',
                icon: 'HomeIcon',
                href: '/admin/dashboard',
                active_rule: 'admin.dashboard*',
                order: 0,
                access_key: null, // Dashboard always visible to logged-in admin
            },
            {
                name: 'Tenants',
                icon: 'BuildingOffice2Icon',
                href: '/admin/tenants',
                active_rule: 'admin.tenants*',
                order: 10,
                access_key: 'platform.tenant_management',
                children: [
                    {
                        name: 'All Tenants',
                        icon: 'BuildingOfficeIcon',
                        href: '/admin/tenants',
                        access_key: 'platform.tenant_management.tenant_list',
                    },
                    {
                        name: 'Domains',
                        icon: 'GlobeAltIcon',
                        href: '/admin/tenants/domains',
                        access_key: 'platform.tenant_management.tenant_domains',
                    },
                    {
                        name: 'Databases',
                        icon: 'CircleStackIcon',
                        href: '/admin/tenants/databases',
                        access_key: 'platform.tenant_management.tenant_databases',
                    },
                ],
            },
            {
                name: 'Plans',
                icon: 'CurrencyDollarIcon',
                href: '/admin/plans',
                active_rule: 'admin.plans*',
                order: 20,
                access_key: 'platform.plan_management',
            },
            {
                name: 'Billing',
                icon: 'CreditCardIcon',
                href: '/admin/billing',
                active_rule: 'admin.billing*',
                order: 30,
                access_key: 'platform.billing_management',
            },
            {
                name: 'Platform Users',
                icon: 'UserGroupIcon',
                href: '/admin/users',
                active_rule: 'admin.users*',
                order: 40,
                access_key: 'platform.landlord_users',
            },
            {
                name: 'Settings',
                icon: 'Cog6ToothIcon',
                href: '/admin/settings',
                active_rule: 'admin.settings*',
                order: 1000,
                access_key: 'platform.platform_settings',
            },
        ];
    }

    /**
     * Get admin navigation items
     */
    get() {
        return this.coreNavigation;
    }

    /**
     * Register additional admin navigation items
     */
    register(moduleName, items) {
        if (!Array.isArray(items)) {
            console.error(`[AdminNavigationRegistry] Module "${moduleName}" provided invalid navigation items`);
            return;
        }

        // Add items to the registry
        items.forEach(item => {
            this.coreNavigation.push({
                ...item,
                _registeredBy: moduleName
            });
        });

        // Sort by order
        this.coreNavigation.sort((a, b) => (a.order || 500) - (b.order || 500));
    }

    /**
     * Update a specific admin navigation item
     */
    update(name, updates) {
        const index = this.coreNavigation.findIndex(item => item.name === name);
        if (index !== -1) {
            this.coreNavigation[index] = { ...this.coreNavigation[index], ...updates };
        }
    }

    /**
     * Clear all navigation (useful for hot reloading)
     */
    clear() {
        this.coreNavigation = [];
    }
}

// Export singleton instance
export const adminNavigationRegistry = new AdminNavigationRegistry();
export default adminNavigationRegistry;
