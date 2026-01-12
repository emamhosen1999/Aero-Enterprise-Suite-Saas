import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChartBarSquareIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import DynamicWidgetRenderer from '@/Components/DynamicWidgets/DynamicWidgetRenderer';

/**
 * Quota Management Dashboard - Dynamic Widget Architecture
 * 
 * This dashboard displays only dynamically registered widgets.
 * All quota widgets (stats, tenant quotas, warnings, usage) 
 * should be registered via the Platform package's widget system.
 * 
 * Widget positions: welcome, stats_row, main_left, main_right, sidebar, full_width
 */
const QuotaDashboard = ({ title = 'Quota Management', dynamicWidgets = [] }) => {
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

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Quota Management Dashboard">
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

                {/* Empty State */}
                {!hasAnyWidgets && (
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
                            <ChartBarSquareIcon className="w-12 h-12" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No Quota Widgets Available
                        </h3>
                        <p className="text-default-500 max-w-md">
                            Quota widgets will appear here once they are registered by the Platform package.
                            Configure your dashboard widgets to display tenant quotas, usage tracking, and alerts.
                        </p>
                    </motion.div>
                )}
            </div>
        </>
    );
};

QuotaDashboard.layout = (page) => <App>{page}</App>;

export default QuotaDashboard;
