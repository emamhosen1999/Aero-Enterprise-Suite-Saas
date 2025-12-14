import React from 'react';
import PropTypes from 'prop-types';
import { useModule } from '@/Hooks/useModule';
import { Card, CardBody, Button } from '@heroui/react';
import { LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * RequireModule Component
 * 
 * A wrapper component that conditionally renders its children based on
 * whether the specified module(s) are enabled for the current user/tenant.
 * 
 * @example
 * // Basic usage - render children only if CRM module is enabled
 * <RequireModule module="crm">
 *   <CRMDashboard />
 * </RequireModule>
 * 
 * @example
 * // Multiple modules - require ALL to be enabled
 * <RequireModule module={['crm', 'hrm']} requireAll>
 *   <IntegratedDashboard />
 * </RequireModule>
 * 
 * @example
 * // Multiple modules - require ANY to be enabled
 * <RequireModule module={['crm', 'hrm']}>
 *   <SomeFeature />
 * </RequireModule>
 * 
 * @example
 * // With custom fallback UI
 * <RequireModule module="crm" fallback={<UpgradePrompt />}>
 *   <CRMDashboard />
 * </RequireModule>
 * 
 * @example
 * // Show locked state with upgrade prompt
 * <RequireModule module="analytics" showLocked>
 *   <AnalyticsPanel />
 * </RequireModule>
 */
const RequireModule = ({
    module,
    children,
    fallback = null,
    requireAll = false,
    showLocked = false,
    lockedMessage,
    lockedTitle,
    upgradeUrl,
    onUpgradeClick,
    className = '',
}) => {
    const { isEnabled, hasAll, hasAny, isLoading, getDisabled } = useModule(module);

    // Determine if access is granted based on requireAll flag
    const isMultiple = Array.isArray(module);
    const hasAccess = isMultiple
        ? (requireAll ? hasAll : hasAny)
        : isEnabled;

    // While loading, you might want to show nothing or a skeleton
    if (isLoading) {
        return null;
    }

    // If access is granted, render children
    if (hasAccess) {
        return <>{children}</>;
    }

    // If showLocked is true, show a locked state UI
    if (showLocked) {
        const disabledModules = getDisabled();
        const moduleNames = Array.isArray(module) ? module : [module];
        
        return (
            <Card 
                className={`border-2 border-dashed border-default-200 bg-default-50 ${className}`}
                shadow="none"
            >
                <CardBody className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 p-3 rounded-full bg-warning-100 dark:bg-warning-900/20">
                        <LockClosedIcon className="w-8 h-8 text-warning-600 dark:text-warning-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {lockedTitle || 'Module Not Available'}
                    </h3>
                    <p className="text-sm text-default-500 max-w-md mb-4">
                        {lockedMessage || (
                            requireAll
                                ? `This feature requires the following modules: ${moduleNames.join(', ').toUpperCase()}`
                                : `This feature requires one of: ${moduleNames.join(', ').toUpperCase()}`
                        )}
                    </p>
                    {(upgradeUrl || onUpgradeClick) && (
                        <Button
                            color="primary"
                            variant="flat"
                            size="sm"
                            onPress={onUpgradeClick}
                            as={upgradeUrl ? 'a' : 'button'}
                            href={upgradeUrl}
                        >
                            Upgrade Plan
                        </Button>
                    )}
                </CardBody>
            </Card>
        );
    }

    // Return custom fallback or null
    return fallback;
};

RequireModule.propTypes = {
    /** Module code(s) to check. Can be a string or array of strings. */
    module: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]).isRequired,
    
    /** Content to render if module is enabled */
    children: PropTypes.node.isRequired,
    
    /** Custom fallback content when module is disabled */
    fallback: PropTypes.node,
    
    /** When true and module is an array, ALL modules must be enabled */
    requireAll: PropTypes.bool,
    
    /** When true, shows a locked state UI instead of nothing */
    showLocked: PropTypes.bool,
    
    /** Custom message for the locked state */
    lockedMessage: PropTypes.string,
    
    /** Custom title for the locked state */
    lockedTitle: PropTypes.string,
    
    /** URL to redirect to for upgrading */
    upgradeUrl: PropTypes.string,
    
    /** Callback when upgrade button is clicked */
    onUpgradeClick: PropTypes.func,
    
    /** Additional CSS classes for the locked card */
    className: PropTypes.string,
};

/**
 * Higher-Order Component version for wrapping entire components
 * 
 * @example
 * const ProtectedCRMPage = withModuleGuard('crm')(CRMPage);
 * 
 * // With options
 * const ProtectedPage = withModuleGuard('crm', { 
 *   showLocked: true,
 *   fallback: <AccessDenied />
 * })(MyPage);
 */
export function withModuleGuard(module, options = {}) {
    return function (WrappedComponent) {
        const WithModuleGuard = (props) => (
            <RequireModule module={module} {...options}>
                <WrappedComponent {...props} />
            </RequireModule>
        );
        
        WithModuleGuard.displayName = `WithModuleGuard(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
        
        return WithModuleGuard;
    };
}

/**
 * Inverse component - renders children only if module is DISABLED
 * Useful for showing upgrade prompts in place of features
 * 
 * @example
 * <RequireModuleDisabled module="analytics">
 *   <UpgradeToAnalyticsPromo />
 * </RequireModuleDisabled>
 */
export const RequireModuleDisabled = ({
    module,
    children,
    requireAll = false,
}) => {
    const { isEnabled, hasAll, hasAny, isLoading } = useModule(module);

    if (isLoading) {
        return null;
    }

    const isMultiple = Array.isArray(module);
    const hasAccess = isMultiple
        ? (requireAll ? hasAll : hasAny)
        : isEnabled;

    // Render children only if access is NOT granted
    return hasAccess ? null : <>{children}</>;
};

RequireModuleDisabled.propTypes = {
    module: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]).isRequired,
    children: PropTypes.node.isRequired,
    requireAll: PropTypes.bool,
};

export default RequireModule;
