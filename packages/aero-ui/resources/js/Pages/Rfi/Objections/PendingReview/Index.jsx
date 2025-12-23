import React, { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import App from '@/Layouts/App';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    User as UserAvatar,
} from '@heroui/react';
import {
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

const statusColorMap = {
    open: 'warning',
    in_review: 'primary',
    resolved: 'success',
    rejected: 'danger',
};

const PendingReviewIndex = ({
    auth,
    title = 'Pending Review',
    objections = { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
    statusLabels = {},
    categoryLabels = {},
}) => {
    const handlePageChange = useCallback((page) => {
        router.get(route('rfi.objections.review.pending'), { page }, { 
            preserveState: true, 
            preserveScroll: true 
        });
    }, []);

    const handleView = (objection) => {
        router.visit(route('rfi.objections.show', objection.id));
    };

    const handleStartReview = (objection) => {
        router.post(route('rfi.objections.start-review', objection.id), {}, {
            onSuccess: () => showToast.success('Review started'),
            onError: () => showToast.error('Failed to start review'),
        });
    };

    const handleResolve = (objection) => {
        router.post(route('rfi.objections.resolve', objection.id), {}, {
            onSuccess: () => showToast.success('Objection resolved'),
            onError: () => showToast.error('Failed to resolve'),
        });
    };

    const handleReject = (objection) => {
        router.post(route('rfi.objections.reject', objection.id), {}, {
            onSuccess: () => showToast.success('Objection rejected'),
            onError: () => showToast.error('Failed to reject'),
        });
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'created_by', label: 'Submitted By' },
        { key: 'created_at', label: 'Submitted' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = useCallback((objection, columnKey) => {
        switch (columnKey) {
            case 'id':
                return <span className="font-mono text-sm">#{objection.id}</span>;
            case 'title':
                return (
                    <div className="max-w-xs">
                        <p className="font-medium truncate">{objection.title}</p>
                    </div>
                );
            case 'category':
                return (
                    <Chip size="sm" variant="flat">
                        {categoryLabels[objection.category] || objection.category}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={statusColorMap[objection.status] || 'default'}
                    >
                        {statusLabels[objection.status] || objection.status}
                    </Chip>
                );
            case 'created_by':
                return objection.created_by_user ? (
                    <UserAvatar
                        name={objection.created_by_user.name}
                        avatarProps={{ size: 'sm' }}
                    />
                ) : '-';
            case 'created_at':
                return new Date(objection.created_at).toLocaleDateString();
            case 'actions':
                return (
                    <div className="flex gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => handleView(objection)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {objection.status === 'open' && (
                            <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                startContent={<ClockIcon className="w-4 h-4" />}
                                onPress={() => handleStartReview(objection)}
                            >
                                Start
                            </Button>
                        )}
                        {objection.status === 'in_review' && (
                            <>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="success"
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleResolve(objection)}
                                >
                                    Resolve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    startContent={<XCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleReject(objection)}
                                >
                                    Reject
                                </Button>
                            </>
                        )}
                    </div>
                );
            default:
                return objection[columnKey];
        }
    }, [categoryLabels, statusLabels]);

    return (
        <App auth={auth}>
            <Head title={title} />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-default-500">
                        Review and process pending objections
                    </p>
                </div>

                {/* Table */}
                <Card className="aero-card">
                    <CardHeader className="border-b border-divider p-4">
                        <div className="flex items-center justify-between w-full">
                            <h3 className="text-lg font-semibold">Pending Objections</h3>
                            <Chip color="warning" variant="flat">
                                {objections.meta?.total || 0} Pending
                            </Chip>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        <Table
                            aria-label="Pending objections"
                            classNames={{
                                wrapper: 'shadow-none',
                                th: 'bg-default-100 text-default-600 font-semibold',
                                td: 'py-3',
                            }}
                        >
                            <TableHeader columns={columns}>
                                {(column) => (
                                    <TableColumn key={column.key}>
                                        {column.label}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody
                                items={objections.data || []}
                                emptyContent="No pending objections"
                            >
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => (
                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                        )}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {objections.meta && objections.meta.last_page > 1 && (
                            <div className="flex justify-center py-4 border-t border-divider">
                                <Pagination
                                    total={objections.meta.last_page}
                                    page={objections.meta.current_page}
                                    onChange={handlePageChange}
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </App>
    );
};

export default PendingReviewIndex;
