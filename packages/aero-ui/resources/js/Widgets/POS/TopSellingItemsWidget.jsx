import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { ShoppingBagIcon, TrophyIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function TopSellingItemsWidget({ items = [], period = 'this_month', total_sales = 0, loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-3/4 rounded mb-1" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        );
    }

    const isEmpty = !items || items.length === 0;
    const periodLabel = period === 'this_month' ? 'This Month' : period === 'this_week' ? 'This Week' : 'Today';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getRankBadge = (index) => {
        const colors = ['warning', 'default', 'default'];
        const icons = ['🥇', '🥈', '🥉'];
        return icons[index] || `${index + 1}`;
    };

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <TrophyIcon className="w-5 h-5 text-warning" />
                        <span className="font-semibold">{title || 'Top Selling Items'}</span>
                    </div>
                    <Chip size="sm" variant="flat" color="default">
                        {periodLabel}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {isEmpty ? (
                    <div className="text-center py-4">
                        <ShoppingBagIcon className="w-10 h-10 mx-auto text-default-300 mb-2" />
                        <p className="text-default-500 text-sm">No sales data available</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-content2 rounded-lg hover:bg-content3 transition-colors">
                                <span className="text-lg w-8 text-center">{getRankBadge(index)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-default-500">{item.quantity_sold} sold</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-success">{formatCurrency(item.revenue)}</p>
                                </div>
                            </div>
                        ))}
                        {show_more_url && (
                            <Button
                                as={Link}
                                href={show_more_url}
                                size="sm"
                                variant="flat"
                                color="primary"
                                className="w-full mt-2"
                            >
                                View All Sales
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
