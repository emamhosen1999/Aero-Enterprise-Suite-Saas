import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { DocumentCurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function ExpenseApprovalWidget({ 
    pending = 0,
    total_amount = 0,
    oldest_days = 0,
    currency = 'BDT',
    loading = false,
    show_more_url = '/finance/expenses/approvals',
    title = 'Expense Approvals'
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
                        <DocumentCurrencyDollarIcon className="w-5 h-5 text-warning" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {pending > 0 && (
                        <Chip color="warning" variant="flat" size="sm">
                            {pending} Pending
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {pending === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <DocumentCurrencyDollarIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No pending approvals</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                                <p className="text-2xl font-bold text-warning">{pending}</p>
                                <p className="text-xs text-default-600">Pending</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                <p className="text-lg font-bold text-primary">{currency} {total_amount.toLocaleString()}</p>
                                <p className="text-xs text-default-600">Amount</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                                <p className="text-2xl font-bold text-danger">{oldest_days}</p>
                                <p className="text-xs text-default-600">Days Old</p>
                            </div>
                        </div>
                        <Button as={Link} href={show_more_url} variant="flat" color="warning" fullWidth size="sm">
                            View Pending Expenses
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
