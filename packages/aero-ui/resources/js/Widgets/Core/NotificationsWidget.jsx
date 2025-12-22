import React from 'react';
import { Card, CardHeader, CardBody, Badge, Button, Chip } from '@heroui/react';
import { Link } from '@inertiajs/react';
import {
    BellIcon,
    BellAlertIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

/**
 * NotificationsWidget
 * 
 * Displays recent unread notifications for the current user.
 * Shows notification type, message, and time since creation.
 */
const NotificationsWidget = ({ data = {} }) => {
    const { 
        notifications = [], 
        unreadCount = 0, 
        hasMore = false 
    } = data;

    // Icon mapping based on notification type/color
    const getNotificationIcon = (color, icon) => {
        const iconMap = {
            success: <CheckCircleIcon className="w-5 h-5 text-success" />,
            warning: <ExclamationCircleIcon className="w-5 h-5 text-warning" />,
            danger: <ExclamationCircleIcon className="w-5 h-5 text-danger" />,
            info: <InformationCircleIcon className="w-5 h-5 text-primary" />,
            default: <BellIcon className="w-5 h-5 text-default-500" />,
        };

        return iconMap[color] || iconMap.default;
    };

    // Color mapping for chips
    const colorMap = {
        success: 'success',
        warning: 'warning',
        danger: 'danger',
        info: 'primary',
        default: 'default',
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
        <Card>
            <CardHeader className="p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Badge 
                            content={unreadCount > 99 ? '99+' : unreadCount} 
                            color="danger" 
                            size="sm"
                            isInvisible={unreadCount === 0}
                        >
                            <BellAlertIcon className="w-5 h-5 text-warning" />
                        </Badge>
                        <h2 className="text-lg font-semibold">Notifications</h2>
                    </div>
                    {unreadCount > 0 && (
                        <Chip size="sm" color="warning" variant="flat">
                            {unreadCount} unread
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4 pt-0">
                {notifications.length === 0 ? (
                    <div className="text-center py-6 text-default-400">
                        <BellIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => {
                            const route = getRoute(notification.route);
                            const Wrapper = route ? Link : 'div';
                            const wrapperProps = route ? { href: route } : {};

                            return (
                                <Wrapper
                                    key={notification.id}
                                    {...wrapperProps}
                                    className={`flex items-start gap-3 p-3 rounded-lg border border-default-200 
                                        hover:bg-default-50 transition-colors ${route ? 'cursor-pointer' : ''}`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.color, notification.icon)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {notification.title}
                                        </p>
                                        {notification.message && (
                                            <p className="text-xs text-default-500 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                        )}
                                        <p className="text-xs text-default-400 mt-1">
                                            {notification.createdAt}
                                        </p>
                                    </div>
                                </Wrapper>
                            );
                        })}

                        {hasMore && (
                            <Button
                                as={Link}
                                href={getRoute('notifications.index') || '#'}
                                variant="flat"
                                color="primary"
                                size="sm"
                                className="w-full mt-2"
                                endContent={<ArrowRightIcon className="w-4 h-4" />}
                            >
                                View All Notifications
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

NotificationsWidget.displayName = 'NotificationsWidget';

export default NotificationsWidget;
