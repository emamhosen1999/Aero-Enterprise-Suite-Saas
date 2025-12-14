/**
 * ModuleGate Component
 * 
 * A gating wrapper that checks if the current tenant has access to a module.
 * Shows an "Upgrade Required" UI if the module is not subscribed.
 * 
 * Use this to wrap module pages that might be accessed via direct URL navigation.
 * The backend middleware will block unauthorized requests, but this provides
 * a friendly frontend fallback for edge cases.
 * 
 * Usage:
 *   <ModuleGate module="hrm">
 *     <HRMDashboard />
 *   </ModuleGate>
 * 
 *   // With custom locked content
 *   <ModuleGate module="crm" lockedContent={<CustomUpgradePrompt />}>
 *     <CRMDashboard />
 *   </ModuleGate>
 */

import React from 'react';
import { usePage, Link } from '@inertiajs/react';
import { 
    Card, 
    CardBody, 
    Button, 
    Chip 
} from '@heroui/react';
import { 
    LockClosedIcon, 
    SparklesIcon,
    ArrowUpCircleIcon 
} from '@heroicons/react/24/outline';
import useSaaSAccess from '@/Hooks/useSaaSAccess';

/**
 * Default locked content component
 * Shows a friendly upgrade prompt with module info
 */
const DefaultLockedContent = ({ module, moduleName }) => {
    const { isSaaSMode } = useSaaSAccess();
    
    // Get billing/upgrade route if available
    const upgradeRoute = isSaaSMode ? '/billing/plans' : null;
    
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <Card className="max-w-md w-full">
                <CardBody className="text-center py-12 px-8">
                    {/* Lock Icon */}
                    <div 
                        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
                        style={{ 
                            backgroundColor: 'color-mix(in srgb, var(--theme-warning, #F5A524) 20%, transparent)' 
                        }}
                    >
                        <LockClosedIcon 
                            className="w-10 h-10" 
                            style={{ color: 'var(--theme-warning, #F5A524)' }} 
                        />
                    </div>
                    
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Module Not Available
                    </h2>
                    
                    {/* Module Badge */}
                    <Chip 
                        color="warning" 
                        variant="flat" 
                        className="mb-4"
                        startContent={<SparklesIcon className="w-4 h-4" />}
                    >
                        {moduleName || module?.toUpperCase() || 'Premium Module'}
                    </Chip>
                    
                    {/* Description */}
                    <p className="text-default-500 mb-6">
                        Your current subscription doesn't include access to the{' '}
                        <strong>{moduleName || module?.toUpperCase()}</strong> module.
                        {isSaaSMode && ' Upgrade your plan to unlock this feature.'}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {upgradeRoute && (
                            <Button
                                as={Link}
                                href={upgradeRoute}
                                color="primary"
                                size="lg"
                                startContent={<ArrowUpCircleIcon className="w-5 h-5" />}
                            >
                                Upgrade Plan
                            </Button>
                        )}
                        <Button
                            as={Link}
                            href="/"
                            variant="flat"
                            size="lg"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                    
                    {/* Contact Support */}
                    <p className="text-xs text-default-400 mt-6">
                        Need help? Contact your administrator or{' '}
                        <a href="mailto:support@example.com" className="text-primary hover:underline">
                            support team
                        </a>
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};

/**
 * RBAC Locked Content (has subscription but no RBAC access)
 */
const RBACLockedContent = ({ module, moduleName }) => {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <Card className="max-w-md w-full">
                <CardBody className="text-center py-12 px-8">
                    {/* Lock Icon */}
                    <div 
                        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
                        style={{ 
                            backgroundColor: 'color-mix(in srgb, var(--theme-danger, #F31260) 20%, transparent)' 
                        }}
                    >
                        <LockClosedIcon 
                            className="w-10 h-10" 
                            style={{ color: 'var(--theme-danger, #F31260)' }} 
                        />
                    </div>
                    
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Access Restricted
                    </h2>
                    
                    {/* Module Badge */}
                    <Chip 
                        color="danger" 
                        variant="flat" 
                        className="mb-4"
                    >
                        {moduleName || module?.toUpperCase() || 'Restricted Module'}
                    </Chip>
                    
                    {/* Description */}
                    <p className="text-default-500 mb-6">
                        You don't have permission to access the{' '}
                        <strong>{moduleName || module?.toUpperCase()}</strong> module.
                        Please contact your administrator to request access.
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            as={Link}
                            href="/"
                            color="primary"
                            size="lg"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

/**
 * ModuleGate Component
 * 
 * @param {Object} props
 * @param {string} props.module - Module code to check (e.g., 'hrm', 'crm')
 * @param {string} props.moduleName - Display name for the module (optional)
 * @param {React.ReactNode} props.children - Content to show if access granted
 * @param {React.ReactNode} props.lockedContent - Custom content for locked state
 * @param {boolean} props.checkRBAC - Also check RBAC access (default: true)
 * @param {Function} props.onLocked - Callback when access is denied
 */
const ModuleGate = ({ 
    module, 
    moduleName,
    children, 
    lockedContent,
    checkRBAC = true,
    onLocked
}) => {
    const { hasSubscription, canAccessModule, isSaaSMode } = useSaaSAccess();
    
    // Check subscription
    const isSubscribed = hasSubscription(module);
    
    // Check RBAC (if enabled)
    const hasRBACAccess = checkRBAC ? canAccessModule(module) : true;
    
    // Determine access state
    const hasAccess = isSubscribed && hasRBACAccess;
    
    // Call onLocked callback if denied
    React.useEffect(() => {
        if (!hasAccess && onLocked) {
            onLocked({ 
                module, 
                reason: !isSubscribed ? 'subscription' : 'rbac' 
            });
        }
    }, [hasAccess, isSubscribed, module, onLocked]);
    
    // Access granted - render children
    if (hasAccess) {
        return <>{children}</>;
    }
    
    // Custom locked content provided
    if (lockedContent) {
        return <>{lockedContent}</>;
    }
    
    // Subscription issue - show upgrade prompt
    if (!isSubscribed) {
        return <DefaultLockedContent module={module} moduleName={moduleName} />;
    }
    
    // RBAC issue - show access denied
    return <RBACLockedContent module={module} moduleName={moduleName} />;
};

/**
 * Higher-Order Component version
 * 
 * Usage:
 *   export default withModuleGate('hrm')(HRMDashboard);
 */
export const withModuleGate = (module, options = {}) => {
    return (WrappedComponent) => {
        return function WithModuleGate(props) {
            return (
                <ModuleGate module={module} {...options}>
                    <WrappedComponent {...props} />
                </ModuleGate>
            );
        };
    };
};

/**
 * Hook to check module access imperatively
 * 
 * Usage:
 *   const { isLocked, reason } = useModuleAccess('hrm');
 */
export const useModuleAccess = (module) => {
    const { hasSubscription, canAccessModule } = useSaaSAccess();
    
    const isSubscribed = hasSubscription(module);
    const hasRBACAccess = canAccessModule(module);
    const isLocked = !isSubscribed || !hasRBACAccess;
    
    return {
        isLocked,
        isSubscribed,
        hasRBACAccess,
        reason: !isSubscribed ? 'subscription' : (!hasRBACAccess ? 'rbac' : null)
    };
};

export default ModuleGate;
