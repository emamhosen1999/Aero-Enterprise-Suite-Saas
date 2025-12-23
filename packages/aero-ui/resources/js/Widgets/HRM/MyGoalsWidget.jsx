import React from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Button, Skeleton, CircularProgress } from '@heroui/react';
import { 
    FlagIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * My Goals Widget
 * Shows current user's goals and OKR progress.
 */
export default function MyGoalsWidget({ 
    goals = [],
    total_goals = 0,
    on_track = 0,
    at_risk = 0,
    behind = 0,
    average_progress = 0,
    loading = false,
    view_all_url = '/hrm/goals',
    title = 'My Goals'
}) {
    const statusIcons = {
        on_track: <CheckCircleIcon className="w-4 h-4 text-success" />,
        at_risk: <ExclamationTriangleIcon className="w-4 h-4 text-warning" />,
        behind: <ClockIcon className="w-4 h-4 text-danger" />,
    };

    const statusColors = {
        on_track: 'success',
        at_risk: 'warning',
        behind: 'danger',
    };

    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-32 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-4">
                    <div className="flex justify-center">
                        <Skeleton className="w-24 h-24 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <FlagIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <Chip variant="flat" color="primary" size="sm">
                        {total_goals} Goals
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {total_goals === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <FlagIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No active goals</p>
                        <Button
                            as={Link}
                            href={view_all_url}
                            variant="flat"
                            color="primary"
                            size="sm"
                            className="mt-2"
                        >
                            Set Your First Goal
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Overall Progress Circle */}
                        <div className="flex justify-center mb-4">
                            <CircularProgress
                                classNames={{
                                    svg: "w-24 h-24",
                                    indicator: "stroke-primary",
                                    track: "stroke-default-200",
                                    value: "text-xl font-semibold text-foreground",
                                }}
                                value={average_progress}
                                showValueLabel={true}
                                aria-label="Overall progress"
                            />
                        </div>

                        {/* Status Summary */}
                        <div className="flex justify-around mb-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-success">{on_track}</p>
                                <p className="text-xs text-default-500">On Track</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-warning">{at_risk}</p>
                                <p className="text-xs text-default-500">At Risk</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-danger">{behind}</p>
                                <p className="text-xs text-default-500">Behind</p>
                            </div>
                        </div>

                        {/* Recent Goals */}
                        <div className="space-y-2">
                            {goals.slice(0, 3).map((goal) => (
                                <div 
                                    key={goal.id}
                                    className="p-3 bg-default-50 rounded-lg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm truncate flex-1">
                                            {goal.title}
                                        </span>
                                        <Chip 
                                            size="sm" 
                                            variant="flat" 
                                            color={statusColors[goal.status] || 'default'}
                                            startContent={statusIcons[goal.status]}
                                        >
                                            {goal.progress}%
                                        </Chip>
                                    </div>
                                    <Progress 
                                        value={goal.progress}
                                        color={statusColors[goal.status] || 'primary'}
                                        size="sm"
                                        aria-label={`${goal.title} progress`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-divider">
                            <Button
                                as={Link}
                                href={view_all_url}
                                variant="flat"
                                color="primary"
                                fullWidth
                                size="sm"
                            >
                                View All Goals
                            </Button>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
