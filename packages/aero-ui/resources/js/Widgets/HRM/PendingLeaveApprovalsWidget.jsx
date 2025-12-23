import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton, Avatar } from '@heroui/react';
import { 
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Pending Leave Approvals Widget
 * Shows pending leave requests for managers to approve.
 */
export default function PendingLeaveApprovalsWidget({ 
    pending_leaves = [],
    pending_count = 0,
    loading = false,
    view_all_url = '/hrm/leaves/approvals',
    title = 'Pending Leave Approvals'
}) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32 rounded" />
                                <Skeleton className="h-3 w-24 rounded" />
                            </div>
                        </div>
                    ))}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-warning" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    {pending_count > 0 && (
                        <Chip color="warning" variant="flat" size="sm">
                            {pending_count} Pending
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {pending_leaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <ClipboardDocumentCheckIcon className="w-12 h-12 text-default-300 mb-2" />
                        <p className="text-default-500">No pending approvals</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pending_leaves.slice(0, 5).map((leave) => (
                            <div 
                                key={leave.id} 
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-100 transition-colors"
                            >
                                <Avatar
                                    src={leave.user?.avatar}
                                    name={leave.user?.name}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {leave.user?.name}
                                    </p>
                                    <p className="text-xs text-default-500">
                                        {leave.leave_type?.name} • {leave.days} day(s)
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <Chip size="sm" variant="flat" color="warning">
                                        {leave.status}
                                    </Chip>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {pending_count > 0 && (
                    <div className="mt-4 pt-4 border-t border-divider">
                        <Button
                            as={Link}
                            href={view_all_url}
                            variant="flat"
                            color="primary"
                            fullWidth
                            size="sm"
                        >
                            View All Pending ({pending_count})
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
