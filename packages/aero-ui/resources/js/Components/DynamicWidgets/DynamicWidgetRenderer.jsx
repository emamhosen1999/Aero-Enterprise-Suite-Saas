import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { WIDGET_REGISTRY, getWidgetComponent } from '@/Widgets';

/**
 * Widget Registry - Maps component paths to actual React components
 * This is populated by the central Widgets/index.js registry
 */
const widgetComponentCache = {};

/**
 * Register a widget component for a given path (for external registration)
 * @param {string} componentPath - The component path (e.g., 'HRM/Widgets/PunchStatusWidget')
 * @param {React.Component} component - The React component
 */
export const registerWidget = (componentPath, component) => {
    widgetComponentCache[componentPath] = component;
};

/**
 * Dynamic widget loader - uses central registry with fallback to dynamic import
 * Uses the registry first, then tries dynamic import
 */
const loadWidget = (componentPath) => {
    // Check cache first
    if (widgetComponentCache[componentPath]) {
        return widgetComponentCache[componentPath];
    }

    // Check central registry
    if (WIDGET_REGISTRY[componentPath]) {
        return lazy(() => WIDGET_REGISTRY[componentPath]());
    }

    // Fallback: Try dynamic import patterns
    return lazy(() => {
        const paths = [
            () => import(`@/${componentPath}`),
            () => import(`@/Widgets/${componentPath}`),
        ];

        return paths.reduce(
            (promise, importFn) => promise.catch(() => importFn()),
            Promise.reject(new Error('Widget not found'))
        ).catch(() => {
            // Return a placeholder component if widget not found
            return {
                default: () => (
                    <div className="p-4 text-center text-default-500">
                        <ExclamationTriangleIcon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm">Widget not available</p>
                        <p className="text-xs text-default-400">{componentPath}</p>
                    </div>
                )
            };
        });
    });
};

/**
 * Widget Skeleton - Loading placeholder for lazy-loaded widgets
 */
const WidgetSkeleton = ({ title, span = 1 }) => (
    <Card className={`col-span-${span}`}>
        <CardHeader className="border-b border-divider p-4">
            <Skeleton className="h-5 w-32 rounded" />
        </CardHeader>
        <CardBody className="p-4">
            <div className="space-y-3">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
            </div>
        </CardBody>
    </Card>
);

/**
 * Widget Error Boundary
 */
class WidgetErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Widget error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Card className="border-danger/50">
                    <CardBody className="p-4 text-center">
                        <ExclamationTriangleIcon className="w-6 h-6 mx-auto text-danger mb-2" />
                        <p className="text-sm text-danger">Widget failed to load</p>
                    </CardBody>
                </Card>
            );
        }
        return this.props.children;
    }
}

/**
 * Single Widget Renderer
 */
const SingleWidgetRenderer = ({ widget }) => {
    const WidgetComponent = loadWidget(widget.component);

    return (
        <WidgetErrorBoundary>
            <Suspense fallback={<WidgetSkeleton title={widget.title} span={widget.span} />}>
                <WidgetComponent data={widget.data} meta={widget} />
            </Suspense>
        </WidgetErrorBoundary>
    );
};

/**
 * DynamicWidgetRenderer - Renders all dynamic widgets from the registry
 * 
 * Widgets are grouped by position:
 * - main_left: Left column widgets (action cards, punch status)
 * - main_right: Right column widgets
 * - stats_row: Stats row (quick summary cards)
 * - sidebar: Sidebar widgets (alerts, notifications)
 * - full_width: Full width widgets (feeds, activity)
 * 
 * @param {Array} widgets - Array of widget configurations from backend
 */
const DynamicWidgetRenderer = ({ widgets = [], position = null }) => {
    // Filter widgets by position if specified
    const filteredWidgets = position
        ? widgets.filter(w => w.position === position)
        : widgets;

    // Sort by order
    const sortedWidgets = [...filteredWidgets].sort((a, b) => a.order - b.order);

    if (sortedWidgets.length === 0) {
        return null;
    }

    return (
        <div className="dynamic-widgets">
            {sortedWidgets.map((widget) => (
                <SingleWidgetRenderer key={widget.key} widget={widget} />
            ))}
        </div>
    );
};

/**
 * Widget Grid - Renders widgets in a responsive grid layout
 */
export const WidgetGrid = ({ widgets = [], columns = 3 }) => {
    // Group widgets by position
    const groupedWidgets = widgets.reduce((acc, widget) => {
        const pos = widget.position || 'main_left';
        if (!acc[pos]) acc[pos] = [];
        acc[pos].push(widget);
        return acc;
    }, {});

    // Sort each group by order
    Object.keys(groupedWidgets).forEach(pos => {
        groupedWidgets[pos].sort((a, b) => a.order - b.order);
    });

    return (
        <div className="widget-grid space-y-4">
            {/* Stats Row */}
            {groupedWidgets.stats_row?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {groupedWidgets.stats_row.map(widget => (
                        <SingleWidgetRenderer key={widget.key} widget={widget} />
                    ))}
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Left Column */}
                <div className="lg:col-span-2 space-y-4">
                    {groupedWidgets.main_left?.map(widget => (
                        <SingleWidgetRenderer key={widget.key} widget={widget} />
                    ))}
                    {groupedWidgets.full_width?.map(widget => (
                        <SingleWidgetRenderer key={widget.key} widget={widget} />
                    ))}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-4">
                    {groupedWidgets.sidebar?.map(widget => (
                        <SingleWidgetRenderer key={widget.key} widget={widget} />
                    ))}
                    {groupedWidgets.main_right?.map(widget => (
                        <SingleWidgetRenderer key={widget.key} widget={widget} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DynamicWidgetRenderer;
