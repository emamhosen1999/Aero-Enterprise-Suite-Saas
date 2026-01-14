import { Card, CardBody, CardHeader, Chip, Button, Skeleton, Progress } from '@heroui/react';
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function QualityMetricsWidget({ ncr_rate = 0, capa_closure_rate = 0, first_pass_yield = 0, audit_score = 0, trends = {}, loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    const getTrendIcon = (trend) => {
        if (trend === 'up') return <ArrowTrendingUpIcon className="w-4 h-4 text-success" />;
        if (trend === 'down') return <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />;
        return null;
    };

    const metrics = [
        { label: 'NCR Rate', value: `${ncr_rate}%`, color: ncr_rate > 5 ? 'danger' : 'success', trend: trends?.ncr_rate_trend },
        { label: 'CAPA Closure', value: `${capa_closure_rate}%`, color: capa_closure_rate >= 80 ? 'success' : 'warning', trend: trends?.closure_rate_trend },
        { label: 'First Pass Yield', value: `${first_pass_yield}%`, color: first_pass_yield >= 95 ? 'success' : 'warning' },
        { label: 'Audit Score', value: `${audit_score}%`, color: audit_score >= 80 ? 'success' : audit_score >= 60 ? 'warning' : 'danger' },
    ];

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{title || 'Quality Metrics'}</span>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-4">
                    {metrics.map((metric, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-default-600">{metric.label}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold">{metric.value}</span>
                                    {metric.trend && getTrendIcon(metric.trend)}
                                </div>
                            </div>
                            <Progress 
                                value={parseFloat(metric.value)} 
                                color={metric.color} 
                                size="sm" 
                                className="h-1.5"
                            />
                        </div>
                    ))}
                </div>
                {show_more_url && (
                    <Button
                        as={Link}
                        href={show_more_url}
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="w-full mt-4"
                    >
                        View Reports
                    </Button>
                )}
            </CardBody>
        </Card>
    );
}
