import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function PendingPurchaseOrdersWidget({ 
    pending_approval = 0,
    awaiting_receipt = 0,
    total_amount = 0,
    currency = 'BDT',
    loading = false,
    show_more_url = '/ims/purchase-orders',
    title = 'Pending Purchase Orders'
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

    const total = pending_approval + awaiting_receipt;

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-warning" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {total > 0 && (
                        <Chip color="warning" variant="flat" size="sm">
                            {total} POs
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <DocumentTextIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No pending purchase orders</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                                <p className="text-2xl font-bold text-warning">{pending_approval}</p>
                                <p className="text-xs text-default-600">Approval</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                <p className="text-2xl font-bold text-primary">{awaiting_receipt}</p>
                                <p className="text-xs text-default-600">Receipt</p>
                            </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-content2">
                            <p className="text-lg font-bold text-default-700">{currency} {total_amount.toLocaleString()}</p>
                            <p className="text-xs text-default-600">Total Value</p>
                        </div>
                        <Button as={Link} href={show_more_url} variant="flat" color="warning" fullWidth size="sm">
                            View Purchase Orders
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
