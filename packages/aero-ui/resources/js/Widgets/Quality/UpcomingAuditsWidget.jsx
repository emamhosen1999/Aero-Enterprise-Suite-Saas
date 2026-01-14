import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function UpcomingAuditsWidget({ audits = [], this_week = 0, this_month = 0, total_scheduled = 0, loading, show_more_url, title }) {
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

    const isEmpty = total_scheduled === 0;

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{title || 'Upcoming Audits'}</span>
                    </div>
                    {total_scheduled > 0 && (
                        <Chip size="sm" color="primary" variant="flat">
                            {total_scheduled}
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {isEmpty ? (
                    <div className="text-center py-4">
                        <CalendarDaysIcon className="w-10 h-10 mx-auto text-default-300 mb-2" />
                        <p className="text-default-500 text-sm">No upcoming audits</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-primary/10 rounded-lg">
                                <p className="text-2xl font-bold text-primary">{this_week}</p>
                                <p className="text-xs text-default-500">This Week</p>
                            </div>
                            <div className="text-center p-3 bg-warning/10 rounded-lg">
                                <p className="text-2xl font-bold text-warning">{this_month}</p>
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
                                View Schedule
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
