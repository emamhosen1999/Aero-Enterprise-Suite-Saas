import React from 'react';
import { Card, CardBody, CardHeader, Skeleton, Chip, Button } from '@heroui/react';
import { DocumentTextIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Recent Documents Widget
 * 
 * Displays recently uploaded or modified documents.
 */
export default function RecentDocumentsWidget({ 
    documents = [], 
    total = 0, 
    show_more_url = '/dms/documents',
    title = 'Recent Documents',
    limit = 5,
    isLoading = false 
}) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) return '📄';
        if (mimeType?.includes('image')) return '🖼️';
        if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊';
        if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
        return '📁';
    };

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="border-b border-divider px-4 py-3">
                    <Skeleton className="h-5 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded" />
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
                    <DocumentTextIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold">{title}</h3>
                    {total > 0 && (
                        <Chip size="sm" variant="flat" color="primary">{total}</Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {documents.length === 0 ? (
                    <div className="text-center py-8 text-default-400">
                        <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No recent documents</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {documents.slice(0, limit).map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/dms/documents/${doc.id}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-100 transition-colors"
                            >
                                <div className="w-10 h-10 rounded bg-default-100 flex items-center justify-center text-xl">
                                    {getFileIcon(doc.mime_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-default-400">
                                        <ClockIcon className="w-3 h-3" />
                                        <span>{formatDate(doc.updated_at)}</span>
                                        {doc.folder && (
                                            <>
                                                <span>•</span>
                                                <span>{doc.folder.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                
                {total > limit && (
                    <div className="mt-4 pt-3 border-t border-divider">
                        <Button
                            as={Link}
                            href={show_more_url}
                            variant="light"
                            color="primary"
                            size="sm"
                            className="w-full"
                            endContent={<ArrowRightIcon className="w-4 h-4" />}
                        >
                            View All Documents
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
