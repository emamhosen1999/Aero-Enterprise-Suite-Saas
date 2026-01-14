import { Card, CardBody, CardHeader, Chip, Button, Skeleton, Progress } from '@heroui/react';
import { BuildingStorefrontIcon, StarIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function SupplierPerformanceWidget({ suppliers = [], avg_rating = 0, on_time_delivery = 0, quality_score = 0, total_suppliers = 0, loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-44 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    const getScoreColor = (score) => {
        if (score >= 90) return 'success';
        if (score >= 70) return 'warning';
        return 'danger';
    };

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <BuildingStorefrontIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{title || 'Supplier Performance'}</span>
                    </div>
                    <Chip size="sm" color="default" variant="flat">
                        {total_suppliers} suppliers
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-4">
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                        <div className="flex items-center justify-center gap-1">
                            <StarIcon className="w-5 h-5 text-warning fill-warning" />
                            <p className="text-2xl font-bold text-primary">{avg_rating.toFixed(1)}</p>
                        </div>
                        <p className="text-xs text-default-500">Avg. Rating</p>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <TruckIcon className="w-4 h-4 text-default-400" />
                                    <span>On-Time Delivery</span>
                                </div>
                                <span className="font-medium">{on_time_delivery}%</span>
                            </div>
                            <Progress 
                                value={on_time_delivery} 
                                color={getScoreColor(on_time_delivery)} 
                                size="sm" 
                                className="h-1.5"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <StarIcon className="w-4 h-4 text-default-400" />
                                    <span>Quality Score</span>
                                </div>
                                <span className="font-medium">{quality_score}%</span>
                            </div>
                            <Progress 
                                value={quality_score} 
                                color={getScoreColor(quality_score)} 
                                size="sm" 
                                className="h-1.5"
                            />
                        </div>
                    </div>
                    {show_more_url && (
                        <Button
                            as={Link}
                            href={show_more_url}
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="w-full"
                        >
                            View All Suppliers
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
