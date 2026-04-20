import React from 'react';
import { Card, CardBody, CardHeader, Skeleton, Chip, Tooltip } from '@heroui/react';
import {
    ClipboardDocumentListIcon, UserPlusIcon, Cog8ToothIcon,
    ShieldCheckIcon, ArrowRightStartOnRectangleIcon, KeyIcon,
    TrashIcon, PencilSquareIcon, EyeIcon, DocumentTextIcon,
    ArrowPathIcon, UserIcon,
} from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const ACTION_CONFIG = {
    login:            { Icon: ArrowRightStartOnRectangleIcon, color: 'primary',   dot: 'bg-primary'   },
    logout:           { Icon: ArrowRightStartOnRectangleIcon, color: 'default',   dot: 'bg-default-400' },
    user_created:     { Icon: UserPlusIcon,                   color: 'success',   dot: 'bg-success'   },
    user_updated:     { Icon: PencilSquareIcon,               color: 'warning',   dot: 'bg-warning'   },
    user_deleted:     { Icon: TrashIcon,                      color: 'danger',    dot: 'bg-danger'    },
    settings_updated: { Icon: Cog8ToothIcon,                  color: 'secondary', dot: 'bg-secondary' },
    role_updated:     { Icon: ShieldCheckIcon,                color: 'secondary', dot: 'bg-secondary' },
    password_reset:   { Icon: KeyIcon,                        color: 'warning',   dot: 'bg-warning'   },
    viewed:           { Icon: EyeIcon,                        color: 'default',   dot: 'bg-default-400' },
    exported:         { Icon: DocumentTextIcon,               color: 'primary',   dot: 'bg-primary'   },
    restored:         { Icon: ArrowPathIcon,                  color: 'success',   dot: 'bg-success'   },
};

const getConfig = (action) => ACTION_CONFIG[action] || { Icon: UserIcon, color: 'default', dot: 'bg-default-400' };

const AuditLogTimeline = ({ logs = [], loading = false }) => {
    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider)' }}>
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        <h3 className="font-semibold">Recent Activity</h3>
                    </div>
                </CardHeader>
                <CardBody className="p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1.5 pt-1">
                                <Skeleton className="h-4 w-3/4 rounded" />
                                <Skeleton className="h-3 w-1/2 rounded" />
                            </div>
                        </div>
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
                            <ClipboardDocumentListIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h3 className="font-semibold">Recent Activity</h3>
                    </div>
                    {logs.length > 0 && (
                        <Chip size="sm" variant="flat">{logs.length} events</Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {logs.length === 0 ? (
                    <div className="text-center py-8">
                        <ClipboardDocumentListIcon className="w-12 h-12 text-default-300 mx-auto mb-2" />
                        <p className="text-sm text-default-400">No recent activity</p>
                    </div>
                ) : (
                    <div className="relative max-h-80 overflow-y-auto">
                        {/* Timeline vertical line */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-divider rounded" />

                        <div className="space-y-1 pl-2">
                            {logs.map((log, idx) => {
                                const { Icon, color, dot } = getConfig(log.action);
                                return (
                                    <div
                                        key={log.id ?? idx}
                                        className="flex items-start gap-3 p-2 pl-6 rounded-lg hover:bg-default-50 transition-colors group relative"
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute left-[10px] top-[14px] w-3.5 h-3.5 rounded-full border-2 border-background ${dot} shrink-0 transition-transform group-hover:scale-110`} />

                                        {/* Icon */}
                                        <div className={`p-1.5 rounded-lg shrink-0 bg-${color}/10`}>
                                            <Icon className={`w-3.5 h-3.5 text-${color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium truncate max-w-[120px]">{log.user}</span>
                                                <Chip size="sm" color={color} variant="flat" className="capitalize text-[10px] h-5">
                                                    {(log.action || '').replace(/_/g, ' ')}
                                                </Chip>
                                            </div>
                                            {log.description && (
                                                <Tooltip content={log.description} placement="bottom">
                                                    <p className="text-xs text-default-500 truncate cursor-help">{log.description}</p>
                                                </Tooltip>
                                            )}
                                            <p className="text-[10px] text-default-400 mt-0.5">{log.timeAgo}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default AuditLogTimeline;
