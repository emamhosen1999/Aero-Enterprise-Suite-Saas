import React, { createContext, useContext, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePage } from '@inertiajs/react';

/**
 * Module Context
 * 
 * Provides centralized module/feature flag state management for the application.
 * Wrap your app with <ModuleProvider> to enable module checking throughout
 * the component tree without prop drilling.
 * 
 * @example
 * // In your app layout
 * import { ModuleProvider } from '@/Context/ModuleContext';
 * 
 * function App({ children }) {
 *   return (
 *     <ModuleProvider>
 *       {children}
 *     </ModuleProvider>
 *   );
 * }
 * 
 * @example
 * // In any child component
 * import { useModuleContext } from '@/Context/ModuleContext';
 * 
 * function MyComponent() {
 *   const { isModuleEnabled, enabledModules } = useModuleContext();
 *   
 *   if (isModuleEnabled('crm')) {
 *     return <CRMFeature />;
 *   }
 * }
 */

const ModuleContext = createContext(null);

/**
 * All available modules in the system
 */
export const AVAILABLE_MODULES = {
    HRM: 'hrm',
    CRM: 'crm',
    PROJECT: 'project',
    FINANCE: 'finance',
    INVENTORY: 'inventory',
    POS: 'pos',
    DMS: 'dms',
    QUALITY: 'quality',
    ANALYTICS: 'analytics',
    COMPLIANCE: 'compliance',
};

/**
 * Module metadata for display purposes
 */
export const MODULE_METADATA = {
    hrm: {
        name: 'HR Management',
        description: 'Complete HR solution with employee management, leave, payroll',
        icon: 'UserGroupIcon',
        color: 'primary',
    },
    crm: {
        name: 'CRM',
        description: 'Customer relationship management and sales pipeline',
        icon: 'UserCircleIcon',
        color: 'success',
    },
    project: {
        name: 'Project Management',
        description: 'Project tracking, tasks, and team collaboration',
        icon: 'ClipboardDocumentCheckIcon',
        color: 'warning',
    },
    finance: {
        name: 'Finance',
        description: 'Financial management, invoicing, and accounting',
        icon: 'BanknotesIcon',
        color: 'secondary',
    },
    inventory: {
        name: 'Inventory',
        description: 'Stock management and warehouse operations',
        icon: 'CubeIcon',
        color: 'default',
    },
    pos: {
        name: 'Point of Sale',
        description: 'Retail sales and transaction management',
        icon: 'ShoppingCartIcon',
        color: 'danger',
    },
    dms: {
        name: 'Document Management',
        description: 'Document storage, versioning, and workflows',
        icon: 'DocumentDuplicateIcon',
        color: 'primary',
    },
    quality: {
        name: 'Quality Management',
        description: 'Quality control, audits, and compliance tracking',
        icon: 'ShieldCheckIcon',
        color: 'success',
    },
    analytics: {
        name: 'Analytics',
        description: 'Business intelligence and reporting dashboards',
        icon: 'ChartBarIcon',
        color: 'warning',
    },
    compliance: {
        name: 'Compliance',
        description: 'Regulatory compliance and policy management',
        icon: 'ScaleIcon',
        color: 'secondary',
    },
};

/**
 * ModuleProvider Component
 * 
 * Provides module state to all child components through React Context.
 * Automatically extracts enabled modules from Inertia shared props.
 */
