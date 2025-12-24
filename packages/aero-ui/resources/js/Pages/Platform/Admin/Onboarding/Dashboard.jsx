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
        <App>
            <Head title="Platform Onboarding Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground dark:text-white">Platform Onboarding Dashboard</h1>
                        <p className="text-sm text-default-500 mt-1">Monitor tenant registrations and provisioning</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={selectedPeriod === 'month' ? 'solid' : 'flat'}
                            color="primary"
                            onPress={() => setSelectedPeriod('month')}
                            radius={getThemeRadius()}
                        >
                            Month
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedPeriod === 'year' ? 'solid' : 'flat'}
                            color="primary"
                            onPress={() => setSelectedPeriod('year')}
                            radius={getThemeRadius()}
                        >
                            Year
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-6">
                    <StatsCards stats={dashboardStats} />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Recent Registrations */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <h2 className="text-lg font-semibold">Recent Registrations</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {registrations && registrations.length > 0 ? (
                                    registrations.map((registration) => (
                                        <div key={registration.id} className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
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
                        </CardBody>
                    </Card>

                    {/* Active Trials */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <h2 className="text-lg font-semibold">Trial Expiration Monitoring</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {trials && trials.length > 0 ? (
                                    trials.map((trial) => (
                                        <div key={trial.id} className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
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
                        </CardBody>
                    </Card>
                </div>

                {/* Provisioning Queue & Registration Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Provisioning Queue */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <h2 className="text-lg font-semibold">Provisioning Queue Status</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {provisioningQueue && provisioningQueue.length > 0 ? (
                                    provisioningQueue.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
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
                        </CardBody>
                    </Card>

                    {/* Registration Funnel */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <h2 className="text-lg font-semibold">Registration Funnel</h2>
                        </CardHeader>
                        <CardBody>
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
                        </CardBody>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {hasPermission('platform-onboarding.registrations.approve') && (
                        <Button
                            color="primary"
                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                            onPress={() => safeNavigate('admin.onboarding.pending')}
                            radius={getThemeRadius()}
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
                        >
                            View Queue
                        </Button>
                    )}
                </div>
            </motion.div>
        </App>
    );
};

export default Dashboard;
