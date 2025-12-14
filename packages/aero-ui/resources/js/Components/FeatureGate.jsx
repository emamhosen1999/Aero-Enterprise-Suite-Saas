import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, usePage } from '@inertiajs/react';
import { useModule } from '@/Hooks/useModule';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import { LockClosedIcon, SparklesIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * Module metadata for display in upgrade prompts
 */
const MODULE_DISPLAY_INFO = {
    hrm: { 
        name: 'HR Management', 
        plan: 'Professional',
        description: 'Employee management, leave tracking, and payroll',
        color: 'primary',
    },
    crm: { 
        name: 'CRM', 
        plan: 'Professional',
        description: 'Customer relationships, leads, and sales pipeline',
        color: 'success',
    },
    project: { 
        name: 'Project Management', 
        plan: 'Professional',
        description: 'Project tracking, tasks, and team collaboration',
        color: 'warning',
    },
    finance: { 
        name: 'Finance', 
        plan: 'Business',
        description: 'Invoicing, expenses, and financial reporting',
        color: 'secondary',
    },
    accounting: { 
        name: 'Accounting', 
        plan: 'Business',
        description: 'Full accounting suite with ledger and statements',
        color: 'secondary',
    },
    inventory: { 
        name: 'Inventory', 
        plan: 'Business',
        description: 'Stock management and warehouse operations',
        color: 'default',
    },
    pos: { 
        name: 'Point of Sale', 
        plan: 'Business',
        description: 'Retail sales and transaction management',
        color: 'danger',
    },
    dms: { 
        name: 'Document Management', 
        plan: 'Professional',
        description: 'Document storage, versioning, and workflows',
        color: 'primary',
    },
    quality: { 
        name: 'Quality Management', 
        plan: 'Enterprise',
        description: 'Quality control, audits, and compliance',
        color: 'success',
    },
    analytics: { 
        name: 'Analytics', 
        plan: 'Enterprise',
        description: 'Advanced BI dashboards and custom reports',
        color: 'warning',
    },
    compliance: { 
        name: 'Compliance', 
        plan: 'Enterprise',
        description: 'Regulatory compliance and policy management',
        color: 'secondary',
    },
};

/**
 * Plan tier styling
 */
const PLAN_STYLES = {
    Starter: { 
        bgGradient: 'from-slate-500 to-slate-600',
        badge: 'default',
    },
    Professional: { 
        bgGradient: 'from-blue-500 to-indigo-600',
        badge: 'primary',
    },
    Business: { 
        bgGradient: 'from-amber-500 to-orange-600',
        badge: 'warning',
    },
    Enterprise: { 
        bgGradient: 'from-purple-500 to-pink-600',
        badge: 'secondary',
    },
    Gold: { 
        bgGradient: 'from-yellow-500 to-amber-600',
        badge: 'warning',
    },
};

/**
 * FeatureGate Component
 * 
 * A gating component that controls access to features based on module availability.
 * Shows a professional "locked" teaser UI when the module is not enabled.
 * 
 * @example
 * // Basic usage - show teaser when locked
 * <FeatureGate module="crm">
 *   <CRMDashboard />
 * </FeatureGate>
 * 
 * @example
 * // Hide completely when locked (no teaser)
 * <FeatureGate module="analytics" showTeaser={false}>
 *   <AnalyticsPanel />
 * </FeatureGate>
 * 
 * @example
 * // Custom plan name override
 * <FeatureGate module="accounting" planName="Gold">
 *   <AccountingModule />
 * </FeatureGate>
 * 
 * @example
 * // With custom upgrade URL
 * <FeatureGate module="pos" upgradeUrl="/billing/upgrade">
 *   <POSTerminal />
 * </FeatureGate>
 */
const FeatureGate = ({
    module,
    children,
    showTeaser = true,
    planName,
    upgradeUrl = '/subscription/manage',
    className = '',
    teaserClassName = '',
}) => {
    const { isEnabled, isLoading } = useModule(module);

    /**
     * Get module display information
     */
    const moduleInfo = useMemo(() => {
        const normalizedModule = module?.toLowerCase();
        return MODULE_DISPLAY_INFO[normalizedModule] || {
            name: module?.charAt(0).toUpperCase() + module?.slice(1) || 'This Feature',
            plan: 'Professional',
            description: 'Advanced functionality for your business',
            color: 'primary',
        };
    }, [module]);

    /**
     * Determine which plan to display
     */
    const displayPlan = planName || moduleInfo.plan;
    const planStyle = PLAN_STYLES[displayPlan] || PLAN_STYLES.Professional;

    // While loading, optionally show a subtle loading state
    if (isLoading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-32 bg-default-100 rounded-xl" />
            </div>
        );
    }

    // If module is enabled, render children
    if (isEnabled) {
        return <>{children}</>;
    }

    // If not showing teaser, render nothing
    if (!showTeaser) {
        return null;
    }

    // Render the locked teaser UI
    return (
        <div className={`relative ${className}`}>
            {/* Blurred/Grayed background effect with children preview */}
            <div className={`relative overflow-hidden rounded-2xl ${teaserClassName}`}>
                {/* Faded preview of the locked content */}
                <div 
                    className="pointer-events-none select-none"
                    style={{
                        filter: 'blur(4px) grayscale(60%)',
                        opacity: 0.4,
                    }}
                    aria-hidden="true"
                >
                    {children}
                </div>

                {/* Overlay with lock message */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center p-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <Card 
                        className="max-w-md w-full bg-content1/95 dark:bg-content1/90 backdrop-blur-xl shadow-2xl border border-default-200/50"
                        shadow="lg"
                    >
                        <CardBody className="p-8 text-center">
                            {/* Animated Lock Icon */}
                            <motion.div
                                initial={{ y: -10 }}
                                animate={{ y: 0 }}
                                transition={{ 
                                    repeat: Infinity, 
                                    repeatType: 'reverse', 
                                    duration: 2,
                                    ease: 'easeInOut'
                                }}
                                className="mb-6 flex justify-center"
                            >
                                <div className={`p-4 rounded-full bg-gradient-to-br ${planStyle.bgGradient} shadow-lg`}>
                                    <LockClosedIcon className="w-10 h-10 text-white" />
                                </div>
                            </motion.div>

                            {/* Module Name */}
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {moduleInfo.name}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-default-500 mb-4">
                                {moduleInfo.description}
                            </p>

                            {/* Plan Badge */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <SparklesIcon className="w-4 h-4 text-warning-500" />
                                <span className="text-sm text-default-600">
                                    Available on the
                                </span>
                                <Chip 
                                    size="sm" 
                                    color={planStyle.badge}
                                    variant="flat"
                                    className="font-semibold"
                                >
                                    {displayPlan}
                                </Chip>
                                <span className="text-sm text-default-600">
                                    Plan
                                </span>
                            </div>

                            {/* Upgrade Button */}
                            <Button
                                as={Link}
                                href={upgradeUrl}
                                color="primary"
                                size="lg"
                                variant="shadow"
                                className="font-semibold px-8"
                                startContent={<ArrowUpCircleIcon className="w-5 h-5" />}
                            >
                                Upgrade Plan
                            </Button>

                            {/* Optional secondary link */}
                            <p className="mt-4 text-xs text-default-400">
                                <Link 
                                    href="/pricing" 
                                    className="text-primary-500 hover:text-primary-600 hover:underline"
                                >
                                    Compare all plans →
                                </Link>
                            </p>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

FeatureGate.propTypes = {
    /** The module code to check (e.g., 'crm', 'accounting', 'analytics') */
    module: PropTypes.string.isRequired,
    
    /** Content to render when module is enabled */
    children: PropTypes.node.isRequired,
    
    /** Whether to show the locked teaser UI when disabled (default: true) */
    showTeaser: PropTypes.bool,
    
    /** Override the plan name shown in the teaser */
    planName: PropTypes.oneOf(['Starter', 'Professional', 'Business', 'Enterprise', 'Gold']),
    
    /** URL for the upgrade button */
    upgradeUrl: PropTypes.string,
    
    /** Additional CSS classes for the wrapper */
    className: PropTypes.string,
    
    /** Additional CSS classes for the teaser container */
    teaserClassName: PropTypes.string,
};

/**
 * Compact version of FeatureGate for inline elements
 * Shows a smaller lock indicator instead of full overlay
 */
export const FeatureGateInline = ({
    module,
    children,
    showTeaser = true,
    planName,
}) => {
    const { isEnabled } = useModule(module);
    const moduleInfo = MODULE_DISPLAY_INFO[module?.toLowerCase()] || {};
    const displayPlan = planName || moduleInfo.plan || 'Professional';

    if (isEnabled) {
        return <>{children}</>;
    }

    if (!showTeaser) {
        return null;
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-default-100 text-default-400 cursor-not-allowed">
            <LockClosedIcon className="w-3.5 h-3.5" />
            <span className="text-xs">
                {displayPlan} Plan
            </span>
        </span>
    );
};

FeatureGateInline.propTypes = {
    module: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    showTeaser: PropTypes.bool,
    planName: PropTypes.string,
};

/**
 * Higher-Order Component version
 * 
 * @example
 * const ProtectedCRM = withFeatureGate('crm')(CRMComponent);
 */
export function withFeatureGate(module, options = {}) {
    return function (WrappedComponent) {
        const WithFeatureGate = (props) => (
            <FeatureGate module={module} {...options}>
                <WrappedComponent {...props} />
            </FeatureGate>
        );
        
        WithFeatureGate.displayName = `WithFeatureGate(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
        
        return WithFeatureGate;
    };
}

export default FeatureGate;
