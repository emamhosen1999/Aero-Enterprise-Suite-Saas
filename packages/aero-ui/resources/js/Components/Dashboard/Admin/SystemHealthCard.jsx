import React from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton } from '@heroui/react';
import { ServerStackIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const statusConfig = {
    healthy:   { color: 'success', Icon: CheckCircleIcon,           dot: 'bg-success',  pulse: 'animate-pulse' },
    degraded:  { color: 'warning', Icon: ExclamationTriangleIcon,   dot: 'bg-warning',  pulse: '' },
    unhealthy: { color: 'danger',  Icon: XCircleIcon,               dot: 'bg-danger',   pulse: '' },
    down:      { color: 'danger',  Icon: XCircleIcon,               dot: 'bg-danger',   pulse: '' },
    unknown:   { color: 'default', Icon: QuestionMarkCircleIcon,    dot: 'bg-default-400', pulse: '' },
};

const SystemHealthCard = ({ health = {}, loading = false }) => {
    const services = health.services || [];
    const overall = health.overall || 'unknown';
    const failedJobs = health.failedJobs ?? 0;
    const overallCfg = statusConfig[overall] || statusConfig.unknown;
    const OverallIcon = overallCfg.Icon;

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
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
                            <ServerStackIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h3 className="font-semibold">System Health</h3>
                    </div>
                    <Chip
                        size="sm"
                        color={overallCfg.color}
                        variant={overall === 'healthy' ? 'solid' : 'flat'}
                        startContent={<OverallIcon className="w-3 h-3" />}
                        className="capitalize"
                    >
                        {overall}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-2">
                {services.length === 0 ? (
                    <div className="text-center py-6">
                        <QuestionMarkCircleIcon className="w-12 h-12 text-default-300 mx-auto mb-2" />
                        <p className="text-sm text-default-400">No health data available</p>
                    </div>
                ) : (
                    services.map((svc) => {
                        const cfg = statusConfig[svc.status] || statusConfig.unknown;
                        const SvcIcon = cfg.Icon;
                        return (
                            <div key={svc.name} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                svc.status === 'healthy' ? 'border-success/20 bg-success/5' :
                                svc.status === 'degraded' ? 'border-warning/20 bg-warning/5' :
                                svc.status !== 'unknown' ? 'border-danger/20 bg-danger/5' :
                                'border-default-200 bg-default-50'
                            }`}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`relative w-2.5 h-2.5 rounded-full ${cfg.dot} ${svc.status === 'healthy' ? cfg.pulse : ''}`}>
                                        {svc.status === 'healthy' && (
                                            <span className="absolute inset-0 rounded-full bg-success opacity-75 animate-ping" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{svc.name}</span>
                                </div>
                                <Chip size="sm" variant="flat" color={cfg.color} className="capitalize text-[11px]">
                                    {svc.status}
                                </Chip>
                            </div>
                        );
                    })
                )}

                {failedJobs > 0 && (
                    <div className="mt-2 p-3 rounded-xl border border-danger/30 bg-danger/5">
                        <p className="text-sm text-danger font-medium">
                            ⚠️ {failedJobs} failed job{failedJobs !== 1 ? 's' : ''} in queue
                        </p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default SystemHealthCard;
