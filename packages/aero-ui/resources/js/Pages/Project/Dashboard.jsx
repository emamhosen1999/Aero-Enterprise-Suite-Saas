import React, { useMemo, useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Card, CardBody } from "@heroui/react";
import App from "@/Layouts/App.jsx";
import DynamicWidgetRenderer from "@/Components/DynamicWidgets/DynamicWidgetRenderer.jsx";
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

/**
 * Project Dashboard - For Project Management
 * 
 * DASHBOARD PATTERN:
 * - NO container Card wrapper - only dynamic widgets are shown
 * - All widgets come from packages via dynamicWidgets prop
 * - Widgets are grouped by position and rendered dynamically
 * - No hardcoded stats or content - everything is widget-based
 */
const ProjectsDashboard = ({ title, dynamicWidgets = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
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

    // Check for widgets in different positions
    const hasWelcomeWidgets = widgetsByPosition.welcome.length > 0;
    const hasStatsWidgets = widgetsByPosition.stats_row.length > 0;
    const hasMainContent = widgetsByPosition.main_left.length > 0;
    const hasFullWidth = widgetsByPosition.full_width.length > 0;
    
    // Sidebar widgets (combine sidebar + main_right positions)
    const sidebarWidgets = [...widgetsByPosition.sidebar, ...widgetsByPosition.main_right]
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    const hasSidebar = sidebarWidgets.length > 0;
    
    // Check if there are any widgets at all
    const hasAnyWidgets = dynamicWidgets && dynamicWidgets.length > 0;

    return (
        <>
            <Head title={title || 'Projects Dashboard'} />

            {/* Dashboard content - NO container Card, only dynamic widgets */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Projects Dashboard">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    {/* Welcome Section Widgets */}
                    {hasWelcomeWidgets && (
                        <div className="space-y-4">
                            {widgetsByPosition.welcome.map((widget) => (
                                <DynamicWidgetRenderer 
                                    key={widget.key} 
                                    widgets={[widget]} 
                                />
                            ))}
                        </div>
                    )}

                    {/* Stats Row Widgets */}
                    {hasStatsWidgets && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {widgetsByPosition.stats_row.map((widget) => (
                                <DynamicWidgetRenderer 
                                    key={widget.key} 
                                    widgets={[widget]} 
                                />
                            ))}
                        </div>
                    )}

                    {/* Main Content Grid - Left: main widgets, Right: sidebar widgets */}
                    {(hasMainContent || hasSidebar) && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT COLUMN - Main Content (2/3 width) */}
                            <div className="lg:col-span-2 space-y-4">
                                {widgetsByPosition.main_left.map((widget) => (
                                    <DynamicWidgetRenderer 
                                        key={widget.key} 
                                        widgets={[widget]} 
                                    />
                                ))}
                            </div>

                            {/* RIGHT COLUMN - Sidebar (1/3 width) */}
                            {hasSidebar && (
                                <div className="space-y-4">
                                    {sidebarWidgets.map((widget) => (
                                        <DynamicWidgetRenderer 
                                            key={widget.key} 
                                            widgets={[widget]} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Full Width Widgets */}
                    {hasFullWidth && (
                        <div className="space-y-4">
                            {widgetsByPosition.full_width.map((widget) => (
                                <DynamicWidgetRenderer 
                                    key={widget.key} 
                                    widgets={[widget]} 
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty state - only show if NO widgets at all */}
                    {!hasAnyWidgets && (
                        <Card className="border border-divider border-dashed bg-default-50/50">
                            <CardBody className="p-12 text-center">
                                <SparklesIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-default-600 mb-2">
                                    Projects Dashboard
                                </h3>
                                <p className="text-sm text-default-500 max-w-md mx-auto">
                                    Project widgets will appear here based on your permissions and enabled modules.
                                    Configure project modules to see project, task, and team performance widgets.
                                </p>
                            </CardBody>
                        </Card>
                    )}
                </motion.div>
            </div>
        </>
    );
};

// Use App layout wrapper
ProjectsDashboard.layout = (page) => <App>{page}</App>;

export default ProjectsDashboard;
