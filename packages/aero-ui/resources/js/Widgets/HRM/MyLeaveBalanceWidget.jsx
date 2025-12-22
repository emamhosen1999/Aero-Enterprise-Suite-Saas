import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton, Progress, Tooltip } from '@heroui/react';
import { 
    CalendarDaysIcon, 
    ArrowRightIcon,
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

/**
 * MyLeaveBalanceWidget - Compact leave balance display for Core Dashboard
 * 
 * Shows remaining leave days grouped by type in a compact format.
 * This is a SUMMARY widget for the Core Dashboard.
 */
export default function MyLeaveBalanceWidget({ data, meta }) {
    const [loading, setLoading] = useState(!data);
    const [balanceData, setBalanceData] = useState(data || null);

    useEffect(() => {
        // If data is passed from backend, use it directly
        if (data) {
            setBalanceData(data);
            setLoading(false);
            return;
        }

        // Otherwise fetch it
        fetchLeaveBalance();
    }, [data]);

    const fetchLeaveBalance = async () => {
        try {
            const response = await axios.get(route('leaves.my-balance'));
            if (response.data.success) {
                setBalanceData(response.data.balance);
            }
        } catch (error) {
            console.error('Failed to fetch leave balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = () => {
        router.visit(route('leaves.employee'));
    };

    const getTypeColor = (type) => {
        const colors = {
            annual: 'primary',
            sick: 'warning',
            casual: 'success',
            maternity: 'secondary',
            paternity: 'secondary',
            unpaid: 'default',
        };
        return colors[type?.toLowerCase()] || 'default';
    };

    if (loading) {
        return (
            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                <CardHeader className="border-b border-divider p-4">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                        <Skeleton className="w-24 h-5 rounded" />
                    </div>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                            <Skeleton className="w-20 h-4 rounded" />
                            <Skeleton className="w-12 h-6 rounded-full" />
                        </div>
                    ))}
                </CardBody>
            </Card>
        );
    }

    if (!balanceData || !balanceData.breakdown || balanceData.breakdown.length === 0) {
        return (
            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                <CardHeader className="border-b border-divider p-4">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Leave Balance</span>
                    </div>
                </CardHeader>
                <CardBody className="p-4 text-center text-default-500">
                    <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-default-300" />
                    <p className="text-sm">No leave allocation found</p>
                </CardBody>
            </Card>
        );
    }

    const { totalRemaining, breakdown } = balanceData;

    return (
        <Card 
            className="transition-all duration-200 cursor-pointer hover:shadow-md" 
            style={getThemedCardStyle()}
            isPressable
            onPress={handleViewDetails}
        >
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Leave Balance</span>
                    </div>
                    <Chip color="primary" size="sm" variant="flat">
                        {totalRemaining} days
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-3">
                    {breakdown.slice(0, 4).map((item) => (
                        <div key={item.type} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-default-600 capitalize">{item.type}</span>
                                <span className="font-medium">
                                    {item.remaining}/{item.total}
                                </span>
                            </div>
                            <Tooltip content={`${item.used} used of ${item.total}`}>
                                <Progress 
                                    size="sm" 
                                    value={(item.remaining / item.total) * 100}
                                    color={getTypeColor(item.type)}
                                    className="h-1.5"
                                />
                            </Tooltip>
                        </div>
                    ))}
                </div>

                {breakdown.length > 4 && (
                    <div className="mt-3 pt-3 border-t border-divider">
                        <button 
                            onClick={handleViewDetails}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            View all {breakdown.length} types
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
