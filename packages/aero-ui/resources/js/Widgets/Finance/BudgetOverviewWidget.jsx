import { Card, CardBody, CardHeader, Chip, Button, Skeleton, Progress } from '@heroui/react';
import { CalculatorIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function BudgetOverviewWidget({ total_budget = 0, spent = 0, remaining = 0, utilization_percent = 0, period = 'this_month', loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
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

    const getProgressColor = () => {
        if (utilization_percent >= 90) return 'danger';
        if (utilization_percent >= 75) return 'warning';
        return 'success';
    };

    const periodLabel = period === 'this_month' ? 'This Month' : period === 'this_quarter' ? 'This Quarter' : 'This Year';

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <ChartPieIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{title || 'Budget Overview'}</span>
                    </div>
                    <Chip size="sm" variant="flat" color="default">
                        {periodLabel}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-primary">{utilization_percent}%</p>
                        <p className="text-xs text-default-500">Budget Utilized</p>
                    </div>
                    <Progress 
                        value={utilization_percent} 
                        color={getProgressColor()} 
                        size="lg" 
                        className="h-3"
                        showValueLabel={false}
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 bg-default-100 rounded-lg">
                            <p className="text-default-500">Total Budget</p>
                            <p className="font-semibold">{formatCurrency(total_budget)}</p>
                        </div>
                        <div className="p-2 bg-default-100 rounded-lg">
                            <p className="text-default-500">Spent</p>
                            <p className="font-semibold text-warning">{formatCurrency(spent)}</p>
                        </div>
                    </div>
                    <div className="text-center p-2 bg-success/10 rounded-lg">
                        <p className="text-sm text-default-500">Remaining</p>
                        <p className="text-lg font-bold text-success">{formatCurrency(remaining)}</p>
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
                            View Budget
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
