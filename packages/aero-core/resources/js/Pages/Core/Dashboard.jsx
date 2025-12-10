import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Button,
    Skeleton
} from '@heroui/react';
import {
    UsersIcon,
    ShieldCheckIcon,
    CogIcon,
    HomeIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import axios from 'axios';

/**
 * Core Dashboard - Standalone Dashboard for aero-core
 * 
 * This dashboard provides an overview of the core system:
 * - User statistics
 * - Role statistics  
 * - Quick actions
 * - System status
 * 
 * Module-specific dashboards (HRM, CRM, etc.) should be 
 * in their respective module packages.
 */
const CoreDashboard = ({ auth, stats: initialStats }) => {
    const { props } = usePage();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(initialStats || {});
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [isMediumScreen, setIsMediumScreen] = useState(false);
    const [themeRadius, setThemeRadius] = useState('lg');

    // Theme utility function
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'xl';
    };

    // Set theme radius on mount (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
            setIsLargeScreen(window.innerWidth >= 1025);
            setIsMediumScreen(window.innerWidth >= 641 && window.innerWidth <= 1024);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    // Fetch stats if not provided
    useEffect(() => {
        if (!initialStats) {
            fetchStats();
        }
    }, [initialStats]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('dashboard.stats'));
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    // Statistics cards
    const statsCards = useMemo(() => [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: <UsersIcon className="w-5 h-5" />,
            color: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
            description: 'All users'
        },
        {
            title: 'Active Users',
            value: stats?.activeUsers || 0,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-green-400',
            iconBg: 'bg-green-500/20',
            description: 'Currently active'
        },
        {
            title: 'Inactive Users',
            value: stats?.inactiveUsers || 0,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-red-400',
            iconBg: 'bg-red-500/20',
            description: 'Inactive accounts'
        },
        {
            title: 'Total Roles',
            value: stats?.totalRoles || 0,
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            color: 'text-purple-400',
            iconBg: 'bg-purple-500/20',
            description: 'Role diversity'
        },
        {
            title: 'New This Month',
            value: stats?.usersThisMonth || 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-cyan-400',
            iconBg: 'bg-cyan-500/20',
            description: 'Recent signups'
        }
    ], [stats]);

    const quickActions = [
        { title: 'Manage Users', href: route('users.index'), icon: UsersIcon },
        { title: 'Manage Roles', href: route('roles.index'), icon: ShieldCheckIcon },
        { title: 'Settings', href: route('settings.system.index'), icon: CogIcon },
    ];

    return (
        <>
            <Head title="Dashboard" />
            
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Dashboard"
            >
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
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
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                                        {loading ? (
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <Skeleton className="w-12 h-12 rounded-xl" />
                                                <div className="min-w-0 flex-1">
                                                    <Skeleton className="w-64 h-6 rounded mb-2" />
                                                    <Skeleton className="w-48 h-4 rounded" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div 
                                                    className={`
                                                        ${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'} 
                                                        rounded-xl flex items-center justify-center
                                                    `}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                        borderWidth: `var(--borderWidth, 2px)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <HomeIcon 
                                                        className={`
                                                            ${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                                                        `}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 
                                                        className={`
                                                            ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'}
                                                            font-bold text-foreground
                                                        `}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Welcome back, {auth?.user?.name || 'User'}!
                                                    </h4>
                                                    <p 
                                                        className={`
                                                            ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                                            text-default-500
                                                        `}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Here's an overview of your system
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Statistics Cards */}
                                    <StatsCards
                                        stats={statsCards}
                                        className="mb-6"
                                        isLoading={loading}
                                    />

                                    {/* Quick Actions */}
                                    <motion.div variants={itemVariants}>
                                        <Card
                                            style={{
                                                border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`,
                                                borderRadius: `var(--borderRadius, 12px)`,
                                                background: `color-mix(in srgb, var(--theme-content1) 50%, transparent)`,
                                            }}
                                        >
                                            <CardHeader
                                                style={{
                                                    borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
                                                }}
                                                className="p-4"
                                            >
                                                <h2 className="text-lg font-semibold">Quick Actions</h2>
                                            </CardHeader>
                                            <CardBody className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {quickActions.map((action, index) => (
                                                        <Button
                                                            key={index}
                                                            variant="flat"
                                                            className="h-auto py-4 justify-start"
                                                            startContent={<action.icon className="w-5 h-5" />}
                                                            endContent={<ArrowRightIcon className="w-4 h-4 ml-auto" />}
                                                            onPress={() => router.visit(action.href)}
                                                            radius={themeRadius}
                                                        >
                                                            {action.title}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </motion.div>

                                    {/* System Info */}
                                    <motion.div variants={itemVariants} className="mt-4">
                                        <Card
                                            style={{
                                                border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`,
                                                borderRadius: `var(--borderRadius, 12px)`,
                                                background: `color-mix(in srgb, var(--theme-content1) 50%, transparent)`,
                                            }}
                                        >
                                            <CardHeader
                                                style={{
                                                    borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
                                                }}
                                                className="p-4"
                                            >
                                                <h2 className="text-lg font-semibold">System Information</h2>
                                            </CardHeader>
                                            <CardBody className="p-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-default-500">Package</p>
                                                        <p className="font-medium">aero/core</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-default-500">Status</p>
                                                        <p className="font-medium text-success">Active</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-default-500">Environment</p>
                                                        <p className="font-medium">{props.app?.env || 'production'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-default-500">Version</p>
                                                        <p className="font-medium">1.0.0</p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

CoreDashboard.layout = (page) => <App>{page}</App>;
export default CoreDashboard;
