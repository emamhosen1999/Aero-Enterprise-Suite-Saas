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
    CubeTransparentIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    CogIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Dashboard = ({ stats, integrations, recentCalls, auth }) => {
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
            title: "Active Integrations",
            value: stats?.activeIntegrations || 0,
            icon: <CubeTransparentIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Connected services",
        },
        {
            title: "API Calls Today",
            value: stats?.apiCallsToday?.toLocaleString() || "0",
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Total requests",
        },
        {
            title: "Success Rate",
            value: `${stats?.successRate || 0}%`,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "API reliability",
        },
        {
            title: "Connected Apps",
            value: stats?.connectedApps || 0,
            icon: <CogIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Third-party apps",
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
            connected: 'success',
            disconnected: 'default',
            pending: 'warning',
            error: 'danger',
        };
        return colors[status] || 'default';
    };

    const getCategoryColor = (category) => {
        const colors = {
            payments: 'primary',
            storage: 'success',
            communication: 'warning',
            productivity: 'secondary',
        };
        return colors[category?.toLowerCase()] || 'default';
    };

    const getStatusCodeColor = (code) => {
        if (code >= 200 && code < 300) return 'success';
        if (code >= 400 && code < 500) return 'warning';
        if (code >= 500) return 'danger';
        return 'default';
    };

    return (
        <App>
            <Head title="Integrations Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground dark:text-white">Integrations Dashboard</h1>
                        <p className="text-sm text-default-500 mt-1">Monitor API usage and integration status</p>
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
                    {/* Active Integrations */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <h2 className="text-lg font-semibold">Active Integrations</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {integrations && integrations.length > 0 ? (
                                    integrations.map((integration) => (
                                        <div key={integration.id} className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${integration.color || 'default'}-500/20`}>
                                                    <CubeTransparentIcon className={`w-5 h-5 text-${integration.color || 'default'}-500`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm">{integration.name}</p>
                                                        <Chip size="sm" variant="flat" color={getCategoryColor(integration.category)}>
                                                            {integration.category}
                                                        </Chip>
                                                    </div>
                                                    <p className="text-xs text-default-500">
                                                        {integration.apiCalls?.toLocaleString() || 0} calls today
                                                    </p>
                                                </div>
                                            </div>
                                            <Chip size="sm" color={getStatusColor(integration.status)}>
                                                {integration.status}
                                            </Chip>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-default-400 py-4">No active integrations</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* API Usage Metrics */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <h2 className="text-lg font-semibold">API Usage Metrics</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {integrations && integrations.slice(0, 4).map((integration) => (
                                    <div key={integration.id}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">{integration.name}</span>
                                            <span className="text-sm text-default-500">
                                                {integration.apiCalls?.toLocaleString() || 0} calls
                                            </span>
                                        </div>
                                        <Progress
                                            value={integration.usagePercent || 0}
                                            color={integration.usagePercent > 80 ? 'danger' : integration.usagePercent > 60 ? 'warning' : 'success'}
                                            size="sm"
                                            className="w-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Recent API Calls */}
                <Card style={getCardStyle()}>
                    <CardHeader style={getCardHeaderStyle()}>
                        <div className="flex justify-between items-center w-full">
                            <h2 className="text-lg font-semibold">Recent API Calls</h2>
                            {hasPermission('integrations.logs.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => safeNavigate('integrations.logs')}
                                    radius={getThemeRadius()}
                                >
                                    View All Logs
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-2">
                            {recentCalls && recentCalls.length > 0 ? (
                                recentCalls.map((call, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Chip size="sm" variant="flat" color={getStatusCodeColor(call.statusCode)}>
                                                {call.statusCode}
                                            </Chip>
                                            <div>
                                                <p className="text-sm font-medium">{call.integration}</p>
                                                <p className="text-xs text-default-500">{call.endpoint}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-default-500">{call.timestamp}</p>
                                            <p className="text-xs text-default-400">{call.duration}ms</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-default-400 py-4">No recent API calls</p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Quick Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {hasPermission('integrations.api-keys.manage') && (
                        <Button
                            color="primary"
                            startContent={<KeyIcon className="w-4 h-4" />}
                            onPress={() => safeNavigate('integrations.api-keys')}
                            radius={getThemeRadius()}
                        >
                            Manage API Keys
                        </Button>
                    )}
                    {hasPermission('integrations.webhooks.manage') && (
                        <Button
                            variant="flat"
                            color="primary"
                            startContent={<CogIcon className="w-4 h-4" />}
                            onPress={() => safeNavigate('integrations.webhooks')}
                            radius={getThemeRadius()}
                        >
                            Configure Webhooks
                        </Button>
                    )}
                    {hasPermission('integrations.view') && (
                        <Button
                            variant="flat"
                            color="default"
                            startContent={<DocumentTextIcon className="w-4 h-4" />}
                            onPress={() => safeNavigate('integrations.documentation')}
                            radius={getThemeRadius()}
                        >
                            View Documentation
                        </Button>
                    )}
                </div>
            </motion.div>
        </App>
    );
};

export default Dashboard;
