import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Pending NCRs Widget
 * Shows pending non-conformance reports requiring action.
 */
export default function PendingNCRsWidget({ 
    total = 0,
    overdue = 0,
    assigned_to_me = 0,
    loading = false,
    show_more_url = '/quality/ncr',
    title = 'Pending NCRs'
}) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-16 w-full rounded" />
                    <Skeleton className="h-12 w-full rounded" />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {total > 0 && (
                        <Chip color="danger" variant="flat" size="sm">
                            {total} NCRs
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <ExclamationTriangleIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No pending NCRs</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                                <p className="text-2xl font-bold text-danger">{total}</p>
                                <p className="text-xs text-default-600">Total</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                                <p className="text-2xl font-bold text-danger">{overdue}</p>
                                <p className="text-xs text-default-600">Overdue</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                <p className="text-2xl font-bold text-primary">{assigned_to_me}</p>
                                <p className="text-xs text-default-600">Assigned</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-divider">
                            <Button
                                as={Link}
                                href={show_more_url}
                                variant="flat"
                                color="danger"
                                fullWidth
                                size="sm"
                            >
                                View All NCRs
                            </Button>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
