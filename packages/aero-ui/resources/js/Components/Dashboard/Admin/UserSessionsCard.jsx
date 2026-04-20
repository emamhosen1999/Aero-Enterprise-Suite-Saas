import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton, Tooltip } from '@heroui/react';
import { GlobeAltIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const deviceTypeIcons = {
    mobile: <DevicePhoneMobileIcon className="w-4 h-4" />,
    desktop: <ComputerDesktopIcon className="w-4 h-4" />,
    tablet: <DevicePhoneMobileIcon className="w-4 h-4" />,
    unknown: <GlobeAltIcon className="w-4 h-4" />,
};

const UserSessionsCard = ({ sessions = {}, loading = false }) => {
    const onlineNow = sessions.onlineNow ?? 0;
    const activeToday = sessions.activeToday ?? 0;
    const activeThisWeek = sessions.activeThisWeek ?? 0;
    const recentSessions = sessions.recentSessions ?? [];
    const deviceBreakdown = sessions.deviceBreakdown ?? {};

    const stats = useMemo(() => [
        { label: 'Online Now', value: onlineNow, icon: '🟢', color: 'success' },
        { label: 'Active Today', value: activeToday, icon: '📊', color: 'primary' },
        { label: 'This Week', value: activeThisWeek, icon: '📈', color: 'secondary' },
    ], [onlineNow, activeToday, activeThisWeek]);

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-40 rounded" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 rounded" />
                    ))}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center gap-2 w-full">
                    <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
                        <GlobeAltIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <h3 className="font-semibold">Active Sessions</h3>
                    {onlineNow > 0 && (
                        <Chip size="sm" color="success" variant="solid" className="ml-auto font-bold">
                            {onlineNow} Live
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
                {/* Activity stats */}
                <div className="grid grid-cols-3 gap-2">
                    {stats.map((stat) => (
                        <Tooltip key={stat.label} content={stat.label} className="text-xs">
                            <div className="text-center p-2 rounded-lg hover:bg-default-50 transition-colors cursor-pointer">
                                <p className="text-lg mb-1">{stat.icon}</p>
                                <p className={`text-lg font-bold text-${stat.color}`}>{stat.value}</p>
                                <p className="text-xs text-default-500">{stat.label.split(' ')[0]}</p>
                            </div>
                        </Tooltip>
                    ))}
                </div>

                {/* Device breakdown */}
                {Object.keys(deviceBreakdown).length > 0 && (
                    <div className="pt-2 border-t border-divider">
                        <p className="text-xs font-semibold text-default-500 mb-2 uppercase">Device Types</p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(deviceBreakdown).map(([type, count]) => (
                                <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-default-50">
                                    <span className="text-primary">{deviceTypeIcons[type.toLowerCase()] || deviceTypeIcons.unknown}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium capitalize truncate">{type}</p>
                                        <p className="text-[10px] text-default-400">{count} active</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent sessions */}
                {recentSessions.length > 0 && (
                    <div className="pt-2 border-t border-divider">
                        <p className="text-xs font-semibold text-default-500 mb-2 uppercase">Recent Activity</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {recentSessions.map((session, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-2 rounded-lg text-sm ${session.isOnline ? 'bg-success/10 border border-success/30' : 'bg-default-50'}`}>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{session.user}</p>
                                        <p className="text-[10px] text-default-400 truncate">{session.ip}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={`inline-block w-2 h-2 rounded-full ${session.isOnline ? 'bg-success' : 'bg-default-300'} mr-2`} />
                                        <p className="text-[10px] text-default-400 whitespace-nowrap">{session.timeAgo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {recentSessions.length === 0 && (
                    <div className="text-center py-6">
                        <GlobeAltIcon className="w-12 h-12 text-default-300 mx-auto mb-2" />
                        <p className="text-sm text-default-400">No active sessions</p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default UserSessionsCard;
