import React, { useState, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    DropdownSection,
    Button,
    Badge,
    Avatar,
    Spinner,
    Skeleton,
} from "@heroui/react";
import {
    BellIcon,
    CheckIcon,
    TrashIcon,
    XMarkIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * NotificationDropdown Component
 * 
 * Standalone notification dropdown component with full CRUD functionality.
 * Supports real-time updates via Echo/Pusher when available.
 * 
 * @param {Object} props
 * @param {string} props.variant - 'icon' | 'button' | 'minimal'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {string} props.placement - Dropdown placement
 * @param {number} props.maxItems - Maximum notifications to show
 * @param {boolean} props.showUnreadOnly - Show only unread notifications
 * @param {Function} props.onNotificationClick - Callback when notification clicked
 */
const NotificationDropdown = ({
    variant = 'icon',
    size = 'md',
    placement = 'bottom-end',
    maxItems = 5,
    showUnreadOnly = false,
    onNotificationClick,
}) => {
    const { auth } = usePage().props;
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch('/api/notifications?' + new URLSearchParams({
                limit: maxItems,
                unread_only: showUnreadOnly ? '1' : '0',
            }), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();
            setNotifications(data.data || data.notifications || []);
            setUnreadCount(data.unread_count ?? data.data?.filter(n => !n.read_at)?.length ?? 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [maxItems, showUnreadOnly]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Set up Echo listener for real-time notifications
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Echo && auth?.user?.id) {
            const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);
            
            channel.notification((notification) => {
                setNotifications(prev => [notification, ...prev].slice(0, maxItems));
                setUnreadCount(prev => prev + 1);
            });

            return () => {
                channel.stopListening('.notification');
            };
        }
    }, [auth?.user?.id, maxItems]);

    // Mark single notification as read
    const markAsRead = async (notificationId) => {
        setActionLoading(notificationId);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(`/api/notifications/${notificationId}/read`);
                
                if (response.status === 200) {
                    setNotifications(prev => 
                        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    resolve([response.data.message || 'Notification marked as read']);
                }
            } catch (err) {
                console.error('Error marking notification as read:', err);
                reject([err.response?.data?.message || 'Failed to mark notification as read']);
            } finally {
                setActionLoading(null);
            }
        });

        // Silent operation - no toast feedback needed for individual notification reads
        promise.catch(() => {}); // Suppress unhandled rejection
    };

    // Mark all as read
    const markAllAsRead = async () => {
        setActionLoading('all');

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/api/notifications/read-all');
                
                if (response.status === 200) {
                    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
                    setUnreadCount(0);
                    resolve([response.data.message || 'All notifications marked as read']);
                }
            } catch (err) {
                console.error('Error marking all as read:', err);
                reject([err.response?.data?.message || 'Failed to mark all as read']);
            } finally {
                setActionLoading(null);
            }
        });

        showToast.promise(promise, {
            loading: 'Marking all as read...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };
        } catch (err) {
            console.error('Error marking all as read:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        setActionLoading(notificationId);
        try {
            await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            const removedNotification = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (removedNotification && !removedNotification.read_at) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read_at) {
            markAsRead(notification.id);
        }

        if (onNotificationClick) {
            onNotificationClick(notification);
        }

        // Navigate if there's a link
        if (notification.data?.link || notification.data?.url) {
            router.visit(notification.data.link || notification.data.url);
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (notification) => {
        const type = notification.data?.type || notification.type || 'info';
        const iconClass = "w-5 h-5";

        switch (type) {
            case 'success':
                return <CheckCircleIcon className={`${iconClass} text-success`} />;
            case 'warning':
                return <ExclamationTriangleIcon className={`${iconClass} text-warning`} />;
            case 'error':
            case 'danger':
                return <ExclamationCircleIcon className={`${iconClass} text-danger`} />;
            default:
                return <InformationCircleIcon className={`${iconClass} text-primary`} />;
        }
    };

    // Format time
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return '';
        }
    };

    // Render loading skeleton
    const renderSkeleton = () => (
        <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );

    // Render empty state
    const renderEmptyState = () => (
        <div className="p-8 text-center">
            <BellIcon className="w-12 h-12 mx-auto text-default-300 mb-3" />
            <p className="text-default-500 font-medium">No notifications</p>
            <p className="text-sm text-default-400 mt-1">
                You're all caught up!
            </p>
        </div>
    );

    // Render error state
    const renderErrorState = () => (
        <div className="p-8 text-center">
            <ExclamationCircleIcon className="w-12 h-12 mx-auto text-danger mb-3" />
            <p className="text-danger font-medium">Error loading notifications</p>
            <Button
                size="sm"
                variant="light"
                startContent={<ArrowPathIcon className="w-4 h-4" />}
                className="mt-3"
                onPress={fetchNotifications}
            >
                Retry
            </Button>
        </div>
    );

    // Button size mapping
    const buttonSize = {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
    }[size];

    // Icon size mapping
    const iconSize = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    }[size];

    return (
        <Dropdown 
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            placement={placement}
            closeDelay={100}
            classNames={{
                content: "backdrop-blur-xl border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300",
            }}
            style={{
                backgroundColor: 'var(--theme-content1, #FAFAFA)95',
                borderColor: 'var(--theme-divider, #E4E4E7)',
            }}
        >
            <DropdownTrigger>
                {variant === 'button' ? (
                    <Button
                        variant="flat"
                        size={buttonSize}
                        startContent={<BellIcon className={iconSize} />}
                        className="relative"
                    >
                        Notifications
                        {unreadCount > 0 && (
                            <Badge
                                content={unreadCount > 99 ? '99+' : unreadCount}
                                color="danger"
                                size="sm"
                                className="absolute -top-1 -right-1"
                            />
                        )}
                    </Button>
                ) : (
                    <Button
                        isIconOnly
                        variant="light"
                        size={buttonSize}
                        className="relative text-foreground hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
                        aria-label="Notifications"
                    >
                        {unreadCount > 0 ? (
                            <BellIconSolid className={iconSize} />
                        ) : (
                            <BellIcon className={iconSize} />
                        )}
                        {unreadCount > 0 && (
                            <Badge
                                content={unreadCount > 99 ? '99+' : unreadCount}
                                color="danger"
                                size="sm"
                                className="absolute -top-1 -right-1 animate-pulse"
                            />
                        )}
                    </Button>
                )}
            </DropdownTrigger>
            
            <DropdownMenu 
                className="w-96 max-w-[calc(100vw-2rem)] p-0" 
                aria-label="Notifications"
                disabledKeys={['header', 'loading', 'empty', 'error']}
            >
                {/* Header */}
                <DropdownSection showDivider className="pb-0">
                    <DropdownItem 
                        key="header" 
                        className="cursor-default hover:bg-transparent p-4"
                        textValue="Notifications Header"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h6 className="text-lg font-semibold text-foreground">Notifications</h6>
                                <p className="text-sm text-default-500">
                                    {unreadCount > 0 
                                        ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                                        : 'No new notifications'
                                    }
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <Button 
                                    size="sm" 
                                    variant="light" 
                                    className="text-primary"
                                    isLoading={actionLoading === 'all'}
                                    onPress={markAllAsRead}
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </DropdownItem>
                </DropdownSection>

                {/* Content */}
                <DropdownSection className="py-0 max-h-96 overflow-y-auto">
                    {loading ? (
                        <DropdownItem key="loading" textValue="Loading">
                            {renderSkeleton()}
                        </DropdownItem>
                    ) : error ? (
                        <DropdownItem key="error" textValue="Error">
                            {renderErrorState()}
                        </DropdownItem>
                    ) : notifications.length === 0 ? (
                        <DropdownItem key="empty" textValue="No notifications">
                            {renderEmptyState()}
                        </DropdownItem>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownItem 
                                key={notification.id}
                                className={`p-4 transition-colors ${
                                    !notification.read_at 
                                        ? 'bg-primary-50/50 dark:bg-primary-900/20' 
                                        : 'hover:bg-default-100'
                                }`}
                                textValue={notification.data?.title || notification.data?.message || 'Notification'}
                                onPress={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Unread indicator */}
                                    <div className="mt-1.5 shrink-0">
                                        {!notification.read_at ? (
                                            <div className="w-2 h-2 bg-primary rounded-full" />
                                        ) : (
                                            <div className="w-2 h-2" />
                                        )}
                                    </div>
                                    
                                    {/* Icon or Avatar */}
                                    <div className="shrink-0">
                                        {notification.data?.avatar ? (
                                            <Avatar 
                                                src={notification.data.avatar} 
                                                size="sm"
                                                className="w-10 h-10"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center">
                                                {getNotificationIcon(notification)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground line-clamp-1">
                                            {notification.data?.title || 'New Notification'}
                                        </p>
                                        <p className="text-sm text-default-500 line-clamp-2">
                                            {notification.data?.message || notification.data?.body || ''}
                                        </p>
                                        <p className="text-xs text-default-400 mt-1">
                                            {formatTime(notification.created_at)}
                                        </p>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center gap-1">
                                        {actionLoading === notification.id ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            <>
                                                {!notification.read_at && (
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        className="text-default-400 hover:text-success"
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification.id);
                                                        }}
                                                        aria-label="Mark as read"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    className="text-default-400 hover:text-danger"
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    aria-label="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </DropdownItem>
                        ))
                    )}
                </DropdownSection>

                {/* Footer */}
                {notifications.length > 0 && (
                    <DropdownSection className="pt-0">
                        <DropdownItem 
                            key="view-all" 
                            className="p-4 text-center"
                            textValue="View all notifications"
                            onPress={() => router.visit('/notifications')}
                        >
                            <span className="text-primary font-medium">
                                View all notifications
                            </span>
                        </DropdownItem>
                    </DropdownSection>
                )}
            </DropdownMenu>
        </Dropdown>
    );
};

export default NotificationDropdown;
