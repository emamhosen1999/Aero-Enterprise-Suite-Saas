import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Input,
} from "@heroui/react";
import {
    ShieldCheckIcon,
    UserIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const AuditLogsDashboard = ({ stats, recentLogs, securityEvents, topUsers, auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
            title: "Total Events",
            value: stats?.totalEvents || "124,532",
            icon: <ClockIcon className="w-8 h-8" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Last 24 hours"
        },
        {
            title: "Security Events",
            value: stats?.securityEvents || 24,
            icon: <ExclamationTriangleIcon className="w-8 h-8" />,
            color: "text-red-400",
            iconBg: "bg-red-500/20",
            description: "Requires attention",
            trend: stats?.securityEvents > 20 ? 'up' : 'down'
        },
        {
            title: "Active Users",
            value: stats?.activeUsers || 1245,
            icon: <UserIcon className="w-8 h-8" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Currently logged in"
        },
        {
            title: "Audit Compliance",
            value: `${stats?.compliance || 98}%`,
            icon: <ShieldCheckIcon className="w-8 h-8" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Tracking coverage"
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

    const logs = recentLogs || [
        { user: 'admin@platform.com', action: 'Tenant Created', resource: 'tenant#1245', ip: '192.168.1.1', timestamp: '2 mins ago', severity: 'info' },
        { user: 'support@platform.com', action: 'Plan Updated', resource: 'subscription#532', ip: '192.168.1.2', timestamp: '15 mins ago', severity: 'info' },
        { user: 'admin@platform.com', action: 'User Deleted', resource: 'user#892', ip: '192.168.1.1', timestamp: '1 hour ago', severity: 'warning' },
        { user: 'system', action: 'Backup Completed', resource: 'database', ip: 'localhost', timestamp: '2 hours ago', severity: 'success' },
        { user: 'unknown', action: 'Failed Login', resource: 'auth', ip: '45.123.45.67', timestamp: '3 hours ago', severity: 'error' },
    ];

    const security = securityEvents || [
        { type: 'Failed Login', count: 12, severity: 'high', lastOccurred: '5 mins ago' },
        { type: 'Unauthorized Access', count: 3, severity: 'critical', lastOccurred: '1 hour ago' },
        { type: 'Password Reset', count: 45, severity: 'low', lastOccurred: '2 hours ago' },
        { type: 'Suspicious Activity', count: 2, severity: 'high', lastOccurred: '4 hours ago' },
    ];

    const topUsersList = topUsers || [
        { name: 'admin@platform.com', actions: 234, lastActive: '2 mins ago' },
        { name: 'support@platform.com', actions: 189, lastActive: '10 mins ago' },
        { name: 'manager@platform.com', actions: 156, lastActive: '1 hour ago' },
        { name: 'developer@platform.com', actions: 98, lastActive: '2 hours ago' },
    ];

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical':
            case 'error':
                return 'danger';
            case 'high':
            case 'warning':
                return 'warning';
            case 'success':
            case 'low':
                return 'success';
            default:
                return 'primary';
        }
    };

    return (
        <App>
            <Head title="Audit Logs Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
                        <p className="text-sm text-default-500 mt-1">Platform activity and security monitoring</p>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search logs..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                        />
                        {hasPermission('audit.filter') && (
                            <Button
                                isIconOnly
                                variant="flat"
                                radius={themeRadius}
                            >
                                <FunnelIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <StatsCards stats={dashboardStats} isLoading={false} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Recent Activity Logs */}
                    <Card className="transition-all duration-200 lg:col-span-2" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Recent Activity</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {logs.map((log, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-default-100">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Chip size="sm" color={getSeverityColor(log.severity)} variant="flat">
                                                    {log.action}
                                                </Chip>
                                            </div>
                                            <span className="text-xs text-default-500">{log.timestamp}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-default-500">User: </span>
                                                <span>{log.user}</span>
                                            </div>
                                            <div>
                                                <span className="text-default-500">IP: </span>
                                                <span>{log.ip}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-default-500">Resource: </span>
                                                <span>{log.resource}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Security Events */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Security Events</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {security.map((event, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-default-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium">{event.type}</span>
                                            <Chip size="sm" color={getSeverityColor(event.severity)} variant="flat">
                                                {event.severity}
                                            </Chip>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Count:</span>
                                                <span>{event.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Last:</span>
                                                <span>{event.lastOccurred}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Top Active Users */}
                    <Card className="transition-all duration-200 lg:col-span-3" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Top Active Users (24h)</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {topUsersList.map((user, index) => (
                                    <div key={index} className="p-4 rounded-lg bg-default-100">
                                        <div className="font-medium truncate mb-2">{user.name}</div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Actions:</span>
                                                <span className="font-semibold">{user.actions}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Last Active:</span>
                                                <span>{user.lastActive}</span>
                                            </div>
                                        </div>
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

export default AuditLogsDashboard;
