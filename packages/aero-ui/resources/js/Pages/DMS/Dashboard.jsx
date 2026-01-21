import React, { useMemo, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import DynamicWidgetRenderer from '@/Components/DynamicWidgets/DynamicWidgetRenderer';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

/**
 * DMS Dashboard - Dynamic Widgets Only
 * 
 * This dashboard renders ONLY dynamic widgets registered by packages.
 * NO hardcoded widgets or container Card wrappers.
 * All DMS-specific widgets (documents, storage, shared files) should be
 * registered via the widget system in the aero-dms package.
 */
const DMSDashboard = ({ title = 'Document Management', dynamicWidgets = [] }) => {
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
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Document Management Dashboard">
                <div className="space-y-4">
                    {/* Welcome Section Widgets */}
                    {widgetsByPosition.welcome.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {widgetsByPosition.welcome.map((widget) => (
                                <DynamicWidgetRenderer key={widget.key} widgets={[widget]} />
                            ))}
                        </motion.div>
                    )}

                    {/* Stats Row Widgets */}
                    {widgetsByPosition.stats_row.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            {widgetsByPosition.stats_row.map((widget) => (
                                <DynamicWidgetRenderer key={widget.key} widgets={[widget]} />
                            ))}
                        </motion.div>
                    )}

                    {/* Main Content Grid */}
                    {(widgetsByPosition.main_left.length > 0 || 
                      widgetsByPosition.main_right.length > 0 || 
                      widgetsByPosition.sidebar.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                        >
                            {/* Left Column */}
                            <div className="lg:col-span-2 space-y-4">
                                {widgetsByPosition.main_left.map((widget) => (
                                    <DynamicWidgetRenderer key={widget.key} widgets={[widget]} />
                                ))}
                            </div>

                            {/* Right Column / Sidebar */}
                            <div className="space-y-4">
                                {widgetsByPosition.main_right.map((widget) => (
                                    <DynamicWidgetRenderer key={widget.key} widgets={[widget]} />
                                ))}
                                {widgetsByPosition.sidebar.map((widget) => (
                                    <DynamicWidgetRenderer key={widget.key} widgets={[widget]} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Full Width Widgets */}
                    {widgetsByPosition.full_width.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="space-y-4"
                        >
                            {widgetsByPosition.full_width.map((widget) => (
                                <DynamicWidgetRenderer key={widget.key} widgets={[widget]} />
                            ))}
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {!hasAnyWidgets && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center min-h-[400px] text-center"
                        >
                            <div className="p-4 rounded-full bg-primary/10 mb-4">
                                <DocumentDuplicateIcon className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Document Management Dashboard
                            </h3>
                            <p className="text-default-500 max-w-md">
                                Document management widgets will appear here once configured.
                                Contact your administrator to set up document, storage, and sharing widgets.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
};

DMSDashboard.layout = (page) => <App>{page}</App>;
export default DMSDashboard;
