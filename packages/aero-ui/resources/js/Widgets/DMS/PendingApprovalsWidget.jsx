import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Avatar, Skeleton } from '@heroui/react';
import { ClipboardDocumentCheckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Pending Document Approvals Widget
 * 
 * Displays documents awaiting approval from the current user.
 */
export default function PendingApprovalsWidget({
    approvals = [],
    count = 0,
    action_url = '/dms/approvals',
    title = 'Pending Approvals',
    isLoading = false
}) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'danger';
            case 'high': return 'warning';
            case 'normal': return 'primary';
            default: return 'default';
        }
    };

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="border-b border-divider px-4 py-3">
                    <Skeleton className="h-5 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-3/4 rounded mb-1" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex justify-between items-center border-b border-divider px-4 py-3">
                <div className="flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-warning" />
                    <h3 className="text-base font-semibold">{title}</h3>
                    {count > 0 && (
                        <Chip size="sm" variant="flat" color="warning">{count}</Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {approvals.length === 0 ? (
                    <div className="text-center py-6 text-default-400">
                        <ClipboardDocumentCheckIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending approvals</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {approvals.slice(0, 5).map((approval) => (
                            <div
                                key={approval.id}
                                className="flex items-start gap-3 p-2 rounded-lg bg-default-50"
                            >
                                <Avatar
                                    name={approval.requester?.name || 'U'}
                                    size="sm"
                                    className="flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {approval.document?.name}
                                    </p>
                                    <p className="text-xs text-default-400">
                                        Requested by {approval.requester?.name} • {formatDate(approval.created_at)}
                                    </p>
                                    {approval.priority && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={getPriorityColor(approval.priority)}
                                            className="mt-1"
                                        >
                                            {approval.priority}
                                        </Chip>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        color="success"
                                        aria-label="Approve"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        aria-label="Reject"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {count > 5 && (
                    <div className="mt-3 pt-3 border-t border-divider">
                        <Button
                            as={Link}
                            href={action_url}
                            variant="light"
                            color="warning"
                            size="sm"
                            className="w-full"
                        >
                            View All ({count})
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
