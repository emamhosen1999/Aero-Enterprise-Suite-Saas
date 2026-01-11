import React, { useMemo, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Skeleton,
    Tooltip
} from '@heroui/react';
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    GiftIcon,
    HeartIcon
} from '@heroicons/react/24/outline';

const statusColorMap = {
    active: 'success',
    pending: 'warning',
    expired: 'danger',
    cancelled: 'default'
};

const typeIcons = {
    health: HeartIcon,
    dental: HeartIcon,
    vision: HeartIcon,
    life: HeartIcon,
    retirement: GiftIcon,
    disability: HeartIcon,
    wellness: HeartIcon,
    transport: GiftIcon,
    education: GiftIcon,
    other: GiftIcon
};

const enrollmentColumns = [
    { uid: 'employee', name: 'Employee', sortable: true },
    { uid: 'plan', name: 'Benefit Plan', sortable: true },
    { uid: 'coverage', name: 'Coverage', sortable: true },
    { uid: 'cost', name: 'Monthly Cost', sortable: true },
    { uid: 'status', name: 'Status', sortable: true },
    { uid: 'dates', name: 'Period', sortable: true },
    { uid: 'actions', name: 'Actions' }
];

const planColumns = [
    { uid: 'name', name: 'Plan Name', sortable: true },
    { uid: 'type', name: 'Type', sortable: true },
    { uid: 'coverage', name: 'Coverage', sortable: true },
    { uid: 'cost', name: 'Monthly Cost', sortable: true },
    { uid: 'enrollees', name: 'Enrollees', sortable: true },
    { uid: 'status', name: 'Status', sortable: true },
    { uid: 'actions', name: 'Actions' }
];

export default function BenefitsTable({
    data = [],
    loading = false,
    mode = 'enrollments',
    permissions = {},
    onView,
    onEdit,
    onDelete,
    onApprove
}) {
    const columns = mode === 'plans' ? planColumns : enrollmentColumns;

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <Avatar
                            name={item.employee?.name || 'N/A'}
                            size="sm"
                            src={item.employee?.avatar}
                            className="shrink-0"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.employee?.name || 'N/A'}</span>
                            {item.employee?.department && (
                                <span className="text-xs text-default-400">{item.employee.department}</span>
                            )}
                        </div>
                    </div>
                );

            case 'name':
                const TypeIcon = typeIcons[item.type] || GiftIcon;
                return (
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <TypeIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            {item.provider && (
                                <span className="text-xs text-default-400">{item.provider}</span>
                            )}
                        </div>
                    </div>
                );

            case 'plan':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{item.plan?.name || 'N/A'}</span>
                        <Chip size="sm" variant="flat" className="mt-1">
                            {item.plan?.type || item.type || 'N/A'}
                        </Chip>
                    </div>
                );

            case 'type':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        className="capitalize"
                    >
                        {item.type?.replace('_', ' ') || 'N/A'}
                    </Chip>
                );

            case 'coverage':
                return (
                    <span className="text-sm font-medium">
                        ${(item.coverage_amount || 0).toLocaleString()}
                    </span>
                );

            case 'cost':
                return (
                    <span className="text-sm">
                        ${(item.monthly_cost || item.employee_cost || 0).toLocaleString()}/mo
                    </span>
                );

            case 'enrollees':
                return (
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{item.enrollee_count || 0}</span>
                        <span className="text-xs text-default-400">enrolled</span>
                    </div>
                );

            case 'status':
                return (
                    <Chip
                        color={statusColorMap[item.status] || 'default'}
                        size="sm"
                        variant="flat"
                        className="capitalize"
                    >
                        {item.status || 'N/A'}
                    </Chip>
                );

            case 'dates':
                return (
                    <div className="flex flex-col text-xs">
                        <span>Start: {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</span>
                        <span className="text-default-400">
                            End: {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'Ongoing'}
                        </span>
                    </div>
                );

            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Tooltip content="View">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => onView?.(item)}
                            >
                                <EyeIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        
                        {(permissions.canEdit || permissions.canDelete || permissions.canApprove) && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Benefit actions">
                                    {permissions.canEdit && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit?.(item)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {permissions.canApprove && item.status === 'pending' && (
                                        <DropdownItem
                                            key="approve"
                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                            color="success"
                                            onPress={() => onApprove?.(item)}
                                        >
                                            Approve
                                        </DropdownItem>
                                    )}
                                    {permissions.canDelete && (
                                        <DropdownItem
                                            key="delete"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            color="danger"
                                            className="text-danger"
                                            onPress={() => onDelete?.(item)}
                                        >
                                            Delete
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                );

            default:
                return item[columnKey];
        }
    }, [permissions, onView, onEdit, onDelete, onApprove]);

    const renderSkeletonRow = useCallback((index) => (
        <TableRow key={`skeleton-${index}`}>
            {columns.map((col) => (
                <TableCell key={col.uid}>
                    <Skeleton className="h-4 w-24 rounded" />
                </TableCell>
            ))}
        </TableRow>
    ), [columns]);

    return (
        <Table
            aria-label="Benefits table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody 
                items={loading ? [] : data} 
                emptyContent={loading ? ' ' : `No ${mode === 'plans' ? 'benefit plans' : 'enrollments'} found`}
                loadingContent={
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => renderSkeletonRow(i))}
                    </div>
                }
                isLoading={loading}
            >
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
