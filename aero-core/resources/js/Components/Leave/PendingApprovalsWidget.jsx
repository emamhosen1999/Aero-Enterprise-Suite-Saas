import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Skeleton, Divider } from '@heroui/react';
import { 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    CalendarDaysIcon,
    ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';

export default function PendingApprovalsWidget() {
    const [loading, setLoading] = useState(true);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            const response = await axios.get(route('leaves.pending-approvals'));
            if (response.data.success) {
                setPendingLeaves(response.data.pending_leaves || []);
                setStats(response.data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch pending approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAll = () => {
        router.visit(route('leaves'));
    };

    if (loading) {
        return (
            <Card className="w-full h-full">
                <CardHeader className="flex justify-between items-center pb-2">
                    <Skeleton className="w-40 h-6 rounded" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                </CardHeader>
                <Divider />
                <CardBody className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="w-full h-16 rounded" />
                    ))}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full">
            <CardHeader className="flex justify-between items-center pb-2">
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-warning" />
                    <h3 className="text-base font-semibold">Pending Approvals</h3>
                </div>
                <Chip size="sm" color="warning" variant="flat">
                    {stats.pending}
                </Chip>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-3">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                        <p className="text-xs text-default-500">Pending</p>
                        <p className="text-lg font-bold text-warning">{stats.pending}</p>
                    </div>
                    <div className="text-center p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                        <p className="text-xs text-default-500">Approved</p>
                        <p className="text-lg font-bold text-success">{stats.approved}</p>
                    </div>
                    <div className="text-center p-2 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                        <p className="text-xs text-default-500">Rejected</p>
                        <p className="text-lg font-bold text-danger">{stats.rejected}</p>
                    </div>
                </div>

                {/* Pending Leaves List */}
                {pendingLeaves.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircleIcon className="w-12 h-12 mx-auto text-success mb-2" />
                        <p className="text-sm text-default-500">No pending approvals</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pendingLeaves.slice(0, 5).map((leave) => (
                            <div 
                                key={leave.id}
                                className="p-3 border border-divider rounded-lg hover:bg-default-50 dark:hover:bg-default-100 transition-colors cursor-pointer"
                                onClick={() => router.visit(route('leaves'))}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {leave.user?.name || 'Unknown User'}
                                    </p>
                                    <Chip size="sm" color="primary" variant="flat">
                                        {leave.leave_setting?.type || 'Leave'}
                                    </Chip>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-default-500">
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    <span>
                                        {new Date(leave.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                                        {new Date(leave.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="ml-auto">
                                        {leave.no_of_days} day{leave.no_of_days !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* View All Button */}
                {pendingLeaves.length > 0 && (
                    <Button
                        color="primary"
                        variant="flat"
                        size="sm"
                        fullWidth
                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                        onPress={handleViewAll}
                    >
                        View All Approvals
                    </Button>
                )}
            </CardBody>
        </Card>
    );
}
