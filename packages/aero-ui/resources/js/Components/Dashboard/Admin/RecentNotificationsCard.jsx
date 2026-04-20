import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton, Tooltip } from '@heroui/react';
import { BellIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const channelIcons = {
    email: '✉️',
    sms: '💬',
    push: '🔔',
    in_app: '📱',
    database: '💾',
};

const statusColorMap = {
    sent: 'success',
    pending: 'warning',
    failed: 'danger',
    delivering: 'primary',
};

const RecentNotificationsCard = ({ notifications = {}, loading = false }) => {
    const items = notifications.items ?? [];
    const total = notifications.total ?? 0;
    const unread = notifications.unread ?? 0;
    const failedToday = notifications.failedToday ?? 0;

    const stats = useMemo(() => [
        { label: 'Total', value: total, color: 'text-default-600' },
        { label: 'Unread', value: unread, color: unread > 0 ? 'text-warning' : 'text-default-400' },
        { label: 'Failed Today', value: failedToday, color: failedToday > 0 ? 'text-danger' : 'text-success' },
    ], [total, unread, failedToday]);

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-40 rounded" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded" />
                    ))}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
                            <BellIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {unread > 0 && (
                        <Chip size="sm" color="warning" variant="solid" className="font-bold">
                            {unread} new
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-default-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Recent items */}
                {items.length === 0 ? (
                    <div className="text-center py-6">
                        <BellIcon className="w-12 h-12 text-default-300 mx-auto mb-2" />
                        <p className="text-sm text-default-400">No notifications yet</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {items.map((item) => {
                            const icon = channelIcons[item.channel] || '📬';
                            const statusColor = statusColorMap[item.status] || 'default';
                            return (
                                <Tooltip key={item.id} content={item.subject} className="text-xs">
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-content2 transition-colors border-l-2"
                                        style={{
                                            borderLeftColor: item.isRead ? 'transparent' : 'var(--theme-primary)',
                                            background: item.isRead ? 'transparent' : 'color-mix(in srgb, var(--theme-primary) 5%, transparent)',
                                        }}
                                    >
                                        <span className="text-lg shrink-0">{icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.type}</p>
                                            <p className="text-xs text-default-400 truncate">{item.subject}</p>
                                        </div>
                                        <Chip size="sm" color={statusColor} variant="flat" className="shrink-0 text-[10px] capitalize">
                                            {item.status}
                                        </Chip>
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}

                {/* Footer stats */}
                {items.length > 0 && (
                    <p className="text-xs text-default-400 text-center pt-2 border-t border-divider">
                        Showing {items.length} of {total} notifications
                    </p>
                )}
            </CardBody>
        </Card>
    );
};

export default RecentNotificationsCard;
