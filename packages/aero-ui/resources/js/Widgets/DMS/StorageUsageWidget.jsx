import React from 'react';
import { Card, CardBody, Progress, Skeleton } from '@heroui/react';
import { CircleStackIcon, DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';

/**
 * Storage Usage Widget
 * 
 * Displays storage usage with progress bar and statistics.
 */
export default function StorageUsageWidget({
    used_bytes = 0,
    quota_bytes = 10737418240, // 10GB
    used_formatted = '0 MB',
    quota_formatted = '10 GB',
    percentage = 0,
    document_count = 0,
    folder_count = 0,
    title = 'Storage Usage',
    isLoading = false
}) {
    const getProgressColor = () => {
        if (percentage >= 90) return 'danger';
        if (percentage >= 75) return 'warning';
        return 'primary';
    };

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-24 rounded mb-1" />
                            <Skeleton className="h-3 w-16 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-2 w-full rounded-full mb-3" />
                    <div className="flex justify-between">
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CircleStackIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                        <p className="text-xs text-default-400">{used_formatted} of {quota_formatted}</p>
                    </div>
                </div>
                
                <Progress
                    value={percentage}
                    color={getProgressColor()}
                    size="sm"
                    className="mb-3"
                    aria-label="Storage usage"
                />
                
                <div className="flex justify-between text-xs text-default-500">
                    <div className="flex items-center gap-1">
                        <DocumentIcon className="w-3 h-3" />
                        <span>{document_count} documents</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FolderIcon className="w-3 h-3" />
                        <span>{folder_count} folders</span>
                    </div>
                </div>
                
                {percentage >= 90 && (
                    <div className="mt-3 p-2 rounded bg-danger/10 text-danger text-xs">
                        ⚠️ Storage almost full. Consider upgrading your plan.
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
