import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function OpenCashRegistersWidget({ 
    open_count = 0,
    my_register_open = false,
    total_cash = 0,
    currency = 'BDT',
    loading = false,
    show_more_url = '/pos/registers',
    title = 'Open Cash Registers'
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
                        <CalculatorIcon className="w-5 h-5 text-warning" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {open_count > 0 && (
                        <Chip color="warning" variant="flat" size="sm">
                            {open_count} Open
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {open_count === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CalculatorIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">All registers closed</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                                <p className="text-2xl font-bold text-warning">{open_count}</p>
                                <p className="text-xs text-default-600">Open Registers</p>
                            </div>
                            <div className={`text-center p-3 rounded-lg ${my_register_open ? 'bg-danger-50 dark:bg-danger-900/20' : 'bg-success-50 dark:bg-success-900/20'}`}>
                                <p className={`text-2xl font-bold ${my_register_open ? 'text-danger' : 'text-success'}`}>
                                    {my_register_open ? 'OPEN' : 'CLOSED'}
                                </p>
                                <p className="text-xs text-default-600">My Register</p>
                            </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                            <p className="text-lg font-bold text-primary">{currency} {total_cash.toLocaleString()}</p>
                            <p className="text-xs text-default-600">Total Cash</p>
                        </div>
                        <Button as={Link} href={show_more_url} variant="flat" color="warning" fullWidth size="sm">
                            Manage Registers
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
