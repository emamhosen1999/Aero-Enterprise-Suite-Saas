import React from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Button, Skeleton } from '@heroui/react';
import { 
    ClockIcon, 
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';

/**
 * Punch Status Widget
 * Shows current punch in/out status and allows quick punch action.
 */
export default function PunchStatusWidget({ 
    is_punched_in = false,
    punch_in_time = null,
    total_hours_today = '0:00',
    loading = false,
    punch_url = null,
    title = 'Punch Status'
}) {
    const handlePunch = () => {
        if (punch_url) {
            router.post(punch_url);
        }
    };

    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-32 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-24 rounded" />
                        <Skeleton className="h-10 w-28 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{title}</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Chip
                            color={is_punched_in ? 'success' : 'danger'}
                            variant="flat"
                            size="lg"
                        >
                            {is_punched_in ? 'Punched In' : 'Punched Out'}
                        </Chip>
                        {punch_in_time && (
                            <p className="text-sm text-default-500 mt-1">
                                Since {punch_in_time}
                            </p>
                        )}
                    </div>
                    <Button
                        color={is_punched_in ? 'danger' : 'primary'}
                        startContent={
                            is_punched_in ? (
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            ) : (
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            )
                        }
                        onPress={handlePunch}
                    >
                        {is_punched_in ? 'Punch Out' : 'Punch In'}
                    </Button>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-default-500">Today's Hours</span>
                        <span className="font-semibold">{total_hours_today}</span>
                    </div>
                    <Progress 
                        aria-label="Hours progress"
                        value={parseFloat(total_hours_today) || 0}
                        maxValue={8}
                        color="primary"
                        showValueLabel={false}
                    />
                </div>
            </CardBody>
        </Card>
    );
}
