import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    UsersIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    HomeIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Button,
} from '@heroui/react';
import App from "@/Layouts/App.jsx";
import StatsCards from '@/Components/StatsCards.jsx';
import DynamicWidgetRenderer from "@/Components/DynamicWidgets/DynamicWidgetRenderer.jsx";

/**
 * Core Dashboard - Primary tenant landing page
 * 
 * FOLLOWS LEAVESADMIN.JSX REFERENCE PATTERN:
 * - Single themed Card wrapper
 * - CardHeader with icon + title + action buttons
 * - CardBody with StatsCards → Main Content → Widgets
 * - Theme-aware styling via CSS variables
 */
const CoreDashboard = ({ auth, stats = {}, dynamicWidgets = [] }) => {
    const { props } = usePage();

    // Theme radius helper (REQUIRED)
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    // Responsive breakpoints (REQUIRED)
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Current time state for welcome greeting
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return 'Good morning';
        if (hour >= 12 && hour < 17) return 'Good afternoon';
        if (hour >= 17 && hour < 21) return 'Good evening';
        return 'Hello';
    };

    // Group widgets by position
    const widgetsByPosition = useMemo(() => {
        const grouped = {
            welcome: [],
            stats_row: [],
            main_left: [],
            main_right: [],
            sidebar: [],
            full_width: [],
        };
        
        (dynamicWidgets || []).forEach(widget => {
            const pos = widget.position || 'main_left';
            if (grouped[pos]) {
                grouped[pos].push(widget);
            } else {
                grouped.main_left.push(widget);
            }
        });

        // Sort each group by order
        Object.keys(grouped).forEach(pos => {
            grouped[pos].sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        return grouped;
    }, [dynamicWidgets]);

    // Sidebar widgets (combine sidebar + main_right positions)
    const sidebarWidgets = [...widgetsByPosition.sidebar, ...widgetsByPosition.main_right]
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    const hasSidebar = sidebarWidgets.length > 0;
    const hasMainContent = widgetsByPosition.main_left.length > 0;

    // Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        {
            title: "Total Users",
            value: stats?.totalUsers ?? 0,
            icon: <UsersIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All registered users"
        },
        {
            title: "Active",
            value: stats?.activeUsers ?? 0,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Currently active"
        },
        {
            title: "Inactive",
            value: stats?.inactiveUsers ?? 0,
            icon: <XCircleIcon />,
            color: "text-danger",
            iconBg: "bg-danger/20",
            description: "Disabled accounts"
        },
        {
            title: "Roles",
            value: stats?.totalRoles ?? 0,
            icon: <ShieldCheckIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "System roles"
        },
    ], [stats]);

    // Permission checks (REQUIRED)
    const canManageUsers = auth?.permissions?.includes('users.view') || false;
    const canManageRoles = auth?.permissions?.includes('roles.view') || false;
    const canManageSettings = auth?.permissions?.includes('settings.view') || false;

    // Quick actions with permission checks
    const quickActions = useMemo(() => {
        const actions = [];
        
        if (canManageUsers) {
            actions.push({
                key: 'users',
                title: 'Manage Users',
                icon: UsersIcon,
                route: 'core.users.index',
                color: 'primary'
            });
        }
        
        if (canManageRoles) {
            actions.push({
                key: 'roles',
                title: 'Manage Roles',
                icon: ShieldCheckIcon,
                route: 'core.roles.index',
                color: 'secondary'
            });
        }
        
        return actions;
    }, [canManageUsers, canManageRoles]);

    return (
        <>
            <Head title="Dashboard" />

            {/* Main content wrapper (FOLLOWS LEAVESADMIN PATTERN) */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Dashboard">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling (FOLLOWS LEAVESADMIN PATTERN) */}
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
                                {/* Card Header with title + action buttons (FOLLOWS LEAVESADMIN PATTERN) */}
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
                                            {/* Title Section with icon + greeting */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div 
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <HomeIcon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} 
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        {getGreeting()}, {auth?.user?.name?.split(' ')[0] || 'User'}!
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        {currentTime.toLocaleDateString('en-US', { 
                                                            weekday: 'long', 
                                                            month: 'long', 
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {quickActions.map((action) => (
                                                    <Button 
                                                        key={action.key}
                                                        color={action.color}
                                                        variant="shadow"
                                                        startContent={<action.icon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route(action.route))}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        {action.title}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top - FOLLOWS LEAVESADMIN) */}
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* 2. Main Content Grid - Left: widgets, Right: sidebar */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        
                                        {/* LEFT COLUMN - Main Content (2/3 width) */}
                                        <div className="lg:col-span-2 space-y-4">
                                            {/* Dynamic Widgets - main_left position */}
                                            {hasMainContent && widgetsByPosition.main_left.map((widget) => (
                                                <DynamicWidgetRenderer 
                                                    key={widget.key} 
                                                    widgets={[widget]} 
                                                />
                                            ))}

                                            {/* Empty state if no main content */}
                                            {!hasMainContent && (
                                                <Card className="border border-divider border-dashed bg-default-50/50">
                                                    <CardBody className="p-6 text-center">
                                                        <SparklesIcon className="w-12 h-12 text-default-300 mx-auto mb-3" />
                                                        <p className="text-sm font-medium text-default-500">
                                                            Your dashboard is ready!
                                                        </p>
                                                        <p className="text-xs text-default-400 mt-1">
                                                            Widgets will appear here based on your permissions
                                                        </p>
                                                    </CardBody>
                                                </Card>
                                            )}

                                            {/* Full Width Widgets */}
                                            {widgetsByPosition.full_width.map((widget) => (
                                                <DynamicWidgetRenderer 
                                                    key={widget.key} 
                                                    widgets={[widget]} 
                                                />
                                            ))}
                                        </div>

                                        {/* RIGHT COLUMN - Sidebar (1/3 width) */}
                                        <div className="space-y-4">
                                            {hasSidebar ? (
                                                sidebarWidgets.map((widget) => (
                                                    <DynamicWidgetRenderer 
                                                        key={widget.key} 
                                                        widgets={[widget]} 
                                                    />
                                                ))
                                            ) : (
                                                <Card className="border border-divider border-dashed bg-default-50/50">
                                                    <CardBody className="p-6 text-center">
                                                        <SparklesIcon className="w-8 h-8 text-default-300 mx-auto mb-2" />
                                                        <p className="text-sm font-medium text-default-500">All caught up!</p>
                                                        <p className="text-xs text-default-400 mt-1">
                                                            No pending items or notifications
                                                        </p>
                                                    </CardBody>
                                                </Card>
                                            )}
                                        </div>
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

// REQUIRED: Use App layout wrapper
CoreDashboard.layout = (page) => <App>{page}</App>;

export default CoreDashboard;
