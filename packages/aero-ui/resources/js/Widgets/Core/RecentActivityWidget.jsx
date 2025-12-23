import React from 'react';
import { Card, CardHeader, CardBody, Button, Chip, Avatar } from '@heroui/react';
import { Link } from '@inertiajs/react';
import {
    ClockIcon,
    ArrowRightIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    PlusCircleIcon,
    PencilSquareIcon,
    TrashIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';

/**
 * RecentActivityWidget
 * 
 * Displays a timeline of recent system activities:
 * - User logins/logouts
 * - CRUD operations
 * - Settings changes
 */
const RecentActivityWidget = ({ data = {} }) => {
    const { 
        activities = [], 
        totalToday = 0,
        viewAllRoute = null,
    } = data;

    // Icon mapping
    const iconMap = {
        ArrowRightOnRectangleIcon: ArrowRightOnRectangleIcon,
        ArrowLeftOnRectangleIcon: ArrowLeftOnRectangleIcon,
        ExclamationTriangleIcon: ExclamationTriangleIcon,
        KeyIcon: KeyIcon,
        PlusCircleIcon: PlusCircleIcon,
        PencilSquareIcon: PencilSquareIcon,
        TrashIcon: TrashIcon,
        DocumentTextIcon: DocumentTextIcon,
        InformationCircleIcon: InformationCircleIcon,
    };

    // Color classes mapping
    const colorClasses = {
        success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
        danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
        warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
        primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
        default: 'bg-default-100 text-default-600 dark:bg-default-800 dark:text-default-400',
    };

    // Color dot classes
    const dotColorClasses = {
        success: 'bg-success',
        danger: 'bg-danger',
        warning: 'bg-warning',
        primary: 'bg-primary',
        default: 'bg-default-400',
    };

    const getRoute = (routeName) => {
        if (!routeName) return null;
        try {
            return route(routeName);
        } catch (e) {
            return null;
        }
    };

    return (
        <Card className="border border-divider h-full">
            <CardHeader className="px-4 py-3 border-b border-divider">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <BoltIcon className="w-5 h-5 text-warning" />
                        <h2 className="text-lg font-semibold">Recent Activity</h2>
                    </div>
                    <Chip size="sm" color="default" variant="flat">
                        {totalToday} today
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-default-400">
                        <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                        <p className="text-xs mt-1">Activities will appear here</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-default-200 dark:bg-default-700" />

                        {/* Activity items */}
                        <div className="space-y-4">
                            {activities.map((activity, index) => {
                                const IconComponent = iconMap[activity.icon] || InformationCircleIcon;
                                const colorClass = colorClasses[activity.color] || colorClasses.default;
                                const dotColor = dotColorClasses[activity.color] || dotColorClasses.default;

                                return (
                                    <div key={activity.id} className="relative flex gap-4 pl-2">
                                        {/* Timeline dot */}
                                        <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-content1 dark:ring-content1 z-10 mt-1.5`} />

                                        {/* Activity content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-foreground truncate">
                                                    {activity.message}
                                                </p>
                                                <span className="text-xs text-default-400 whitespace-nowrap">
                                                    {activity.timeAgo}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Avatar
                                                    name={activity.user?.[0] || '?'}
                                                    size="sm"
                                                    className="w-5 h-5 text-[10px]"
                                                />
                                                <span className="text-xs text-default-500">
                                                    {activity.user}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* View All Button */}
                {viewAllRoute && (
                    <div className="mt-4 pt-3 border-t border-divider">
                        <Button
                            as={Link}
                            href={getRoute(viewAllRoute) || '#'}
                            variant="light"
                            color="primary"
                            size="sm"
                            className="w-full"
                            endContent={<ArrowRightIcon className="w-4 h-4" />}
                        >
                            View Activity Log
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default RecentActivityWidget;
