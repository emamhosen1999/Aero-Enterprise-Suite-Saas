import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    UsersIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    BellIcon,
    CubeIcon,
    ArrowRightIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Button, 
    Skeleton,
    Chip,
} from '@heroui/react';
import App from "@/Layouts/App.jsx";
import DynamicWidgetRenderer from "@/Components/DynamicWidgets/DynamicWidgetRenderer.jsx";

/**
 * ============================================================================
 * CORE DASHBOARD - WIREFRAME DESIGN v2.0
 * ============================================================================
 * 
 * LAYOUT STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ WELCOME HEADER (Full Width)                                              │
 * │ "Good morning, John!" + Date/Time                                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ STATS ROW (4 columns - responsive)                                       │
 * │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
 * │ │ Users   │ │ Active  │ │ Inactive│ │ Roles   │                          │
 * │ │  125    │ │  98     │ │   27    │ │   8     │                          │
 * │ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌───────────────────────────────────────┐ ┌───────────────────────────────┐
 * │ MAIN CONTENT (2/3 width)              │ │ SIDEBAR (1/3 width)           │
 * │                                        │ │                               │
 * │ ┌────────────────────────────────────┐ │ │ ┌───────────────────────────┐ │
 * │ │ ACTION WIDGETS                     │ │ │ │ NOTIFICATIONS (Core)      │ │
 * │ │ • Punch Status (HRM)               │ │ │ │ • 3 unread                │ │
 * │ │ • My RFI Status (RFI)              │ │ │ └───────────────────────────┘ │
 * │ └────────────────────────────────────┘ │ │                               │
 * │                                        │ │ ┌───────────────────────────┐ │
 * │ ┌────────────────────────────────────┐ │ │ │ PENDING APPROVALS (HRM)   │ │
 * │ │ SUMMARY WIDGETS                    │ │ │ │ • 5 leave requests        │ │
 * │ │ • Leave Balance (HRM)              │ │ │ └───────────────────────────┘ │
 * │ └────────────────────────────────────┘ │ │                               │
 * │                                        │ │ ┌───────────────────────────┐ │
 * │ ┌────────────────────────────────────┐ │ │ │ OVERDUE RFIs (RFI)        │ │
 * │ │ QUICK ACTIONS                      │ │ │ │ • 2 overdue               │ │
 * │ │ [Users] [Roles] [Settings]         │ │ │ └───────────────────────────┘ │
 * │ └────────────────────────────────────┘ │ │                               │
 * │                                        │ │ ┌───────────────────────────┐ │
 * └───────────────────────────────────────┘ │ │ ACTIVE MODULES (Core)      │ │
 *                                            │ │ [HRM] [RFI] [Finance]      │ │
 *                                            │ └───────────────────────────┘ │
 *                                            └───────────────────────────────┘
 * 
 * WIDGET POSITIONS:
 * - welcome: Full width header area
 * - stats_row: Statistics row (auto-grid)
 * - main_left: Main content left column (ACTION + SUMMARY widgets)
 * - sidebar / main_right: Right column (ALERT + DISPLAY widgets)
 * - full_width: Full width below main grid
 * 
 * WIDGET CATEGORIES:
 * - ACTION: Requires user action (punch in, submit, approve)
 * - ALERT: Needs attention (pending approvals, overdue items)
 * - SUMMARY: Informational summary (leave balance, stats)
 * - DISPLAY: Static information (active modules, welcome)
 * 
 * ============================================================================
 */

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4, staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

/**
 * Stats Card Component - Individual stat display
 */
const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <Card className="border border-divider hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <CardBody className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-default-500 uppercase tracking-wide truncate">
                        {title}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums">{value}</p>
                    {description && (
                        <p className="text-[10px] sm:text-xs text-default-400 mt-0.5 sm:mt-1 truncate">{description}</p>
                    )}
                </div>
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </div>
        </CardBody>
    </Card>
);

/**
 * Quick Action Button Component
 */
