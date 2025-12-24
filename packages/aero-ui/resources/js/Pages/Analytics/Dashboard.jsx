import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
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
    ChartBarIcon,
    UsersIcon,
    ShoppingCartIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    EyeIcon,
    DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const AnalyticsDashboard = ({ stats = {}, topPages = [], traffic = [], conversions = [], auth, permissions = [] }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

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

    const hasPermission = (permission) => {
        return permissions?.includes(permission) || auth?.user?.isPlatformSuperAdmin;
    };

    const dashboardStats = useMemo(() => [
        {
            title: "Total Visitors",
            value: (stats?.totalVisitors || 0).toLocaleString(),
            icon: <UsersIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "+12.5% from last period",
            trend: 'up'
        },
        {
            title: "Page Views",
            value: (stats?.pageViews || 0).toLocaleString(),
            icon: <EyeIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "+8.3% from last period",
            trend: 'up'
        },
        {
            title: "Conversion Rate",
            value: `${stats?.conversionRate || 0}%`,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "-2.1% from last period",
            trend: 'down'
        },
        {
            title: "Revenue",
            value: `$${(stats?.revenue || 0).toLocaleString()}`,
            icon: <CurrencyDollarIcon className="w-6 h-6" />,
            color: "text-yellow-400",
            iconBg: "bg-yellow-500/20",
            description: "+15.7% from last period",
            trend: 'up'
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

    const sampleTopPages = topPages?.length > 0 ? topPages : [
        { id: 1, page: '/dashboard', views: 12450, bounceRate: 35, avgTime: '3:24' },
        { id: 2, page: '/products', views: 8920, bounceRate: 42, avgTime: '2:15' },
        { id: 3, page: '/checkout', views: 5340, bounceRate: 18, avgTime: '1:45' },
        { id: 4, page: '/about', views: 4125, bounceRate: 55, avgTime: '1:12' },
    ];

    const sampleTraffic = traffic?.length > 0 ? traffic : [
        { id: 1, source: 'Organic Search', visitors: 15420, percentage: 42 },
        { id: 2, source: 'Direct', visitors: 9850, percentage: 27 },
        { id: 3, source: 'Social Media', visitors: 6230, percentage: 17 },
        { id: 4, source: 'Referral', visitors: 5100, percentage: 14 },
    ];

    const sampleConversions = conversions?.length > 0 ? conversions : [
        { id: 1, goal: 'Product Purchase', completions: 842, rate: 3.4, value: '$125,430' },
        { id: 2, goal: 'Newsletter Signup', completions: 1523, rate: 6.2, value: '$0' },
        { id: 3, goal: 'Contact Form', completions: 456, rate: 1.9, value: '$0' },
    ];

    const deviceBreakdown = [
        { device: 'Desktop', percentage: 58, color: 'primary' },
        { device: 'Mobile', percentage: 35, color: 'success' },
        { device: 'Tablet', percentage: 7, color: 'warning' },
    ];

    return (
        <App>
            <Head title="Analytics Dashboard" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground dark:text-white">
                            Analytics Dashboard
                        </h1>
                        <p className="text-sm text-default-500 dark:text-gray-400 mt-1">
                            Website and business analytics overview
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={selectedPeriod === 'week' ? 'solid' : 'flat'}
                            color={selectedPeriod === 'week' ? 'primary' : 'default'}
                            radius={getThemeRadius()}
                            onPress={() => setSelectedPeriod('week')}
                        >
                            Week
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedPeriod === 'month' ? 'solid' : 'flat'}
                            color={selectedPeriod === 'month' ? 'primary' : 'default'}
                            radius={getThemeRadius()}
                            onPress={() => setSelectedPeriod('month')}
                        >
                            Month
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedPeriod === 'year' ? 'solid' : 'flat'}
                            color={selectedPeriod === 'year' ? 'primary' : 'default'}
                            radius={getThemeRadius()}
                            onPress={() => setSelectedPeriod('year')}
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
                    {/* Top Pages */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-semibold">Top Pages</h3>
                                </div>
                                {hasPermission('analytics.pages.view') && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        radius={getThemeRadius()}
                                        onPress={() => safeNavigate('analytics.pages.index')}
                                    >
                                        View All
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {sampleTopPages.map((page) => (
                                    <div key={page.id} className="p-3 rounded-lg bg-default-50 dark:bg-default-100/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium truncate">{page.page}</span>
                                            <span className="text-sm font-semibold text-primary">{page.views.toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-default-500">Bounce Rate</span>
                                                <p className="font-medium mt-0.5">{page.bounceRate}%</p>
                                            </div>
                                            <div>
                                                <span className="text-default-500">Avg. Time</span>
                                                <p className="font-medium mt-0.5">{page.avgTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Traffic Sources */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
                                <h3 className="text-lg font-semibold">Traffic Sources</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {sampleTraffic.map((source) => (
                                    <div key={source.id}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{source.source}</span>
                                            <span className="text-sm font-semibold">{source.visitors.toLocaleString()}</span>
                                        </div>
                                        <Progress 
                                            value={source.percentage} 
                                            size="sm"
                                            color="primary"
                                            className="max-w-full"
                                            showValueLabel={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Conversions */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <ShoppingCartIcon className="w-5 h-5 text-warning" />
                                <h3 className="text-lg font-semibold">Goal Conversions</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {sampleConversions.map((goal) => (
                                    <div key={goal.id} className="p-3 rounded-lg bg-default-50 dark:bg-default-100/10">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="text-sm font-semibold">{goal.goal}</h4>
                                                <p className="text-xs text-default-500 mt-0.5">{goal.completions} completions</p>
                                            </div>
                                            <Chip size="sm" color="success" variant="flat">
                                                {goal.rate}%
                                            </Chip>
                                        </div>
                                        {goal.value !== '$0' && (
                                            <p className="text-xs text-success font-medium">Value: {goal.value}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Device Breakdown */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <DevicePhoneMobileIcon className="w-5 h-5 text-secondary" />
                                <h3 className="text-lg font-semibold">Device Breakdown</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {deviceBreakdown.map((device, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{device.device}</span>
                                            <span className="text-sm font-semibold">{device.percentage}%</span>
                                        </div>
                                        <Progress 
                                            value={device.percentage} 
                                            size="sm"
                                            color={device.color}
                                            className="max-w-full"
                                        />
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

export default AnalyticsDashboard;
