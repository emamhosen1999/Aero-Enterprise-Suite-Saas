import React from 'react';
import { Card, CardBody, CardHeader, Skeleton, Chip } from '@heroui/react';
import {
    ClipboardDocumentListIcon, UserPlusIcon, Cog8ToothIcon,
    ShieldCheckIcon, ArrowRightStartOnRectangleIcon, KeyIcon,
} from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const actionIcons = {
    login: ArrowRightStartOnRectangleIcon,
    user_created: UserPlusIcon,
    settings_updated: Cog8ToothIcon,
    role_updated: ShieldCheckIcon,
    password_reset: KeyIcon,
};

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
                <CardBody className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1">
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
                <div className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">Recent Activity</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {logs.length === 0 ? (
                    <p className="text-sm text-default-400 text-center py-4">No recent activity</p>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {logs.map((log) => {
                            const Icon = actionIcons[log.action] || ClipboardDocumentListIcon;
                            return (
                                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-default-50 transition-colors">
                                    <div className="p-1.5 rounded-full bg-default-100 shrink-0">
                                        <Icon className="w-4 h-4 text-default-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">{log.user}</span>
                                            <Chip size="sm" variant="flat" className="capitalize">{log.action.replace(/_/g, ' ')}</Chip>
                                        </div>
                                        {log.description && (
                                            <p className="text-xs text-default-500 truncate">{log.description}</p>
                                        )}
                                        <p className="text-xs text-default-400">{log.timeAgo}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default AuditLogTimeline;
