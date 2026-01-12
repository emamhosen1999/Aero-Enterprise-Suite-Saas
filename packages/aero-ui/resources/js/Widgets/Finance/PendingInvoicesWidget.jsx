import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function PendingInvoicesWidget({ 
    unpaid = 0,
    overdue = 0,
    total_amount = 0,
    currency = 'BDT',
    loading = false,
    show_more_url = '/finance/invoices',
    title = 'Pending Invoices'
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
                        <BanknotesIcon className="w-5 h-5 text-warning" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {(unpaid + overdue) > 0 && (
                        <Chip color="warning" variant="flat" size="sm">
                            {unpaid + overdue} Pending
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {(unpaid + overdue) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <BanknotesIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">All invoices paid</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                                <p className="text-2xl font-bold text-warning">{unpaid}</p>
                                <p className="text-xs text-default-600">Unpaid</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                                <p className="text-2xl font-bold text-danger">{overdue}</p>
                                <p className="text-xs text-default-600">Overdue</p>
                            </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                            <p className="text-2xl font-bold text-primary">{currency} {total_amount.toLocaleString()}</p>
                            <p className="text-xs text-default-600">Total Amount</p>
                        </div>
                        <Button as={Link} href={show_more_url} variant="flat" color="warning" fullWidth size="sm">
                            View All Invoices
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
