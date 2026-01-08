/**
 * useHRMAC Hook
 * 
 * Provides access to HRMAC (Hierarchical Role-Based Module Access Control) utilities
 * with React context. Automatically gets auth from usePage() and provides memoized
 * access check functions.
 * 
 * @example
 * ```jsx
 * import { useHRMAC } from '@/Hooks/useHRMAC';
 * 
 * const EmployeePage = () => {
 *     const { hasAccess, canCreate, canUpdate, isSuperAdmin } = useHRMAC();
 *     
 *     if (!hasAccess('hrm.employees')) {
 *         return <AccessDenied />;
 *     }
 *     
 *     return (
 *         <>
 *             <h1>Employees</h1>
 *             {canCreate('hrm.employees.employee-directory') && (
 *                 <Button>Create Employee</Button>
 *             )}
 *         </>
 *     );
 * };
 * ```
 * 
 * @module useHRMAC
 */

import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    hasModuleAccess,
    hasSubModuleAccess,
    hasComponentAccess,
    canPerformAction,
    isSuperAdmin,
    hasAccess,
    getActionScope
} from '@/utils/moduleAccessUtils';

/**
 * HRMAC Hook
 * 
 * Returns memoized access check functions that automatically use current auth context.
 * All functions automatically handle Super Administrator bypass.
 * 
 * @returns {Object} Access check functions and user info
 */
export const useHRMAC = () => {
    const { auth } = usePage().props;
    
    return useMemo(() => ({
        // ========================================
        // Hierarchical Access Checks
        // ========================================
        
        /**
         * Check if user has access to a module
         * @param {string} moduleCode - Module code (e.g., 'hrm', 'crm')
         * @returns {boolean} True if user has access
         */
        hasModuleAccess: (moduleCode) => hasModuleAccess(moduleCode, auth),
        
        /**
         * Check if user has access to a sub-module
         * @param {string} moduleCode - Module code
         * @param {string} subModuleCode - Sub-module code
         * @returns {boolean} True if user has access
         */
        hasSubModuleAccess: (moduleCode, subModuleCode) => 
            hasSubModuleAccess(moduleCode, subModuleCode, auth),
        
        /**
         * Check if user has access to a component
         * @param {string} moduleCode - Module code
         * @param {string} subModuleCode - Sub-module code
         * @param {string} componentCode - Component code
         * @returns {boolean} True if user has access
         */
        hasComponentAccess: (moduleCode, subModuleCode, componentCode) => 
            hasComponentAccess(moduleCode, subModuleCode, componentCode, auth),
        
        /**
         * Check if user can perform a specific action
         * @param {string} moduleCode - Module code
         * @param {string} subModuleCode - Sub-module code
         * @param {string} componentCode - Component code
         * @param {string} actionCode - Action code (e.g., 'view', 'create', 'update', 'delete')
         * @returns {boolean} True if user can perform action
         */
        canPerformAction: (moduleCode, subModuleCode, componentCode, actionCode) => 
            canPerformAction(moduleCode, subModuleCode, componentCode, actionCode, auth),
        
        // ========================================
        // Generic Access Check (Dot Notation)
        // ========================================
        
        /**
         * Check access using dot notation path
         * Automatically determines level based on path segments
         * 
         * @param {string} path - Access path (e.g., 'hrm.employees.employee-directory.create')
         * @returns {boolean} True if user has access
         * 
         * @example
         * hasAccess('hrm') // Module level
         * hasAccess('hrm.employees') // Sub-module level
         * hasAccess('hrm.employees.employee-directory') // Component level
         * hasAccess('hrm.employees.employee-directory.create') // Action level
         */
        hasAccess: (path) => hasAccess(path, auth),
        
        // ========================================
        // Action Scope Helper
        // ========================================
        
        /**
         * Get user's access scope for a specific action
         * @param {string} actionPath - Full action path
         * @returns {string|null} Access scope: 'all', 'department', 'team', 'own', or null
         */
        getActionScope: (actionPath) => getActionScope(actionPath, auth),
        
        // ========================================
        // Convenience Action Checks
        // ========================================
        
        /**
         * Check if user can create resources at the given path
         * @param {string} basePath - Base path (e.g., 'hrm.employees.employee-directory')
         * @returns {boolean} True if user can create
         */
        canCreate: (basePath) => hasAccess(`${basePath}.create`, auth),
        
        /**
         * Check if user can view resources at the given path
         * @param {string} basePath - Base path
         * @returns {boolean} True if user can view
         */
        canView: (basePath) => hasAccess(`${basePath}.view`, auth),
        
        /**
         * Check if user can update resources at the given path
         * @param {string} basePath - Base path
         * @returns {boolean} True if user can update
         */
        canUpdate: (basePath) => hasAccess(`${basePath}.update`, auth),
        
        /**
         * Check if user can delete resources at the given path
         * @param {string} basePath - Base path
         * @returns {boolean} True if user can delete
         */
        canDelete: (basePath) => hasAccess(`${basePath}.delete`, auth),
        
        /**
         * Check if user can export data at the given path
         * @param {string} basePath - Base path
         * @returns {boolean} True if user can export
         */
        canExport: (basePath) => hasAccess(`${basePath}.export`, auth),
        
        /**
         * Check if user can import data at the given path
         * @param {string} basePath - Base path
         * @returns {boolean} True if user can import
         */
        canImport: (basePath) => hasAccess(`${basePath}.import`, auth),
        
        // ========================================
        // User Information
        // ========================================
        
        /**
         * Check if current user is a Super Administrator
         * Super Admins bypass all access checks
         * @returns {boolean} True if Super Admin
         */
        isSuperAdmin: () => isSuperAdmin(auth?.user),
        
        /**
         * Get current user object
         * @returns {Object|null} User object or null if not authenticated
         */
        user: auth?.user,
        
        /**
         * Get full auth context
         * @returns {Object} Auth object from Inertia
         */
        auth,
        
        /**
         * Check if user is authenticated
         * @returns {boolean} True if authenticated
         */
        isAuthenticated: () => !!auth?.user,
        
        // ========================================
        // Batch Access Checks
        // ========================================
        
        /**
         * Check multiple paths at once
         * Returns object with boolean values for each path
         * 
         * @param {string[]} paths - Array of access paths to check
         * @returns {Object} Object mapping paths to boolean values
         * 
         * @example
         * const access = checkMultiple([
         *     'hrm.employees.employee-directory.create',
         *     'hrm.employees.employee-directory.update',
         *     'hrm.employees.employee-directory.delete'
         * ]);
         * // Returns: { 'hrm.employees...create': true, ...update: false, ...delete: false }
         */
        checkMultiple: (paths) => {
            return paths.reduce((acc, path) => {
                acc[path] = hasAccess(path, auth);
                return acc;
            }, {});
        },
        
        /**
         * Check if user has ANY of the given permissions
         * @param {string[]} paths - Array of access paths
         * @returns {boolean} True if user has at least one
         */
        hasAny: (paths) => {
            return paths.some(path => hasAccess(path, auth));
        },
        
        /**
         * Check if user has ALL of the given permissions
         * @param {string[]} paths - Array of access paths
         * @returns {boolean} True if user has all
         */
        hasAll: (paths) => {
            return paths.every(path => hasAccess(path, auth));
        },
    }), [auth]);
};

export default useHRMAC;
