import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    ButtonGroup,
    Progress,
    Chip,
} from "@heroui/react";
import {
    ChartPieIcon,
    ChartBarIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    GlobeAltIcon,
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const Analytics = ({ 
    stats: initialStats, 
    registrationTrend, 
    conversionFunnel, 
    planDistribution, 
    geographicDistribution,
    averageOnboardingTime,
    period: initialPeriod,
    auth 
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [period, setPeriod] = useState(initialPeriod || 'month');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(initialStats || {});

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const themeRadius = useThemeRadius();

    const changePeriod = (newPeriod) => {
        setPeriod(newPeriod);
        setLoading(true);
        router.get(route('admin.onboarding.analytics'), { period: newPeriod }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
            onError: () => setLoading(false),
        });
    };

    const statsData = useMemo(() => [
        {
            title: "Total Registrations",
            value: stats?.totalRegistrations || 0,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
        },
        {
            title: "Successful Onboardings",
            value: stats?.successfulOnboardings || 0,
            icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
        },
        {
            title: "Conversion Rate",
            value: `${stats?.conversionRate || 0}%`,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
        },
        {
            title: "Avg. Trial Days",
            value: stats?.averageTrialDays || 0,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
        },
    ], [stats]);

    const totalFunnel = conversionFunnel?.started || 1;
    const funnelData = [
        { step: 'Started', count: conversionFunnel?.started || 0, percentage: 100 },
        { step: 'Verified', count: conversionFunnel?.verified || 0, percentage: ((conversionFunnel?.verified || 0) / totalFunnel * 100).toFixed(1) },
        { step: 'Provisioned', count: conversionFunnel?.provisioned || 0, percentage: ((conversionFunnel?.provisioned || 0) / totalFunnel * 100).toFixed(1) },
        { step: 'Subscribed', count: conversionFunnel?.subscribed || 0, percentage: ((conversionFunnel?.subscribed || 0) / totalFunnel * 100).toFixed(1) },
    ];

    return (
        <>
            <Head title="Onboarding Analytics" />

            <div className="flex flex-col w-full h-full p-4">
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="transition-all duration-200">
                            <CardHeader
                                className="border-b p-0"
                                style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                                                    borderRadius: 'var(--borderRadius, 12px)',
                                                }}
                                            >
                                                <ChartPieIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Onboarding Analytics
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Registration funnel, conversion rates, and activation metrics
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <ButtonGroup>
                                                {['week', 'month', 'quarter', 'year'].map((p) => (
                                                    <Button
                                                        key={p}
                                                        size="sm"
                                                        variant={period === p ? 'solid' : 'flat'}
                                                        color={period === p ? 'primary' : 'default'}
                                                        onPress={() => changePeriod(p)}
                                                        isLoading={loading && period === p}
                                                    >
                                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                                    </Button>
                                                ))}
                                            </ButtonGroup>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                {/* Stats */}
                                <StatsCards stats={statsData} className="mb-6" />

                                {/* Main Content Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {/* Conversion Funnel */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider">
                                            <h3 className="text-lg font-semibold">Conversion Funnel</h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="space-y-4">
                                                {funnelData.map((item, index) => (
                                                    <div key={item.step}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium">{item.step}</span>
                                                            <span className="text-sm text-default-500">
                                                                {item.count} ({item.percentage}%)
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={Number(item.percentage)}
                                                            color={index === 0 ? 'primary' : index === funnelData.length - 1 ? 'success' : 'default'}
                                                            size="sm"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Plan Distribution */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider">
                                            <h3 className="text-lg font-semibold">Plan Distribution</h3>
                                        </CardHeader>
                                        <CardBody>
                                            {planDistribution && planDistribution.length > 0 ? (
                                                <div className="space-y-3">
                                                    {planDistribution.map((item, index) => {
                                                        const total = planDistribution.reduce((sum, p) => sum + p.count, 0);
                                                        const percentage = ((item.count / total) * 100).toFixed(1);
                                                        return (
                                                            <div key={index} className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                                <div className="flex items-center gap-3">
                                                                    <Chip size="sm" variant="flat" color="primary">
                                                                        {item.plan}
                                                                    </Chip>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold">{item.count}</p>
                                                                    <p className="text-xs text-default-500">{percentage}%</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-center text-default-400 py-4">No plan distribution data</p>
                                            )}
                                        </CardBody>
                                    </Card>
                                </div>

                                {/* Second Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Geographic Distribution */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider flex items-center gap-2">
                                            <GlobeAltIcon className="w-5 h-5 text-default-500" />
                                            <h3 className="text-lg font-semibold">Top Countries</h3>
                                        </CardHeader>
                                        <CardBody>
                                            {geographicDistribution && geographicDistribution.length > 0 ? (
                                                <div className="space-y-2">
                                                    {geographicDistribution.slice(0, 5).map((item, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2">
                                                            <span className="text-sm">{item.country}</span>
                                                            <Chip size="sm" variant="flat">
                                                                {item.count}
                                                            </Chip>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-center text-default-400 py-4">No geographic data available</p>
                                            )}
                                        </CardBody>
                                    </Card>

                                    {/* Average Onboarding Time */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider flex items-center gap-2">
                                            <ClockIcon className="w-5 h-5 text-default-500" />
                                            <h3 className="text-lg font-semibold">Onboarding Time</h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <p className="text-4xl font-bold text-primary">
                                                    {averageOnboardingTime?.hours || 0}
                                                </p>
                                                <p className="text-sm text-default-500 mt-1">hours average</p>
                                                <p className="text-xs text-default-400 mt-2">
                                                    (~{averageOnboardingTime?.days || 0} days)
                                                </p>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>

                                {/* Registration Trend */}
                                {registrationTrend && registrationTrend.length > 0 && (
                                    <Card className="border border-divider mt-6">
                                        <CardHeader className="border-b border-divider flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">Registration Trend</h3>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                            >
                                                Export
                                            </Button>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="h-48 flex items-end gap-1">
                                                {registrationTrend.map((item, index) => {
                                                    const maxCount = Math.max(...registrationTrend.map(t => t.count));
                                                    const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-pointer group relative"
                                                            style={{ height: `${Math.max(height, 5)}%` }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-default-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                {item.date}: {item.count}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

Analytics.layout = (page) => <App children={page} />;

export default Analytics;

