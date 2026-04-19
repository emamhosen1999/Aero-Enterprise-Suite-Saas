import React from 'react';
import { Card, CardBody, CardHeader, Progress, Skeleton } from '@heroui/react';
import { CircleStackIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const StorageAnalyticsCard = ({ storage = {}, loading = false }) => {
    const used = storage.usedBytes ?? 0;
    const total = storage.totalBytes ?? 1;
    const percentage = Math.round((used / total) * 100);
    const breakdown = storage.breakdown || [];

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-4 rounded" />
                    <Skeleton className="h-20 rounded" />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center gap-2">
                    <CircleStackIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">Storage</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-default-500">Used</span>
                    <span className="text-xs font-medium">{formatBytes(used)} / {formatBytes(total)}</span>
                </div>
                <Progress
                    value={percentage}
                    size="md"
                    color={percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'primary'}
                    aria-label="Storage usage"
                />
                {breakdown.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {breakdown.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                                <span className="text-default-500">{item.label}</span>
                                <span className="font-medium">{formatBytes(item.bytes)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default StorageAnalyticsCard;
