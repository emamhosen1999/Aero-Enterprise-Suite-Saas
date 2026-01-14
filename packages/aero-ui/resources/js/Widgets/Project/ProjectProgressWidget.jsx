import { Card, CardBody, CardHeader, Chip, Button, Skeleton, Progress } from '@heroui/react';
import { BriefcaseIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function ProjectProgressWidget({ projects = [], active_count = 0, on_track = 0, at_risk = 0, delayed = 0, avg_completion = 0, loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    const isEmpty = active_count === 0;

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{title || 'Project Progress'}</span>
                    </div>
                    {active_count > 0 && (
                        <Chip size="sm" color="primary" variant="flat">
                            {active_count} active
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {isEmpty ? (
                    <div className="text-center py-4">
                        <BriefcaseIcon className="w-10 h-10 mx-auto text-default-300 mb-2" />
                        <p className="text-default-500 text-sm">No active projects</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center p-3 bg-primary/10 rounded-lg">
                            <p className="text-3xl font-bold text-primary">{avg_completion}%</p>
                            <p className="text-xs text-default-500">Avg. Completion</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-success/10 rounded-lg">
                                <CheckCircleIcon className="w-5 h-5 mx-auto text-success mb-1" />
                                <p className="text-lg font-bold text-success">{on_track}</p>
                                <p className="text-xs text-default-500">On Track</p>
                            </div>
                            <div className="p-2 bg-warning/10 rounded-lg">
                                <ExclamationTriangleIcon className="w-5 h-5 mx-auto text-warning mb-1" />
                                <p className="text-lg font-bold text-warning">{at_risk}</p>
                                <p className="text-xs text-default-500">At Risk</p>
                            </div>
                            <div className="p-2 bg-danger/10 rounded-lg">
                                <ClockIcon className="w-5 h-5 mx-auto text-danger mb-1" />
                                <p className="text-lg font-bold text-danger">{delayed}</p>
                                <p className="text-xs text-default-500">Delayed</p>
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
                                View All Projects
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