export function ModuleProvider({ children, modules: overrideModules }) {
    const { auth, context } = usePage().props;

    /**
     * Extract enabled modules from shared props
     */
    const enabledModules = useMemo(() => {
        // Allow override for testing or special cases
        if (overrideModules) {
            return overrideModules.map(m => m.toLowerCase());
        }

        // For tenant context
        if (context === 'tenant' && auth?.accessibleModules) {
            return auth.accessibleModules.map(m => m.code?.toLowerCase() || m.code);
        }

        // For admin context (all modules available)
        if (context === 'admin') {
            return Object.values(AVAILABLE_MODULES);
        }

        // Fallback
        if (auth?.enabled_modules) {
            return auth.enabled_modules.map(m => m.toLowerCase());
        }

        return [];
    }, [auth?.accessibleModules, auth?.enabled_modules, context, overrideModules]);

    /**
     * Check if a specific module is enabled
     */
    const isModuleEnabled = useCallback((moduleCode) => {
        if (!moduleCode) return false;
        return enabledModules.includes(moduleCode.toLowerCase());
    }, [enabledModules]);

    /**
     * Check if ALL specified modules are enabled
     */
    const areAllModulesEnabled = useCallback((moduleCodes) => {
        if (!Array.isArray(moduleCodes) || moduleCodes.length === 0) return false;
        return moduleCodes.every(code => isModuleEnabled(code));
    }, [isModuleEnabled]);

    /**
     * Check if ANY of the specified modules are enabled
     */
    const isAnyModuleEnabled = useCallback((moduleCodes) => {
        if (!Array.isArray(moduleCodes) || moduleCodes.length === 0) return false;
        return moduleCodes.some(code => isModuleEnabled(code));
    }, [isModuleEnabled]);

    /**
     * Get module metadata
     */
    const getModuleInfo = useCallback((moduleCode) => {
        const code = moduleCode?.toLowerCase();
        return MODULE_METADATA[code] || null;
    }, []);

    /**
     * Get all enabled modules with their metadata
     */
    const getEnabledModulesWithInfo = useCallback(() => {
        return enabledModules.map(code => ({
            code,
            ...MODULE_METADATA[code],
        }));
    }, [enabledModules]);

    /**
     * Get all disabled modules with their metadata
     */
    const getDisabledModulesWithInfo = useCallback(() => {
        const allCodes = Object.values(AVAILABLE_MODULES);
        return allCodes
            .filter(code => !enabledModules.includes(code))
            .map(code => ({
                code,
                ...MODULE_METADATA[code],
            }));
    }, [enabledModules]);

    /**
     * Filter navigation items based on enabled modules
     */
    const filterNavigationByModules = useCallback((navigationItems, moduleKeyProp = 'module') => {
        return navigationItems.filter(item => {
            // If no module requirement, always show
            if (!item[moduleKeyProp]) return true;
            
            const requiredModule = item[moduleKeyProp];
            if (Array.isArray(requiredModule)) {
                return isAnyModuleEnabled(requiredModule);
            }
            return isModuleEnabled(requiredModule);
        });
    }, [isModuleEnabled, isAnyModuleEnabled]);

    const value = useMemo(() => ({
        // State
        enabledModules,
        context,
        isLoading: !auth,
        
        // Check functions
        isModuleEnabled,
        areAllModulesEnabled,
        isAnyModuleEnabled,
        
        // Info getters
        getModuleInfo,
        getEnabledModulesWithInfo,
        getDisabledModulesWithInfo,
        
        // Navigation helper
        filterNavigationByModules,
        
        // Constants
        AVAILABLE_MODULES,
        MODULE_METADATA,
    }), [
        enabledModules,
        context,
        auth,
        isModuleEnabled,
        areAllModulesEnabled,
        isAnyModuleEnabled,
        getModuleInfo,
        getEnabledModulesWithInfo,
        getDisabledModulesWithInfo,
        filterNavigationByModules,
    ]);

    return (
        <ModuleContext.Provider value={value}>
            {children}
        </ModuleContext.Provider>
    );
}

ModuleProvider.propTypes = {
    children: PropTypes.node.isRequired,
    /** Override modules for testing */
    modules: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Hook to access module context
 * 
 * @throws {Error} If used outside of ModuleProvider
 */
export function useModuleContext() {
    const context = useContext(ModuleContext);
    
    if (context === null) {
        throw new Error('useModuleContext must be used within a ModuleProvider');
    }
    
    return context;
}

/**
 * Hook for simple module check (convenience wrapper)
 * Can be used without ModuleProvider - will use direct usePage() props
 */
export function useModuleCheck(moduleCode) {
    const context = useContext(ModuleContext);
    
    // If context is available, use it
    if (context) {
        return context.isModuleEnabled(moduleCode);
    }
    
    // Fallback to direct page props check
    const { auth, context: pageContext } = usePage().props;
    
    if (pageContext === 'admin') return true;
    
    if (auth?.accessibleModules) {
        return auth.accessibleModules.some(
            m => (m.code?.toLowerCase() || m.code) === moduleCode?.toLowerCase()
        );
    }
    
    return false;
}

export default ModuleContext;
