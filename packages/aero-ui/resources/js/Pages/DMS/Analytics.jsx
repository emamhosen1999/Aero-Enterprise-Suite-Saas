import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import {
    ArrowTrendingUpIcon,
    ChartBarIcon,
    DocumentTextIcon,
    EyeIcon,
    FolderIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';

const Analytics = ({ statistics = {}, recentActivity = [] }) => {
    const { auth } = usePage().props;

    const statsSection = [
        { 
            title: 'Total Documents', 
            value: statistics.total_documents || 0, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: 'text-primary', 
            iconBg: 'bg-primary/20' 
        },
        { 
            title: 'My Documents', 
            value: statistics.my_documents || 0, 
            icon: <FolderIcon className="w-6 h-6" />, 
            color: 'text-warning', 
            iconBg: 'bg-warning/20' 
        },
        { 
            title: 'Shared With Me', 
            value: statistics.shared_with_me || 0, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: 'text-secondary', 
            iconBg: 'bg-secondary/20' 
        },
        { 
            title: 'Pending Approval', 
            value: statistics.pending_approval || 0, 
            icon: <EyeIcon className="w-6 h-6" />, 
            color: 'text-success', 
            iconBg: 'bg-success/20' 
        },
    ];

    const activityColumns = [
        { uid: 'document', name: 'Document' },
        { uid: 'action', name: 'Action' },
        { uid: 'user', name: 'User' },
        { uid: 'timestamp', name: 'Time' },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getActionColor = (action) => {
        const colorMap = {
            'viewed': 'primary',
            'downloaded': 'success',
            'uploaded': 'secondary',
            'edited': 'warning',
            'deleted': 'danger',
            'shared': 'primary',
        };
        return colorMap[action?.toLowerCase()] || 'default';
    };

    const renderActivityCell = (item, columnKey) => {
        switch (columnKey) {
            case 'document':
                return (
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-default-400" />
                        <span className="text-sm font-medium">{item.document_title || 'Unknown'}</span>
                    </div>
                );
            case 'action':
                return (
                    <Chip size="sm" variant="flat" color={getActionColor(item.action)}>
                        {item.action}
                    </Chip>
                );
            case 'user':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-default-200 flex items-center justify-center">
                            <UserGroupIcon className="w-3 h-3 text-default-500" />
                        </div>
                        <span className="text-sm">{item.user_name || 'Unknown'}</span>
                    </div>
                );
            case 'timestamp':
                return (
                    <span className="text-sm text-default-500">{formatDate(item.created_at)}</span>
                );
            default:
                return item[columnKey];
        }
    };

    const contentSection = (
        <div className="space-y-6">
            {/* Recent Activity Section */}
            <Card className="border border-divider">
                <CardHeader className="border-b border-divider px-4 py-3">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                </CardHeader>
                <CardBody className="p-0">
                    <Table
                        aria-label="Recent activity table"
                        removeWrapper
                        classNames={{
                            th: "bg-default-50 text-default-600 font-semibold",
                            td: "py-3"
                        }}
                    >
                        <TableHeader columns={activityColumns}>
                            {(column) => (
                                <TableColumn key={column.uid}>
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={recentActivity || []} emptyContent="No recent activity.">
                            {(item) => (
                                <TableRow key={item.id || Math.random()}>
                                    {(columnKey) => (
                                        <TableCell>{renderActivityCell(item, columnKey)}</TableCell>
                                    )}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Storage Usage */}
            <Card className="border border-divider">
                <CardHeader className="border-b border-divider px-4 py-3">
                    <h3 className="text-lg font-semibold">Storage Usage</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-default-600">Used Storage</span>
                                <span className="text-sm font-medium">
                                    {statistics.storage_used || '0 MB'} / {statistics.storage_limit || 'Unlimited'}
                                </span>
                            </div>
                            <div className="w-full bg-default-100 rounded-full h-2">
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all" 
                                    style={{ width: `${statistics.storage_percentage || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );

    return (
        <>
            <Head title="Document Analytics" />
            <StandardPageLayout
                title="Document Analytics"
                subtitle="Document usage statistics and insights"
                icon={<ChartBarIcon className="w-8 h-8" />}
                stats={<StatsCards stats={statsSection} />}
                content={contentSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Analytics' },
                ]}
            />
        </>
    );
};

export default Analytics;
