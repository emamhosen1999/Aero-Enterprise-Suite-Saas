import React from 'react';
import { Card, CardBody, CardHeader, Progress, Skeleton, Chip } from '@heroui/react';
import { CircleStackIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const BREAKDOWN_COLORS = ['primary', 'secondary', 'success', 'warning', 'danger'];

const StorageAnalyticsCard = ({ storage = {}, loading = false }) => {
    const used = storage.usedBytes ?? 0;
    const total = storage.totalBytes ?? 1;
    const percentage = Math.min(100, Math.round((used / total) * 100));
    const breakdown = storage.breakdown || [];
    const statusColor = percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'success';

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-4 rounded" />
                    <Skeleton className="h-6 rounded" />
                    <Skeleton className="h-20 rounded" />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200 h-full" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
                            <CircleStackIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h3 className="font-semibold">Storage</h3>
                    </div>
                    <Chip size="sm" color={statusColor} variant="flat">{percentage}% used</Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
                {/* Big usage display */}
                <div className="text-center py-2">
                    <p className="text-3xl font-bold" style={{ color: `var(--heroui-${statusColor})` }}>
                        {formatBytes(used)}
                    </p>
                    <p className="text-sm text-default-500">of {formatBytes(total)} used</p>
                </div>

                <Progress
                    value={percentage}
                    size="lg"
                    color={statusColor}
                    aria-label="Storage usage"
                    showValueLabel
                    classNames={{ label: 'text-sm', value: 'font-bold' }}
                />

                {percentage > 80 && (
                    <p className="text-xs text-center text-danger">
                        ⚠️ Storage is {percentage > 90 ? 'critically' : 'nearly'} full
                    </p>
                )}

                {/* Breakdown */}
                {breakdown.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-divider">
                        <p className="text-xs font-semibold text-default-500 uppercase">Breakdown</p>
                        {breakdown.map((item, idx) => {
                            const itemPercent = total > 0 ? Math.round((item.bytes / total) * 100) : 0;
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-default-600">{item.label}</span>
                                        <span className="font-medium text-xs">{formatBytes(item.bytes)}</span>
                                    </div>
                                    <Progress
                                        value={itemPercent}
                                        size="sm"
                                        color={BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length]}
                                        aria-label={`${item.label} usage`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default StorageAnalyticsCard;
