import React from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton } from '@heroui/react';
import { ServerStackIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const statusColors = {
    healthy: 'success',
    degraded: 'warning',
    down: 'danger',
    unknown: 'default',
};

const SystemHealthCard = ({ health = {}, loading = false }) => {
    const services = health.services || [];

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 rounded" />)}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center gap-2">
                    <ServerStackIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">System Health</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {services.length === 0 ? (
                    <p className="text-sm text-default-400 text-center py-4">No health data</p>
                ) : (
                    <div className="space-y-2">
                        {services.map((svc) => (
                            <div key={svc.name} className="flex items-center justify-between p-2 rounded-lg bg-default-50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${svc.status === 'healthy' ? 'bg-success' : svc.status === 'degraded' ? 'bg-warning' : 'bg-danger'}`} />
                                    <span className="text-sm">{svc.name}</span>
                                </div>
                                <Chip size="sm" variant="flat" color={statusColors[svc.status] || 'default'} className="capitalize">
                                    {svc.status}
                                </Chip>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default SystemHealthCard;
