import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Button,
    Progress,
} from "@heroui/react";
import {
    UserGroupIcon,
    ClockIcon,
    ChartBarIcon,
    ServerStackIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    RocketLaunchIcon,
    PlusIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Dashboard = ({ stats, registrations, trials, provisioningQueue, auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
            setIsLargeScreen(window.innerWidth >= 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.permissions?.includes('*');
    };

    // Permission flags for UI rendering
    const canManageTenants = hasPermission('platform-onboarding.registrations.approve') || 
                             hasPermission('platform-onboarding.tenants.manage');

    const dashboardStats = useMemo(() => [
        {
            title: "Pending Registrations",
            value: stats?.pendingRegistrations || 0,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Awaiting verification",
        },
        {
            title: "Active Trials",
            value: stats?.activeTrials || 0,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Currently testing",
        },
        {
            title: "Conversion Rate",
            value: `${stats?.conversionRate || 0}%`,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Trial to paid",
        },
        {
            title: "Provisioning Queue",
            value: stats?.provisioningQueue || 0,
            icon: <ServerStackIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "In progress",
        },
    ], [stats]);

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        transform: `scale(var(--scale, 1))`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    });

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            verified: 'primary',
            approved: 'success',
            rejected: 'danger',
        };
        return colors[status] || 'default';
    };

    const getProvisioningStatusColor = (status) => {
        const colors = {
            queued: 'default',
            processing: 'primary',
            completed: 'success',
            failed: 'danger',
        };
        return colors[status] || 'default';
    };

    const getDaysRemainingColor = (days) => {
        if (days <= 3) return 'danger';
        if (days <= 7) return 'warning';
        return 'success';
    };

    return (
        <>
            <Head title="Platform Onboarding Dashboard" />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Platform Onboarding Dashboard">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                {/* Card Header with title + action buttons */}
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section with icon */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div 
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <RocketLaunchIcon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Platform Onboarding Dashboard
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Monitor tenant registrations, trials, and provisioning
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canManageTenants && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => safeNavigate(route('admin.onboarding.pending'))}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        View Pending
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="flat"
                                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                    onPress={() => router.reload({ only: ['stats', 'registrations', 'trials'] })}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Refresh
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards - REQUIRED at top */}
                                    <StatsCards stats={dashboardStats} className="mb-6" />
                                    
                                    {/* Main Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                        {/* Recent Registrations */}
                                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-4">
                                            <h3 className="text-base font-semibold mb-4">Recent Registrations</h3>
                                            <div className="space-y-3">
                                                {registrations && registrations.length > 0 ? (
                                                    registrations.map((registration) => (
                                                        <div key={registration.id} className="flex items-center justify-between p-3 bg-white dark:bg-default-100/50 rounded-lg">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-medium text-sm">{registration.companyName}</p>
                                                                    <Chip size="sm" variant="flat" color={getStatusColor(registration.status)}>
                                                                        {registration.status}
                                                                    </Chip>
                                                                </div>
                                                                <p className="text-xs text-default-500">{registration.email}</p>
                                                                <p className="text-xs text-default-400 mt-1">{registration.registeredAt}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-default-400 py-4">No recent registrations</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Active Trials */}
                                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-4">
                                            <h3 className="text-base font-semibold mb-4">Trial Expiration Monitoring</h3>
                                            <div className="space-y-3">
                                                {trials && trials.length > 0 ? (
                                                    trials.map((trial) => (
                                                        <div key={trial.id} className="flex items-center justify-between p-3 bg-white dark:bg-default-100/50 rounded-lg">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm">{trial.companyName}</p>
                                                                <p className="text-xs text-default-500">{trial.plan}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <Chip size="sm" variant="flat" color={getDaysRemainingColor(trial.daysRemaining)}>
                                                                    {trial.daysRemaining} days left
                                                                </Chip>
                                                                <p className="text-xs text-default-400 mt-1">{trial.expiresAt}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-default-400 py-4">No active trials</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Provisioning Queue & Registration Funnel */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                        {/* Provisioning Queue */}
                                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-4">
                                            <h3 className="text-base font-semibold mb-4">Provisioning Queue Status</h3>
                                            <div className="space-y-3">
                                                {provisioningQueue && provisioningQueue.length > 0 ? (
                                                    provisioningQueue.map((item) => (
                                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-default-100/50 rounded-lg">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-medium text-sm">{item.tenantName}</p>
                                                                    <Chip size="sm" variant="flat" color={getProvisioningStatusColor(item.status)}>
                                                                        {item.status}
                                                                    </Chip>
                                                                </div>
                                                                <p className="text-xs text-default-500">{item.database} database</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-default-400">{item.startedAt}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-default-400 py-4">Provisioning queue is empty</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Registration Funnel */}
                                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-4">
                                            <h3 className="text-base font-semibold mb-4">Registration Funnel</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium">Started</span>
                                                        <span className="text-sm text-default-500">{stats?.funnelStarted || 0}</span>
                                                    </div>
                                                    <Progress
                                                        value={100}
                                                        color="primary"
                                                        size="sm"
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium">Verified</span>
                                                        <span className="text-sm text-default-500">
                                                            {stats?.funnelVerified || 0} ({((stats?.funnelVerified / stats?.funnelStarted) * 100).toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={(stats?.funnelVerified / stats?.funnelStarted) * 100 || 0}
                                                        color="primary"
                                                        size="sm"
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium">Provisioned</span>
                                                        <span className="text-sm text-default-500">
                                                            {stats?.funnelProvisioned || 0} ({((stats?.funnelProvisioned / stats?.funnelStarted) * 100).toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={(stats?.funnelProvisioned / stats?.funnelStarted) * 100 || 0}
                                                        color="success"
                                                        size="sm"
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium">Active</span>
                                                        <span className="text-sm text-default-500">
                                                            {stats?.funnelActive || 0} ({((stats?.funnelActive / stats?.funnelStarted) * 100).toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={(stats?.funnelActive / stats?.funnelStarted) * 100 || 0}
                                                        color="success"
                                                        size="sm"
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex flex-wrap gap-3">
                                        {hasPermission('platform-onboarding.registrations.approve') && (
                                            <Button
                                                color="primary"
                                                variant="shadow"
                                                startContent={<CheckCircleIcon className="w-4 h-4" />}
                                                onPress={() => safeNavigate('admin.onboarding.pending')}
                                                radius={getThemeRadius()}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Approve Registrations
                                            </Button>
                                        )}
                                        {hasPermission('platform-onboarding.trials.manage') && (
                                            <Button
                                                variant="flat"
                                                color="primary"
                                                startContent={<CalendarIcon className="w-4 h-4" />}
                                                onPress={() => safeNavigate('admin.onboarding.trials')}
                                                radius={getThemeRadius()}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Extend Trials
                                            </Button>
                                        )}
                                        {hasPermission('platform-onboarding.queue.view') && (
                                            <Button
                                                variant="flat"
                                                color="default"
                                                startContent={<ServerStackIcon className="w-4 h-4" />}
                                                onPress={() => safeNavigate('admin.onboarding.provisioning')}
                                                radius={getThemeRadius()}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                View Queue
                                            </Button>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Use App layout wrapper
Dashboard.layout = (page) => <App children={page} />;

export default Dashboard;

