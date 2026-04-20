import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * My Tasks Widget
 * Shows tasks assigned to the current user.
 */
export default function MyTasksWidget({ 
    total = 0,
    due_today = 0,
    due_this_week = 0,
    in_progress = 0,
    loading = false,
    show_more_url = '/project/tasks',
    title = 'My Tasks'
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
                        <ClipboardDocumentListIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {total > 0 && (
                        <Chip color="primary" variant="flat" size="sm">
                            {total} Tasks
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <ClipboardDocumentListIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No tasks assigned</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                                <p className="text-2xl font-bold text-danger">{due_today}</p>
                                <p className="text-xs text-default-600">Due Today</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                                <p className="text-2xl font-bold text-warning">{due_this_week}</p>
                                <p className="text-xs text-default-600">Due Week</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                <p className="text-2xl font-bold text-primary">{in_progress}</p>
                                <p className="text-xs text-default-600">In Progress</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-content2">
                                <p className="text-2xl font-bold text-default-700">{total}</p>
                                <p className="text-xs text-default-600">Total</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-divider">
                            <Button
                                as={Link}
                                href={show_more_url}
                                variant="flat"
                                color="primary"
                                fullWidth
                                size="sm"
                            >
                                View All Tasks
                            </Button>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
