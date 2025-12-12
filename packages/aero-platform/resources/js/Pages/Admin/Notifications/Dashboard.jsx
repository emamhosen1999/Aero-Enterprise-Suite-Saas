import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
} from "@heroui/react";
import {
    BellIcon,
    EnvelopeIcon,
    ChatBubbleLeftIcon,
    MegaphoneIcon,
    DocumentTextIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const NotificationsDashboard = ({ stats, recentNotifications, channels, broadcasts, auth }) => {
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
            title: "Sent Today",
            value: stats?.sentToday || "12,453",
            icon: <EnvelopeIcon className="w-8 h-8" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Notifications sent",
            trend: 'up'
        },
        {
            title: "Delivery Rate",
            value: `${stats?.deliveryRate || 98}%`,
            icon: <BellIcon className="w-8 h-8" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Successfully delivered"
        },
        {
            title: "Active Channels",
            value: stats?.activeChannels || 4,
            icon: <ChatBubbleLeftIcon className="w-8 h-8" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Email, SMS, Push, Slack"
        },
        {
            title: "Broadcasts",
            value: stats?.broadcasts || 24,
            icon: <MegaphoneIcon className="w-8 h-8" />,
            color: "text-yellow-400",
            iconBg: "bg-yellow-500/20",
            description: "Active campaigns"
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

    const recent = recentNotifications || [
        { type: 'System Alert', message: 'High memory usage detected on server 3', recipients: 'All Admins', sentAt: '5 mins ago', status: 'sent' },
        { type: 'Broadcast', message: 'Scheduled maintenance on Dec 15', recipients: '1,245 tenants', sentAt: '1 hour ago', status: 'sent' },
        { type: 'Security', message: 'Failed login attempts detected', recipients: 'Security Team', sentAt: '2 hours ago', status: 'sent' },
        { type: 'Update', message: 'New feature release announcement', recipients: 'All Users', sentAt: '3 hours ago', status: 'sent' },
        { type: 'Billing', message: 'Payment reminder for expiring trials', recipients: '45 tenants', sentAt: '5 hours ago', status: 'sent' },
    ];

    const channelsList = channels || [
        { name: 'Email', status: 'active', sent: 8234, failed: 12 },
        { name: 'SMS', status: 'active', sent: 3421, failed: 8 },
        { name: 'Push', status: 'active', sent: 5632, failed: 24 },
        { name: 'Slack', status: 'active', sent: 892, failed: 2 },
    ];

    const broadcastsList = broadcasts || [
        { name: 'Maintenance Notice', status: 'active', scheduled: 'Dec 15, 2024', recipients: 1245 },
        { name: 'Feature Announcement', status: 'draft', scheduled: 'Dec 20, 2024', recipients: 0 },
        { name: 'Security Update', status: 'completed', scheduled: 'Dec 1, 2024', recipients: 1532 },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'sent':
            case 'completed':
                return 'success';
            case 'draft':
            case 'scheduled':
                return 'warning';
            case 'failed':
                return 'danger';
            default:
                return 'default';
        }
    };

    const getTypeIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'system alert':
            case 'security':
                return <BellIcon className="w-4 h-4" />;
            case 'broadcast':
            case 'update':
                return <MegaphoneIcon className="w-4 h-4" />;
            default:
                return <EnvelopeIcon className="w-4 h-4" />;
        }
    };

    return (
        <App>
            <Head title="Notifications Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                        <p className="text-sm text-default-500 mt-1">Platform-wide notification management</p>
                    </div>
                    {hasPermission('notifications.broadcast') && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            radius={themeRadius}
                        >
                            New Broadcast
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <StatsCards stats={dashboardStats} isLoading={false} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Recent Notifications */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <BellIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Recent Notifications</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {recent.map((notification, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-default-100">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(notification.type)}
                                                <Chip size="sm" color={getStatusColor(notification.status)} variant="flat">
                                                    {notification.type}
                                                </Chip>
                                            </div>
                                            <span className="text-xs text-default-500">{notification.sentAt}</span>
                                        </div>
                                        <div className="text-sm mb-1">{notification.message}</div>
                                        <div className="text-xs text-default-500">
                                            To: {notification.recipients}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Channel Status */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <ChatBubbleLeftIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Channel Status</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {channelsList.map((channel, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-default-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{channel.name}</span>
                                                <Chip size="sm" color={getStatusColor(channel.status)} variant="flat">
                                                    {channel.status}
                                                </Chip>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <div className="text-default-500">Sent</div>
                                                <div className="font-semibold">{channel.sent.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-default-500">Failed</div>
                                                <div className="font-semibold text-danger">{channel.failed}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Active Broadcasts */}
                    <Card className="transition-all duration-200 lg:col-span-2" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <MegaphoneIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Broadcast Campaigns</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {broadcastsList.map((broadcast, index) => (
                                    <div key={index} className="p-4 rounded-lg bg-default-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="font-medium">{broadcast.name}</div>
                                            <Chip size="sm" color={getStatusColor(broadcast.status)} variant="flat">
                                                {broadcast.status}
                                            </Chip>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Scheduled:</span>
                                                <span>{broadcast.scheduled}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Recipients:</span>
                                                <span>{broadcast.recipients > 0 ? broadcast.recipients.toLocaleString() : '-'}</span>
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

export default NotificationsDashboard;
