import React from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Button, Skeleton } from '@heroui/react';
import { 
    UserGroupIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Team Attendance Widget
 * Shows team attendance overview for managers.
 */
export default function TeamAttendanceWidget({ 
    present = 0,
    absent = 0,
    late = 0,
    on_leave = 0,
    total_team = 0,
    attendance_rate = 0,
    loading = false,
    view_details_url = '/hrm/attendance',
    title = 'Team Attendance'
}) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-36 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="text-center">
                                <Skeleton className="h-8 w-12 mx-auto rounded" />
                                <Skeleton className="h-3 w-14 mt-1 mx-auto rounded" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </CardBody>
            </Card>
        );
    }

    const stats = [
        { label: 'Present', value: present, color: 'success', icon: CheckCircleIcon },
        { label: 'Absent', value: absent, color: 'danger', icon: XCircleIcon },
        { label: 'Late', value: late, color: 'warning', icon: ClockIcon },
        { label: 'Leave', value: on_leave, color: 'primary', icon: CalendarDaysIcon },
    ];

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <Chip variant="flat" color="default" size="sm">
                        Today
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {total_team === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <UserGroupIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No team members</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {stats.map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className={`text-2xl font-bold text-${stat.color}`}>
                                        {stat.value}
                                    </div>
                                    <div className="flex items-center justify-center gap-1">
                                        <stat.icon className={`w-3 h-3 text-${stat.color}`} />
                                        <span className="text-xs text-default-500">{stat.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Attendance Rate */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-default-500">Attendance Rate</span>
                                <span className="font-semibold">{attendance_rate}%</span>
                            </div>
                            <Progress 
                                value={attendance_rate}
                                color={attendance_rate >= 90 ? 'success' : attendance_rate >= 75 ? 'warning' : 'danger'}
                                aria-label="Attendance rate"
                            />
                        </div>

                        {/* Team Size Info */}
                        <div className="flex items-center justify-between text-sm text-default-500 p-2 bg-default-50 rounded-lg">
                            <span>Total Team Members</span>
                            <Chip size="sm" variant="flat">{total_team}</Chip>
                        </div>

                        <div className="mt-4 pt-4 border-t border-divider">
                            <Button
                                as={Link}
                                href={view_details_url}
                                variant="flat"
                                color="primary"
                                fullWidth
                                size="sm"
                            >
                                View Details
                            </Button>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
