import React from 'react';
import PropTypes from 'prop-types';
import { usePermissions } from '@/Hooks/usePermissions';
import { Card, CardBody, Button } from '@heroui/react';
import { ShieldExclamationIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * RequirePermission Component
 * 
 * A wrapper component that conditionally renders its children based on
 * whether the current user has the required permission(s).
 * 
 * @example
 * // Basic usage - render children only if user can create users
 * <RequirePermission permission="users.create">
 *   <CreateUserButton />
 * </RequirePermission>
 * 
 * @example
 * // Multiple permissions - require ANY to be granted
 * <RequirePermission permission={['users.view', 'users.edit']}>
 *   <UserPanel />
 * </RequirePermission>
 * 
 * @example
 * // Multiple permissions - require ALL to be granted
 * <RequirePermission permission={['users.create', 'users.delete']} requireAll>
 *   <UserAdminPanel />
 * </RequirePermission>
 * 
 * @example
 * // With custom fallback UI
 * <RequirePermission permission="reports.export" fallback={<UpgradeMessage />}>
 *   <ExportButton />
 * </RequirePermission>
 * 
 * @example
 * // Show denied state with message
 * <RequirePermission permission="admin.settings" showDenied>
 *   <AdminSettings />
 * </RequirePermission>
 */
const RequirePermission = ({
    permission,
    children,
    fallback = null,
    requireAll = false,
    showDenied = false,
    deniedMessage,
    deniedTitle,
    className = '',
}) => {
    const { can, canAny, canAll, isAuthenticated } = usePermissions();

    // Handle not authenticated
    if (!isAuthenticated) {
        if (showDenied) {
            return (
                <AccessDeniedCard
                    title="Authentication Required"
                    message="Please log in to access this feature."
                    className={className}
                />
            );
        }
        return fallback;
    }

    // Determine if access is granted
    const isMultiple = Array.isArray(permission);
    const hasAccess = isMultiple
        ? (requireAll ? canAll(permission) : canAny(permission))
        : can(permission);

    // If access is granted, render children
    if (hasAccess) {
        return <>{children}</>;
    }

    // If showDenied is true, show an access denied UI
    if (showDenied) {
        const permissionNames = Array.isArray(permission) ? permission : [permission];
        
        return (
            <AccessDeniedCard
                title={deniedTitle || 'Access Denied'}
                message={deniedMessage || `You don't have permission to access this feature. Required: ${permissionNames.join(', ')}`}
                className={className}
            />
        );
    }

    // Otherwise render fallback or nothing
    return fallback;
};

/**
 * Access Denied Card Component
 */
const AccessDeniedCard = ({ title, message, className }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
    >
        <Card 
            className="border-2 border-dashed border-danger-200 bg-danger-50/50 dark:bg-danger-900/10"
        >
            <CardBody className="flex flex-col items-center justify-center p-8 text-center">
                <div className="p-3 rounded-full bg-danger-100 dark:bg-danger-900/30 mb-4">
                    <ShieldExclamationIcon className="w-8 h-8 text-danger-500" />
                </div>
                <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400 mb-2">
                    {title}
                </h3>
                <p className="text-sm text-danger-600 dark:text-danger-500 max-w-sm">
                    {message}
                </p>
            </CardBody>
        </Card>
    </motion.div>
);

RequirePermission.propTypes = {
    /** Permission(s) to check - can be a string or array of permission names */
    permission: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
    
    /** Content to render when permission is granted */
    children: PropTypes.node.isRequired,
    
    /** Content to render when permission is denied (default: null) */
    fallback: PropTypes.node,
    
    /** When checking multiple permissions, require ALL (default: false = require ANY) */
    requireAll: PropTypes.bool,
    
    /** Whether to show the access denied UI when permission is not granted */
    showDenied: PropTypes.bool,
    
    /** Custom message for access denied state */
    deniedMessage: PropTypes.string,
    
    /** Custom title for access denied state */
    deniedTitle: PropTypes.string,
    
    /** Additional CSS classes */
    className: PropTypes.string,
};

/**
 * RequireRole Component
 * 
 * A wrapper component that conditionally renders based on user roles.
 * 
 * @example
 * <RequireRole role="admin">
 *   <AdminPanel />
 * </RequireRole>
 * 
 * @example
 * <RequireRole role={['admin', 'hr_manager']} requireAll={false}>
 *   <ManagementPanel />
 * </RequireRole>
 */
export const RequireRole = ({
    role,
    children,
    fallback = null,
    requireAll = false,
    showDenied = false,
    deniedMessage,
    className = '',
}) => {
    const { hasRole, hasAllRoles, isAuthenticated } = usePermissions();

    if (!isAuthenticated) {
        return fallback;
    }

    const isMultiple = Array.isArray(role);
    const hasAccess = isMultiple
        ? (requireAll ? hasAllRoles(role) : hasRole(role))
        : hasRole(role);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (showDenied) {
        const roleNames = Array.isArray(role) ? role : [role];
        return (
            <AccessDeniedCard
                title="Role Required"
                message={deniedMessage || `This feature requires one of these roles: ${roleNames.join(', ')}`}
                className={className}
            />
        );
    }

    return fallback;
};

RequireRole.propTypes = {
    role: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
    children: PropTypes.node.isRequired,
    fallback: PropTypes.node,
    requireAll: PropTypes.bool,
    showDenied: PropTypes.bool,
    deniedMessage: PropTypes.string,
    className: PropTypes.string,
};

/**
 * RequireAdmin Component
 * 
 * Shorthand for requiring admin role.
 * 
 * @example
 * <RequireAdmin>
 *   <AdminOnlyFeature />
 * </RequireAdmin>
 */
export const RequireAdmin = ({ children, fallback = null, showDenied = false }) => {
    const { isAdmin } = usePermissions();

    if (isAdmin) {
        return <>{children}</>;
    }

    if (showDenied) {
        return (
            <AccessDeniedCard
                title="Admin Access Required"
                message="This feature is only available to administrators."
            />
        );
    }

    return fallback;
};

RequireAdmin.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.node,
    showDenied: PropTypes.bool,
};

/**
 * Higher-Order Component version of RequirePermission
 * 
 * @example
 * const ProtectedComponent = withPermission('users.manage')(UserManagement);
 */
export function withPermission(permission, options = {}) {
    return function (WrappedComponent) {
        const WithPermission = (props) => (
            <RequirePermission permission={permission} {...options}>
                <WrappedComponent {...props} />
            </RequirePermission>
        );
        
        WithPermission.displayName = `WithPermission(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
        
        return WithPermission;
    };
}

/**
 * Higher-Order Component version of RequireRole
 * 
 * @example
 * const AdminComponent = withRole('admin')(AdminPanel);
 */
export function withRole(role, options = {}) {
    return function (WrappedComponent) {
        const WithRole = (props) => (
            <RequireRole role={role} {...options}>
                <WrappedComponent {...props} />
            </RequireRole>
        );
        
        WithRole.displayName = `WithRole(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
        
        return WithRole;
    };
}

export default RequirePermission;
