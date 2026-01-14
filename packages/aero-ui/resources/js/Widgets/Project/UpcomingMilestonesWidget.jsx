import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { FlagIcon, CalendarDaysIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function UpcomingMilestonesWidget({ milestones = [], this_week = 0, this_month = 0, overdue = 0, loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded" />
                        <Skeleton className="h-10 w-full rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    const isEmpty = this_week === 0 && this_month === 0 && overdue === 0;

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <FlagIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{title || 'Upcoming Milestones'}</span>
                    </div>
                    {overdue > 0 && (
                        <Chip size="sm" color="danger" variant="flat">
                            {overdue} overdue
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {isEmpty ? (
                    <div className="text-center py-4">
                        <FlagIcon className="w-10 h-10 mx-auto text-default-300 mb-2" />
                        <p className="text-default-500 text-sm">No upcoming milestones</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {overdue > 0 && (
                                <div className="p-2 bg-danger/10 rounded-lg">
                                    <ExclamationCircleIcon className="w-5 h-5 mx-auto text-danger mb-1" />
                                    <p className="text-lg font-bold text-danger">{overdue}</p>
                                    <p className="text-xs text-default-500">Overdue</p>
                                </div>
                            )}
                            <div className={`p-2 bg-warning/10 rounded-lg ${overdue === 0 ? 'col-span-1' : ''}`}>
                                <CalendarDaysIcon className="w-5 h-5 mx-auto text-warning mb-1" />
                                <p className="text-lg font-bold text-warning">{this_week}</p>
                                <p className="text-xs text-default-500">This Week</p>
                            </div>
                            <div className={`p-2 bg-primary/10 rounded-lg ${overdue === 0 ? 'col-span-1' : ''}`}>
                                <FlagIcon className="w-5 h-5 mx-auto text-primary mb-1" />
                                <p className="text-lg font-bold text-primary">{this_month}</p>
                                <p className="text-xs text-default-500">This Month</p>
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
                                View Milestones
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
