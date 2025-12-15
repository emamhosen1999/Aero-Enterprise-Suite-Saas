/**
 * Aero Platform Module Entry Point
 * 
 * This file exports the navigation for the Platform module,
 * enabling dynamic loading for platform admin context.
 * 
 * The platform navigation is registered with Core's navigation system
 * via window.Aero.registerNavigation(), allowing the sidebar and header
 * to display admin navigation when in the 'admin' domain context.
 */

// Import navigation definition
import { platformNavigation } from './navigation';

/**
 * Register platform navigation with Core at module load time
 * 
 * This registration happens automatically when the platform bundle is loaded.
 * The Core's useNavigation hook will then merge this with its base navigation.
 */
if (typeof window !== 'undefined') {
    // Initialize Aero namespace if it doesn't exist
    window.Aero = window.Aero || {};
    window.Aero.navigation = window.Aero.navigation || [];
    
    // Register navigation registration function if it doesn't exist
    if (!window.Aero.registerNavigation) {
        window.Aero.registerNavigation = function(moduleName, navItems) {
            if (!Array.isArray(navItems)) {
                console.error(`[Aero] Module "${moduleName}" provided invalid navigation items`);
                return;
            }
            
            // Add module identifier to each item
            const itemsWithModule = navItems.map(item => ({
                ...item,
                _registeredBy: moduleName
            }));
            
            window.Aero.navigation.push(...itemsWithModule);
            console.log(`[Aero] Registered ${navItems.length} navigation items from "${moduleName}" module`);
        };
    }
    
    // Register platform navigation
    window.Aero.registerNavigation('platform', platformNavigation);
}

/**
 * Export navigation for direct import
 */
export { platformNavigation };

/**
 * Resolver function for dynamic component loading (future use)
 */
export function resolve(path) {
    console.warn(`Platform Module: Page resolution not yet implemented for path: ${path}`);
    return null;
}

/**
 * Default export for UMD builds
 */
export default {
    platformNavigation,
    resolve,
};