const QuickActionButton = ({ title, icon: Icon, href, color = 'default' }) => {
    const getRoute = (routeName) => {
        try {
            return route(routeName);
        } catch {
            return '#';
        }
    };

    return (
        <Button 
            variant="flat" 
            color={color}
            className="h-auto py-3 px-4 justify-start flex-1 min-w-[140px]" 
            startContent={<Icon className="w-4 h-4" />} 
            endContent={<ArrowRightIcon className="w-3 h-3 ml-auto opacity-50" />} 
            onPress={() => router.visit(getRoute(href))}
        >
            {title}
        </Button>
    );
};

/**
 * Welcome Header Component
 */
const WelcomeHeader = ({ auth, currentTime }) => {
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return 'Good morning';
        if (hour >= 12 && hour < 17) return 'Good afternoon';
        if (hour >= 17 && hour < 21) return 'Good evening';
        return 'Hello';
    };

    return (
        <Card className="bg-gradient-to-br from-primary-50 via-primary-50/50 to-secondary-50 dark:from-primary-900/30 dark:via-primary-900/20 dark:to-secondary-900/20 border-none shadow-sm">
            <CardBody className="p-4 sm:p-6 relative overflow-hidden">
                {/* Decorative background elements - hidden on mobile */}
                <div className="hidden sm:block absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="hidden sm:block absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-default-100 shadow-sm border border-white/50 shrink-0">
                            <SparklesIcon className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                                {getGreeting()}, {auth?.user?.name?.split(' ')[0] || 'User'}!
                            </h1>
                            <p className="text-sm sm:text-base text-default-500 mt-0.5 sm:mt-1 truncate">
                                {currentTime.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end shrink-0">
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-default-600 tabular-nums">
                            {currentTime.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                            })}
                        </p>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

/**
 * Widget Section Skeleton - Loading state for widget sections
 */
const WidgetSkeleton = () => (
    <Card className="border border-divider">
        <CardHeader className="border-b border-divider p-4">
            <Skeleton className="h-5 w-32 rounded" />
        </CardHeader>
        <CardBody className="p-4 space-y-3">
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
        </CardBody>
    </Card>
);

/**
 * Empty State for sidebar when no widgets
 */
const EmptySidebarState = () => (
    <Card className="border border-divider border-dashed bg-default-50/50">
        <CardBody className="p-6 text-center">
            <div className="p-3 rounded-full bg-default-100 w-fit mx-auto mb-3">
                <BellIcon className="w-8 h-8 text-default-300" />
            </div>
            <p className="text-sm font-medium text-default-500">All caught up!</p>
            <p className="text-xs text-default-400 mt-1">
                No pending items or notifications
            </p>
        </CardBody>
    </Card>
);

/**
 * Main Dashboard Component
 */
