import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { RocketLaunchIcon, UserGroupIcon, ClockIcon, ChartBarIcon, ServerStackIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import App from "@/Layouts/App.jsx";
import DynamicWidgetRenderer from '@/Components/DynamicWidgets/DynamicWidgetRenderer';
import StatsCards from "@/Components/UI/StatsCards";

/**
 * Platform Onboarding Dashboard - Dynamic Widget Architecture
 * 
 * This dashboard displays only dynamically registered widgets.
 * All onboarding widgets (stats, registrations, trials, provisioning queue) 
 * should be registered via the Platform package's widget system.
 * 
 * Widget positions: welcome, stats_row, main_left, main_right, sidebar, full_width
 */
const Dashboard = ({
    title = 'Platform Onboarding Dashboard',
    dynamicWidgets = [],
    stats = {},
    registrations = [],
    trials = [],
    provisioningQueue = [],
}) => {
    // Group widgets by position for layout
    const widgetsByPosition = useMemo(() => {
        const positions = {
            welcome: [],
            stats_row: [],
            main_left: [],
            main_right: [],
            sidebar: [],
            full_width: [],
        };

        dynamicWidgets.forEach(widget => {
            const position = widget.position || 'full_width';
            if (positions[position]) {
                positions[position].push(widget);
            } else {
                positions.full_width.push(widget);
            }
        });

        // Sort widgets by order within each position
        Object.keys(positions).forEach(key => {
            positions[key].sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        return positions;
    }, [dynamicWidgets]);

    const hasAnyWidgets = dynamicWidgets.length > 0;
    const hasLegacyData = Object.keys(stats || {}).length > 0
        || (registrations?.length ?? 0) > 0
        || (trials?.length ?? 0) > 0
        || (provisioningQueue?.length ?? 0) > 0;

    const fallbackStats = useMemo(() => [
        {
            title: "Pending Registrations",
            value: stats?.pendingRegistrations || 0,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
        },
        {
            title: "Active Trials",
            value: stats?.activeTrials || 0,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
        },
        {
            title: "Conversion Rate",
            value: `${stats?.conversionRate || 0}%`,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20",
        },
        {
            title: "Provisioning Queue",
            value: stats?.provisioningQueue || 0,
            icon: <ServerStackIcon className="w-6 h-6" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
        },
    ], [stats]);

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Platform Onboarding Dashboard">
                {/* Welcome Section */}
                {widgetsByPosition.welcome.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6"
                    >
                        <DynamicWidgetRenderer widgets={widgetsByPosition.welcome} />
                    </motion.div>
                )}

                {/* Stats Row */}
                {widgetsByPosition.stats_row.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-6"
                    >
                        <DynamicWidgetRenderer widgets={widgetsByPosition.stats_row} />
                    </motion.div>
                )}

                {/* Main Content Area */}
                {(widgetsByPosition.main_left.length > 0 || widgetsByPosition.main_right.length > 0 || widgetsByPosition.sidebar.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
                    >
                        {/* Main Left - 2 columns */}
                        {widgetsByPosition.main_left.length > 0 && (
                            <div className="lg:col-span-2 space-y-6">
                                <DynamicWidgetRenderer widgets={widgetsByPosition.main_left} />
                            </div>
                        )}

                        {/* Main Right / Sidebar - 1 column */}
                        {(widgetsByPosition.main_right.length > 0 || widgetsByPosition.sidebar.length > 0) && (
                            <div className="space-y-6">
                                <DynamicWidgetRenderer widgets={widgetsByPosition.main_right} />
                                <DynamicWidgetRenderer widgets={widgetsByPosition.sidebar} />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Full Width Section */}
                {widgetsByPosition.full_width.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-6"
                    >
                        <DynamicWidgetRenderer widgets={widgetsByPosition.full_width} />
                    </motion.div>
                )}

                {/* Legacy Fallback (Controller-provided props) */}
                {!hasAnyWidgets && hasLegacyData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        <Card className="transition-all duration-200">
                            <CardHeader className="border-b border-divider">
                                <div>
                                    <h3 className="text-lg font-semibold">Onboarding Overview</h3>
                                    <p className="text-sm text-default-500">Fallback view while dynamic onboarding widgets are being wired.</p>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <StatsCards stats={fallbackStats} />

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold">Recent Registrations</p>
                                        {(registrations || []).slice(0, 5).map((item) => (
                                            <div key={item.id} className="p-3 rounded-lg border border-divider">
                                                <p className="font-medium text-sm">{item.companyName || item.name}</p>
                                                <p className="text-xs text-default-500">{item.email}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold">Trials</p>
                                        {(trials || []).slice(0, 5).map((item) => (
                                            <div key={item.id} className="p-3 rounded-lg border border-divider flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{item.companyName || item.name}</p>
                                                    <p className="text-xs text-default-500">{item.plan || item.plan?.name || 'No Plan'}</p>
                                                </div>
                                                <Chip size="sm" variant="flat" color={item.daysRemaining <= 3 ? 'danger' : item.daysRemaining <= 7 ? 'warning' : 'success'}>
                                                    {item.daysRemaining ?? '--'}d
                                                </Chip>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold">Provisioning Queue</p>
                                        {(provisioningQueue || []).slice(0, 5).map((item) => (
                                            <div key={item.id} className="p-3 rounded-lg border border-divider flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{item.tenantName || item.name}</p>
                                                    <p className="text-xs text-default-500">{item.database || item.subdomain}</p>
                                                </div>
                                                <Chip size="sm" variant="flat" color={item.status === 'failed' ? 'danger' : 'primary'}>
                                                    {item.status || 'queued'}
                                                </Chip>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}

                {/* Empty State */}
                {!hasAnyWidgets && !hasLegacyData && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <div 
                            className="p-4 rounded-2xl mb-4"
                            style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}
                        >
                            <RocketLaunchIcon className="w-12 h-12" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No Onboarding Widgets Available
                        </h3>
                        <p className="text-default-500 max-w-md">
                            Onboarding widgets will appear here once they are registered by the Platform package.
                            Configure your dashboard widgets to display registrations, trials, and provisioning status.
                        </p>
                    </motion.div>
                )}
            </div>
        </>
    );
};

// Use App layout wrapper
Dashboard.layout = (page) => <App children={page} />;

export default Dashboard;

