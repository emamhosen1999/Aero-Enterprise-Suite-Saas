import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { CubeIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function StockValueWidget({ total_value = 0, items_count = 0, trend = 'stable', trend_percent = 0, by_category = [], loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-36 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-14 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const getTrendIcon = () => {
        if (trend === 'up') return <ArrowTrendingUpIcon className="w-4 h-4 text-success" />;
        if (trend === 'down') return <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />;
        return null;
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-success';
        if (trend === 'down') return 'text-danger';
        return 'text-default-500';
    };

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center gap-2">
                    <CubeIcon className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{title || 'Stock Value'}</span>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="flex items-center justify-center gap-2">
                            <CurrencyDollarIcon className="w-6 h-6 text-primary" />
                            <p className="text-2xl font-bold text-primary">{formatCurrency(total_value)}</p>
                        </div>
                        <p className="text-xs text-default-500 mt-1">Total Inventory Value</p>
                        {trend !== 'stable' && (
                            <div className="flex items-center justify-center gap-1 mt-2">
                                {getTrendIcon()}
                                <span className={`text-xs ${getTrendColor()}`}>
                                    {trend_percent}% from last month
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="text-center p-2 bg-default-100 rounded-lg">
                        <p className="text-lg font-semibold">{formatNumber(items_count)}</p>
                        <p className="text-xs text-default-500">Total Items</p>
                    </div>
                    {by_category && by_category.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-default-500 font-medium">Top Categories</p>
                            {by_category.slice(0, 3).map((cat, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-default-600">{cat.name}</span>
                                    <span className="font-medium">{formatCurrency(cat.value)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {show_more_url && (
                        <Button
                            as={Link}
                            href={show_more_url}
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="w-full"
                        >
                            View Inventory
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
