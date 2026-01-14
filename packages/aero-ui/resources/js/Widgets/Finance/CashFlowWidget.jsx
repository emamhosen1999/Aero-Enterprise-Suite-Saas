import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function CashFlowWidget({ inflow = 0, outflow = 0, net_flow = 0, period = 'this_month', trend = 'stable', loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-36 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full rounded" />
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

    const isPositive = net_flow >= 0;
    const periodLabel = period === 'this_month' ? 'This Month' : period === 'this_week' ? 'This Week' : 'Today';

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{title || 'Cash Flow'}</span>
                    </div>
                    <Chip size="sm" variant="flat" color="default">
                        {periodLabel}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-4">
                    <div className={`text-center p-4 ${isPositive ? 'bg-success/10' : 'bg-danger/10'} rounded-lg`}>
                        <div className="flex items-center justify-center gap-2">
                            {isPositive ? (
                                <ArrowTrendingUpIcon className="w-6 h-6 text-success" />
                            ) : (
                                <ArrowTrendingDownIcon className="w-6 h-6 text-danger" />
                            )}
                            <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(net_flow)}
                            </p>
                        </div>
                        <p className="text-xs text-default-500 mt-1">Net Cash Flow</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-success/10 rounded-lg">
                            <p className="text-lg font-semibold text-success">{formatCurrency(inflow)}</p>
                            <p className="text-xs text-default-500">Inflow</p>
                        </div>
                        <div className="text-center p-2 bg-danger/10 rounded-lg">
                            <p className="text-lg font-semibold text-danger">{formatCurrency(outflow)}</p>
                            <p className="text-xs text-default-500">Outflow</p>
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
                            View Details
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
