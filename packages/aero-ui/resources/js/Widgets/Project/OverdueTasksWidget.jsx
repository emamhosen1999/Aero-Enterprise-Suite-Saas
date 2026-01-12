import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Overdue Tasks Widget
 * Shows tasks past their due date.
 */
export default function OverdueTasksWidget({ 
    my_overdue = 0,
    team_overdue = 0,
    critical = 0,
    loading = false,
    show_more_url = '/project/tasks?filter=overdue',
    title = 'Overdue Tasks'
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

    const totalOverdue = my_overdue + team_overdue;

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {totalOverdue > 0 && (
                        <Chip color="danger" variant="flat" size="sm">
                            {totalOverdue} Overdue
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {totalOverdue === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <ExclamationTriangleIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No overdue tasks</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                                <p className="text-2xl font-bold text-danger">{my_overdue}</p>
                                <p className="text-xs text-default-600">My Tasks</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                                <p className="text-2xl font-bold text-warning">{team_overdue}</p>
                                <p className="text-xs text-default-600">Team</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                                <p className="text-2xl font-bold text-danger">{critical}</p>
                                <p className="text-xs text-default-600">Critical</p>
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
                                View Overdue Tasks
                            </Button>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
