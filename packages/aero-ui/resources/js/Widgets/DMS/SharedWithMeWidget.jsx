import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Avatar, Skeleton } from '@heroui/react';
import { ShareIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Shared With Me Widget
 * 
 * Displays documents that have been shared with the current user.
 */
export default function SharedWithMeWidget({
    documents = [],
    count = 0,
    view_all_url = '/dms/shared',
    title = 'Shared With Me',
    limit = 5,
    isLoading = false
}) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getPermissionLabel = (permission) => {
        switch (permission) {
            case 'edit': return { label: 'Can Edit', color: 'success' };
            case 'comment': return { label: 'Can Comment', color: 'primary' };
            case 'view': return { label: 'View Only', color: 'default' };
            default: return { label: 'View', color: 'default' };
        }
    };

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="border-b border-divider px-4 py-3">
                    <Skeleton className="h-5 w-36 rounded" />
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
                    <UserGroupIcon className="w-5 h-5 text-secondary" />
                    <h3 className="text-base font-semibold">{title}</h3>
                    {count > 0 && (
                        <Chip size="sm" variant="flat" color="secondary">{count}</Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {documents.length === 0 ? (
                    <div className="text-center py-6 text-default-400">
                        <ShareIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No shared documents</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {documents.slice(0, limit).map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/dms/documents/${doc.id}`}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-default-100 transition-colors"
                            >
                                <Avatar
                                    name={doc.shared_by?.name || 'U'}
                                    size="sm"
                                    className="flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                    <p className="text-xs text-default-400">
                                        Shared by {doc.shared_by?.name} • {formatDate(doc.shared_at)}
                                    </p>
                                    {doc.permission && (
                                        <Chip
                                            size="sm"
                                            variant="dot"
                                            color={getPermissionLabel(doc.permission).color}
                                            className="mt-1"
                                        >
                                            {getPermissionLabel(doc.permission).label}
                                        </Chip>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                
                {count > limit && (
                    <div className="mt-3 pt-3 border-t border-divider">
                        <Button
                            as={Link}
                            href={view_all_url}
                            variant="light"
                            color="secondary"
                            size="sm"
                            className="w-full"
                            endContent={<ArrowRightIcon className="w-4 h-4" />}
                        >
                            View All Shared
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
