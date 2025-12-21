import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Progress,
} from "@heroui/react";
import {
    CodeBracketIcon,
    ServerIcon,
    ClockIcon,
    CpuChipIcon,
    CircleStackIcon,
    QueueListIcon,
    ArrowPathIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const DeveloperDashboard = ({ stats, cache, queues, system, auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
            setIsLargeScreen(window.innerWidth >= 1280);
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

    const themeRadius = getThemeRadius();

    const hasPermission = (permission) => {
        return auth?.user?.permissions?.includes(permission) || auth?.user?.isPlatformSuperAdmin;
    };

    const dashboardStats = useMemo(() => [
        {
            title: "Cache Hit Rate",
            value: `${stats?.cacheHitRate || 0}%`,
            icon: <CircleStackIcon className="w-8 h-8" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Cache efficiency",
            trend: stats?.cacheHitRate >= 80 ? 'up' : 'down'
        },
        {
            title: "Queue Jobs",
            value: stats?.queueJobs || 0,
            icon: <QueueListIcon className="w-8 h-8" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Pending jobs"
        },
        {
            title: "System Load",
            value: `${stats?.systemLoad || 0}%`,
            icon: <CpuChipIcon className="w-8 h-8" />,
            color: stats?.systemLoad > 80 ? "text-red-400" : "text-yellow-400",
            iconBg: stats?.systemLoad > 80 ? "bg-red-500/20" : "bg-yellow-500/20",
            description: "CPU usage"
        },
        {
            title: "Uptime",
            value: stats?.uptime || "99.9%",
            icon: <ServerIcon className="w-8 h-8" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "System availability"
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

    const cacheStores = cache || [
        { name: 'Redis', status: 'healthy', hitRate: 92, size: '2.4 GB' },
        { name: 'File Cache', status: 'healthy', hitRate: 78, size: '1.2 GB' },
        { name: 'Database Cache', status: 'warning', hitRate: 65, size: '890 MB' },
    ];

    const queuesList = queues || [
        { name: 'default', pending: 24, failed: 2, processing: 5 },
        { name: 'emails', pending: 156, failed: 0, processing: 12 },
        { name: 'notifications', pending: 89, failed: 1, processing: 8 },
        { name: 'reports', pending: 5, failed: 0, processing: 2 },
    ];

    const systemMetrics = system || [
        { name: 'Memory Usage', value: 68, unit: '%', status: 'normal' },
        { name: 'Disk Usage', value: 45, unit: '%', status: 'normal' },
        { name: 'Database Connections', value: 32, unit: 'active', status: 'normal' },
        { name: 'Response Time', value: 124, unit: 'ms', status: 'normal' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
            case 'normal':
                return 'success';
            case 'warning':
                return 'warning';
            case 'error':
            case 'critical':
                return 'danger';
            default:
                return 'default';
        }
    };

    return (
        <App>
            <Head title="Developer Tools Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Developer Tools</h1>
                        <p className="text-sm text-default-500 mt-1">System monitoring and maintenance</p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('developer.cache.manage') && (
                            <Button
                                color="primary"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                radius={themeRadius}
                            >
                                Clear Cache
                            </Button>
                        )}
                        {hasPermission('developer.maintenance.toggle') && (
                            <Button
                                color="warning"
                                startContent={<WrenchScrewdriverIcon className="w-4 h-4" />}
                                radius={themeRadius}
                            >
                                Maintenance Mode
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <StatsCards stats={dashboardStats} isLoading={false} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Cache Status */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <CircleStackIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Cache Status</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {cacheStores.map((store, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-default-100">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{store.name}</span>
                                                <Chip size="sm" color={getStatusColor(store.status)} variant="flat">
                                                    {store.status}
                                                </Chip>
                                            </div>
                                            <Progress
                                                value={store.hitRate}
                                                color={store.hitRate >= 80 ? 'success' : store.hitRate >= 60 ? 'warning' : 'danger'}
                                                size="sm"
                                                className="mb-1"
                                            />
                                            <div className="flex justify-between text-xs text-default-500">
                                                <span>Hit Rate: {store.hitRate}%</span>
                                                <span>Size: {store.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Queue Management */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <QueueListIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Queue Status</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {queuesList.map((queue, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-default-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium capitalize">{queue.name}</span>
                                            {queue.failed > 0 && (
                                                <Chip size="sm" color="danger" variant="flat">
                                                    {queue.failed} failed
                                                </Chip>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <div className="text-default-500">Pending</div>
                                                <div className="font-semibold">{queue.pending}</div>
                                            </div>
                                            <div>
                                                <div className="text-default-500">Processing</div>
                                                <div className="font-semibold">{queue.processing}</div>
                                            </div>
                                            <div>
                                                <div className="text-default-500">Failed</div>
                                                <div className="font-semibold text-danger">{queue.failed}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* System Metrics */}
                    <Card className="transition-all duration-200 lg:col-span-2" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <CpuChipIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">System Metrics</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {systemMetrics.map((metric, index) => (
                                    <div key={index} className="p-4 rounded-lg bg-default-100">
                                        <div className="text-sm text-default-500 mb-2">{metric.name}</div>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-2xl font-bold">{metric.value}</span>
                                            <span className="text-sm text-default-500">{metric.unit}</span>
                                        </div>
                                        {typeof metric.value === 'number' && metric.unit === '%' && (
                                            <Progress
                                                value={metric.value}
                                                color={metric.value > 80 ? 'danger' : metric.value > 60 ? 'warning' : 'success'}
                                                size="sm"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </motion.div>
        </App>
    );
};

export default DeveloperDashboard;
