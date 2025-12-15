/**
 * Aero Global Namespace Service
 * 
 * Initializes the window.Aero global namespace used for:
 * - Module navigation registration
 * - Cross-module communication
 * - Runtime configuration
 * 
 * Architecture:
 * - This service runs at app startup
 * - Sets up the registration functions before any modules load
 * - Automatically registers platform admin navigation for admin context
 */

import { platformNavigation } from './platformNavigation';

/**
 * Initialize the Aero global namespace
 * Must be called early in app bootstrap before any modules attempt to register
 */
export function initializeAeroNamespace() {
    if (typeof window === 'undefined') return;

    // Initialize namespace if not already present
    window.Aero = window.Aero || {};
    window.Aero.navigation = window.Aero.navigation || [];
    window.Aero.modules = window.Aero.modules || {};
    window.Aero.version = '1.0.0';

    /**
     * Register navigation items from a module
     * @param {string} moduleName - Name of the registering module
     * @param {Array} navItems - Array of navigation items
     */
    if (!window.Aero.registerNavigation) {
        window.Aero.registerNavigation = function(moduleName, navItems) {
            if (!Array.isArray(navItems)) {
                console.error(`[Aero] Module "${moduleName}" provided invalid navigation items`);
                return;
            }

            // Add module identifier to each item
            const itemsWithModule = navItems.map(item => ({
                ...item,
                module: item.module || moduleName,
                _registeredBy: moduleName
            }));

            // Avoid duplicates by checking name + href
            const existingKeys = new Set(
                window.Aero.navigation.map(n => `${n.name}:${n.href || 'submenu'}`)
            );

            const newItems = itemsWithModule.filter(item => {
                const key = `${item.name}:${item.href || 'submenu'}`;
                return !existingKeys.has(key);
            });

            window.Aero.navigation.push(...newItems);

            if (newItems.length > 0) {
                console.log(`[Aero] Registered ${newItems.length} navigation items from "${moduleName}" module`);
            }
        };
    }

    /**
     * Register a module with its metadata
     * @param {string} moduleName - Module identifier
     * @param {Object} moduleConfig - Module configuration
     */
    if (!window.Aero.registerModule) {
        window.Aero.registerModule = function(moduleName, moduleConfig) {
            window.Aero.modules[moduleName] = {
                ...moduleConfig,
                registeredAt: new Date().toISOString()
            };
            console.log(`[Aero] Registered module: ${moduleName}`);
        };
    }

    /**
     * Get navigation items for a specific context
     * @param {string} context - 'admin' or 'tenant'
     * @returns {Array} Filtered navigation items
     */
    window.Aero.getNavigationByContext = function(context) {
        if (context === 'admin') {
            return window.Aero.navigation.filter(
                item => item.module === 'platform' || item._registeredBy === 'platform'
            );
        }
        return window.Aero.navigation.filter(
            item => item.module !== 'platform' && item._registeredBy !== 'platform'
        );
    };

    // Register platform navigation automatically
    // This ensures admin navigation is always available
    window.Aero.registerNavigation('platform', platformNavigation);

    // Mark initialization complete
    window.Aero.initialized = true;
    console.log('[Aero] Global namespace initialized');
}

export default initializeAeroNamespace;
