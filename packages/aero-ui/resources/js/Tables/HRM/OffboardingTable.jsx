import React, { useCallback } from 'react';
import {
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Skeleton,
    User,
    Tooltip
} from "@heroui/react";
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    DocumentCheckIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import dayjs from 'dayjs';

// Status color mapping
const statusColorMap = {
    pending: "warning",
    in_progress: "primary",
    completed: "success",
    cancelled: "danger"
};

// Status label mapping
const statusLabelMap = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled"
};

// Reason type color mapping
const reasonColorMap = {
    resignation: "primary",
    termination: "danger",
    retirement: "success",
    contract_end: "warning",
    layoff: "danger",
    other: "default"
};

// Reason label mapping
const reasonLabelMap = {
    resignation: "Resignation",
    termination: "Termination",
    retirement: "Retirement",
    contract_end: "Contract End",
    layoff: "Layoff",
    other: "Other"
};

const columns = [
    { name: "EMPLOYEE", uid: "employee" },
    { name: "DEPARTMENT", uid: "department" },
    { name: "INITIATION DATE", uid: "initiation_date" },
    { name: "LAST WORKING DAY", uid: "last_working_day" },
    { name: "REASON", uid: "reason" },
    { name: "STATUS", uid: "status" },
    { name: "ACTIONS", uid: "actions" }
];

const OffboardingTable = ({
    offboardings = [],
    loading = false,
    onView,
    onEdit,
    onDelete,
    onComplete,
    onGenerateClearance,
    canEdit = false,
    canDelete = false,
    canManage = false
}) => {
    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "employee":
                return (
                    <User
                        name={item.employee?.user?.name || item.employee?.name || 'N/A'}
                        description={item.employee?.employee_code || item.employee?.designation?.name || ''}
                        avatarProps={{
                            src: item.employee?.user?.avatar || item.employee?.avatar,
                            size: "sm"
                        }}
                    />
                );
            case "department":
                return (
                    <span className="text-sm text-default-600">
                        {item.employee?.department?.name || item.department?.name || '-'}
                    </span>
                );
            case "initiation_date":
                return (
                    <span className="text-sm text-default-600">
                        {item.initiation_date ? dayjs(item.initiation_date).format('MMM D, YYYY') : '-'}
                    </span>
                );
            case "last_working_day":
                const lastDay = item.last_working_day || item.exit_date;
                const daysRemaining = lastDay ? dayjs(lastDay).diff(dayjs(), 'day') : null;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm text-default-600">
                            {lastDay ? dayjs(lastDay).format('MMM D, YYYY') : '-'}
                        </span>
                        {daysRemaining !== null && daysRemaining >= 0 && item.status !== 'completed' && (
                            <span className="text-xs text-default-400">
                                {daysRemaining === 0 ? 'Today' : `${daysRemaining} days remaining`}
                            </span>
                        )}
                    </div>
                );
            case "reason":
                const reason = item.reason?.toLowerCase().replace(/\s/g, '_') || 'other';
                return (
                    <Chip
                        color={reasonColorMap[reason] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {reasonLabelMap[reason] || item.reason || 'Other'}
                    </Chip>
                );
            case "status":
                return (
                    <Chip
                        color={statusColorMap[item.status] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {statusLabelMap[item.status] || item.status}
                    </Chip>
                );
            case "actions":
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Offboarding Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => onView?.(item)}
                            >
                                View Details
                            </DropdownItem>
                            {canManage && item.status !== 'completed' && (
                                <DropdownItem 
                                    key="clearance" 
                                    startContent={<DocumentCheckIcon className="w-4 h-4" />}
                                    onPress={() => onGenerateClearance?.(item)}
                                >
                                    Generate Clearance
                                </DropdownItem>
                            )}
                            {canManage && item.status === 'in_progress' && (
                                <DropdownItem 
                                    key="complete" 
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    color="success"
                                    onPress={() => onComplete?.(item)}
                                >
                                    Complete Offboarding
                                </DropdownItem>
                            )}
                            {canEdit && item.status !== 'completed' && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => onEdit?.(item)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger" 
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => onDelete?.(item)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    }, [onView, onEdit, onDelete, onComplete, onGenerateClearance, canEdit, canDelete, canManage]);

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border border-divider rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3 rounded" />
                            <Skeleton className="h-3 w-1/4 rounded" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded" />
                        <Skeleton className="h-6 w-16 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Table
            aria-label="Offboarding table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody items={offboardings} emptyContent="No offboarding processes found">
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => (
                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default OffboardingTable;
