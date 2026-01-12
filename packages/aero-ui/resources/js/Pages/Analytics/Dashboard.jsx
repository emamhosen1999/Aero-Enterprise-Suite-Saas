import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChartBarIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import DynamicWidgetRenderer from '@/Components/DynamicWidgets/DynamicWidgetRenderer';

/**
 * Analytics Dashboard - Dynamic Widgets Only
 * 
 * This dashboard renders only dynamically registered widgets from packages.
 * No hardcoded widgets - all content comes from the widget system.
 */
const AnalyticsDashboard = ({ title = 'Analytics Dashboard', dynamicWidgets = [] }) => {
    // Group widgets by position
    const widgetsByPosition = useMemo(() => {
        const positions = {
            welcome: [],
            stats_row: [],
            main_left: [],
            main_right: [],
            sidebar: [],
            full_width: []
        };

        dynamicWidgets.forEach(widget => {
            const position = widget.position || 'full_width';
            if (positions[position]) {
                positions[position].push(widget);
            } else {
                positions.full_width.push(widget);
            }
        });

        // Sort widgets within each position by order
        Object.keys(positions).forEach(key => {
            positions[key].sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        return positions;
    }, [dynamicWidgets]);

    const hasAnyWidgets = dynamicWidgets.length > 0;

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Analytics Dashboard">
                <div className="space-y-6">
                    {/* Welcome Section */}
                    {widgetsByPosition.welcome.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DynamicWidgetRenderer widgets={widgetsByPosition.welcome} />
                        </motion.div>
                    )}

                    {/* Stats Row */}
                    {widgetsByPosition.stats_row.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <DynamicWidgetRenderer widgets={widgetsByPosition.stats_row} />
                        </motion.div>
                    )}

                    {/* Main Content Area */}
                    {(widgetsByPosition.main_left.length > 0 || widgetsByPosition.main_right.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            {widgetsByPosition.main_left.length > 0 && (
                                <div className="space-y-6">
                                    <DynamicWidgetRenderer widgets={widgetsByPosition.main_left} />
                                </div>
                            )}
                            {widgetsByPosition.main_right.length > 0 && (
                                <div className="space-y-6">
                                    <DynamicWidgetRenderer widgets={widgetsByPosition.main_right} />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Sidebar widgets in full width on dashboard */}
                    {widgetsByPosition.sidebar.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <DynamicWidgetRenderer widgets={widgetsByPosition.sidebar} />
                        </motion.div>
                    )}

                    {/* Full Width Widgets */}
                    {widgetsByPosition.full_width.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
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
                            className="flex flex-col items-center justify-center py-16"
                        >
                            <div className="p-4 rounded-full bg-primary/10 mb-4">
                                <ChartBarIcon className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Analytics Dashboard
                            </h3>
                            <p className="text-default-500 text-center max-w-md">
                                No widgets are currently configured for this dashboard.
                                Widgets will appear here once they are registered by the analytics module.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
};

AnalyticsDashboard.layout = (page) => <App>{page}</App>;
export default AnalyticsDashboard;
