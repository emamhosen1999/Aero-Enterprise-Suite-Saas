import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * useModule Hook
 * 
 * A custom React hook for checking module/feature flag availability
 * in the Inertia.js frontend. Works with the shared props from the backend.
 * 
 * @example
 * // Basic usage - check if a single module is enabled
 * const { isEnabled, isLoading } = useModule('crm');
 * if (isEnabled) {
 *   // Render CRM features
 * }
 * 
 * @example
 * // Check multiple modules at once
 * const { hasAll, hasAny, getEnabled } = useModule(['crm', 'hrm', 'inventory']);
 * if (hasAll) {
 *   // All modules are enabled
 * }
 * if (hasAny) {
 *   // At least one module is enabled
 * }
 * 
 * @example
 * // Get list of which modules are enabled from a set
 * const { getEnabled } = useModule(['crm', 'hrm']);
 * const enabledOnes = getEnabled(); // ['hrm']
 * 
 * @param {string|string[]} moduleKey - Module code(s) to check
 * @returns {Object} Module state and helper methods
 */
export function useModule(moduleKey) {
    const { auth, context } = usePage().props;

    /**
     * Extract enabled modules from the shared props.
     * The backend sends accessibleModules which contains module codes.
     */
    const enabledModules = useMemo(() => {
        // For tenant context, use accessibleModules from auth
        if (context === 'tenant' && auth?.accessibleModules) {
            // accessibleModules is an array of module objects with 'code' property
            return auth.accessibleModules.map(m => m.code?.toLowerCase() || m.code);
        }

        // For admin context, typically all modules are accessible
        if (context === 'admin') {
            return ['hrm', 'crm', 'project', 'finance', 'inventory', 'pos', 'dms', 'quality', 'analytics', 'compliance'];
        }

        // Fallback: check for enabled_modules prop (if you add it to shared props)
        if (auth?.enabled_modules) {
            return auth.enabled_modules.map(m => m.toLowerCase());
        }

        return [];
    }, [auth?.accessibleModules, auth?.enabled_modules, context]);

    /**
     * Normalize module keys to lowercase for consistent comparison
     */
    const normalizedKeys = useMemo(() => {
        if (!moduleKey) return [];
        
        const keys = Array.isArray(moduleKey) ? moduleKey : [moduleKey];
        return keys.map(k => k?.toLowerCase()).filter(Boolean);
    }, [moduleKey]);

    /**
     * Check if the user is authenticated and modules are loaded
     */
    const isLoading = !auth || (context === 'tenant' && auth.accessibleModules === undefined);

    /**
     * Check if a single module is enabled
     */
    const isEnabled = useMemo(() => {
        if (isLoading || normalizedKeys.length === 0) return false;
        
        // For single module check
        if (normalizedKeys.length === 1) {
            return enabledModules.includes(normalizedKeys[0]);
        }

        // For multiple modules, check if ANY is enabled (use hasAll for stricter check)
        return normalizedKeys.some(key => enabledModules.includes(key));
    }, [enabledModules, normalizedKeys, isLoading]);

    /**
     * Check if ALL specified modules are enabled
     */
    const hasAll = useMemo(() => {
        if (isLoading || normalizedKeys.length === 0) return false;
        return normalizedKeys.every(key => enabledModules.includes(key));
    }, [enabledModules, normalizedKeys, isLoading]);

    /**
     * Check if ANY of the specified modules are enabled
     */
    const hasAny = useMemo(() => {
        if (isLoading || normalizedKeys.length === 0) return false;
        return normalizedKeys.some(key => enabledModules.includes(key));
    }, [enabledModules, normalizedKeys, isLoading]);

    /**
     * Get list of enabled modules from the specified keys
     */
    const getEnabled = useMemo(() => {
        return () => normalizedKeys.filter(key => enabledModules.includes(key));
    }, [enabledModules, normalizedKeys]);

    /**
     * Get list of disabled modules from the specified keys
     */
    const getDisabled = useMemo(() => {
        return () => normalizedKeys.filter(key => !enabledModules.includes(key));
    }, [enabledModules, normalizedKeys]);

    /**
     * Check if a specific module code is enabled (for dynamic checks)
     */
    const checkModule = useMemo(() => {
        return (code) => {
            if (!code || isLoading) return false;
            return enabledModules.includes(code.toLowerCase());
        };
    }, [enabledModules, isLoading]);

    return {
        // Primary check for single/any module
        isEnabled,
        
        // Loading state
        isLoading,
        
        // Multi-module checks
        hasAll,
        hasAny,
        
        // Getter functions
        getEnabled,
        getDisabled,
        
        // Dynamic check function
        checkModule,
        
        // Raw enabled modules list (for advanced use)
        enabledModules,
    };
}

/**
 * Shorthand hook for simple boolean check
 * 
 * @example
 * const crmEnabled = useModuleEnabled('crm');
 * if (crmEnabled) { ... }
 */
export function useModuleEnabled(moduleKey) {
    const { isEnabled } = useModule(moduleKey);
    return isEnabled;
}

/**
 * Hook to get all enabled module codes
 * 
 * @example
 * const enabledModules = useEnabledModules();
 * // ['hrm', 'crm', 'project']
 */
export function useEnabledModules() {
    const { enabledModules } = useModule([]);
    return enabledModules;
}

export default useModule;