const CoreDashboard = ({ auth, stats = {}, dynamicWidgets = [] }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Group widgets by position for manual layout control
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

    // Check if we have widgets in specific positions
    const hasMainContent = widgetsByPosition.main_left.length > 0;
    const sidebarWidgets = [...widgetsByPosition.sidebar, ...widgetsByPosition.main_right]
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    const hasSidebar = sidebarWidgets.length > 0;

    // Stats cards configuration
    const statsCards = [
        { 
            title: 'Total Users', 
            value: stats?.totalUsers ?? 0, 
            icon: UsersIcon, 
            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            description: 'Registered accounts'
        },
        { 
            title: 'Active', 
            value: stats?.activeUsers ?? 0, 
            icon: CheckCircleIcon, 
            color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            description: 'Currently active'
        },
        { 
            title: 'Inactive', 
            value: stats?.inactiveUsers ?? 0, 
            icon: XCircleIcon, 
            color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            description: 'Disabled accounts'
        },
        { 
            title: 'Roles', 
            value: stats?.totalRoles ?? 0, 
            icon: ShieldCheckIcon, 
            color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            description: 'Access levels'
        },
    ];

    // Quick actions
    const quickActions = [
        { title: 'Manage Users', href: 'core.users.index', icon: UsersIcon, color: 'primary' },
        { title: 'Manage Roles', href: 'core.roles.index', icon: ShieldCheckIcon, color: 'secondary' },
    ];

    return (
        <>
            <Head title="Dashboard" />
            
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto"
            >
                {/* ============================================================
                    SECTION 1: WELCOME HEADER (Full Width)
                    ============================================================ */}
                <motion.div variants={itemVariants}>
                    <WelcomeHeader auth={auth} currentTime={currentTime} />
                </motion.div>

                {/* ============================================================
                    SECTION 2: STATS ROW (4 columns, responsive)
                    ============================================================ */}
                <motion.div variants={itemVariants}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsCards.map((stat, idx) => (
                            <StatCard key={idx} {...stat} />
                        ))}
                    </div>
                </motion.div>

                {/* ============================================================
                    SECTION 3: MAIN CONTENT GRID
                    Left: Action widgets, Summary widgets, Quick Actions
                    Right: Alerts, Notifications, Modules
                    ============================================================ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN - Main Content (2/3 width on desktop) */}
                    <div className="lg:col-span-2 space-y-4">
                        
                        {/* Dynamic Widgets - main_left position (ACTION + SUMMARY) */}
                        {hasMainContent && (
                            <motion.div variants={itemVariants} className="space-y-4">
                                {widgetsByPosition.main_left.map((widget) => (
                                    <DynamicWidgetRenderer 
                                        key={widget.key} 
                                        widgets={[widget]} 
                                    />
                                ))}
                            </motion.div>
                        )}

                        {/* Quick Actions Card - Always visible */}
                        <motion.div variants={itemVariants}>
                            <Card className="border border-divider">
                                <CardHeader className="border-b border-divider px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <CubeIcon className="w-5 h-5 text-primary" />
                                        <h2 className="text-base font-semibold">Quick Actions</h2>
                                    </div>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="flex flex-wrap gap-3">
                                        {quickActions.map((action, idx) => (
                                            <QuickActionButton key={idx} {...action} />
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>

                        {/* Full Width Widgets */}
                        {widgetsByPosition.full_width.length > 0 && (
                            <motion.div variants={itemVariants} className="space-y-4">
                                {widgetsByPosition.full_width.map((widget) => (
                                    <DynamicWidgetRenderer 
                                        key={widget.key} 
                                        widgets={[widget]} 
                                    />
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* RIGHT COLUMN - Sidebar (1/3 width on desktop) */}
                    <div className="space-y-4">
                        
                        {/* Dynamic Widgets - sidebar + main_right positions (ALERT + DISPLAY) */}
                        {hasSidebar ? (
                            <motion.div variants={itemVariants} className="space-y-4">
                                {sidebarWidgets.map((widget) => (
                                    <DynamicWidgetRenderer 
                                        key={widget.key} 
                                        widgets={[widget]} 
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div variants={itemVariants}>
                                <EmptySidebarState />
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ============================================================
                    SECTION 4: NEW THIS MONTH HIGHLIGHT (Conditional)
                    Only show if there are new users this month
                    ============================================================ */}
                {(stats?.usersThisMonth ?? 0) > 0 && (
                    <motion.div variants={itemVariants}>
                        <Card className="border border-divider bg-gradient-to-r from-cyan-50/50 to-transparent dark:from-cyan-900/10 dark:to-transparent">
                            <CardBody className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
                                        <ClockIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">
                                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                                                {stats.usersThisMonth}
                                            </span>
                                            {' '}new user{stats.usersThisMonth !== 1 ? 's' : ''} joined this month
                                        </p>
                                        <p className="text-xs text-default-400 mt-0.5">
                                            Your team is growing!
                                        </p>
                                    </div>
                                    <Chip size="sm" color="primary" variant="flat">
                                        +{stats.usersThisMonth}
                                    </Chip>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}
            </motion.div>
        </>
    );
};

CoreDashboard.layout = (page) => <App>{page}</App>;

export default CoreDashboard;
