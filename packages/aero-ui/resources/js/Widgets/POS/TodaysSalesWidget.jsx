import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function TodaysSalesWidget({ 
    total_sales = 0,
    transaction_count = 0,
    average_ticket = 0,
    currency = 'BDT',
    loading = false,
    show_more_url = '/pos/reports/daily',
    title = "Today's Sales"
}) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-16 w-full rounded" />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-success" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {transaction_count > 0 && (
                        <Chip color="success" variant="flat" size="sm">
                            {transaction_count} Sales
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {transaction_count === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CurrencyDollarIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No sales today</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-center p-4 rounded-lg bg-success-50 dark:bg-success-900/20">
                            <p className="text-3xl font-bold text-success">{currency} {total_sales.toLocaleString()}</p>
                            <p className="text-xs text-default-600 mt-1">Total Sales</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                <p className="text-xl font-bold text-primary">{transaction_count}</p>
                                <p className="text-xs text-default-600">Transactions</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-default-100 dark:bg-default-50/10">
                                <p className="text-xl font-bold text-default-700">{currency} {average_ticket.toLocaleString()}</p>
                                <p className="text-xs text-default-600">Avg Ticket</p>
                            </div>
                        </div>
                        <Button as={Link} href={show_more_url} variant="flat" color="success" fullWidth size="sm">
                            View Sales Report
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
