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
    Progress,
    User
} from "@heroui/react";
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    PlayCircleIcon,
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

const columns = [
    { name: "EMPLOYEE", uid: "employee" },
    { name: "START DATE", uid: "start_date" },
    { name: "DEPARTMENT", uid: "department" },
    { name: "MENTOR", uid: "mentor" },
    { name: "PROGRESS", uid: "progress" },
    { name: "STATUS", uid: "status" },
    { name: "ACTIONS", uid: "actions" }
];

const OnboardingTable = ({
    onboardings = [],
    loading = false,
    onView,
    onEdit,
    onDelete,
    onStart,
    onComplete,
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
            case "start_date":
                return (
                    <span className="text-sm text-default-600">
                        {item.start_date ? dayjs(item.start_date).format('MMM D, YYYY') : '-'}
                    </span>
                );
            case "department":
                return (
                    <span className="text-sm text-default-600">
                        {item.employee?.department?.name || item.department?.name || '-'}
                    </span>
                );
            case "mentor":
                return item.mentor ? (
                    <User
                        name={item.mentor?.user?.name || item.mentor?.name || 'N/A'}
                        avatarProps={{
                            src: item.mentor?.user?.avatar || item.mentor?.avatar,
                            size: "sm"
                        }}
                    />
                ) : (
                    <span className="text-sm text-default-400">Not assigned</span>
                );
            case "progress":
                const completedTasks = item.tasks_completed || 0;
                const totalTasks = item.tasks_total || 1;
                const progressPercent = Math.round((completedTasks / totalTasks) * 100);
                return (
                    <div className="flex flex-col gap-1">
                        <Progress 
                            value={progressPercent}
                            size="sm"
                            color={progressPercent === 100 ? "success" : "primary"}
                            className="max-w-[100px]"
                        />
                        <span className="text-xs text-default-400">
                            {completedTasks} / {totalTasks} tasks
                        </span>
                    </div>
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
                        <DropdownMenu aria-label="Onboarding Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => onView?.(item)}
                            >
                                View Details
                            </DropdownItem>
                            {canManage && item.status === 'pending' && (
                                <DropdownItem 
                                    key="start" 
                                    startContent={<PlayCircleIcon className="w-4 h-4" />}
                                    color="primary"
                                    onPress={() => onStart?.(item)}
                                >
                                    Start Onboarding
                                </DropdownItem>
                            )}
                            {canManage && item.status === 'in_progress' && (
                                <DropdownItem 
                                    key="complete" 
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    color="success"
                                    onPress={() => onComplete?.(item)}
                                >
                                    Mark Complete
                                </DropdownItem>
                            )}
                            {canEdit && (
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
    }, [onView, onEdit, onDelete, onStart, onComplete, canEdit, canDelete, canManage]);

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
            aria-label="Onboarding table"
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
            <TableBody items={onboardings} emptyContent="No onboarding processes found">
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

export default OnboardingTable;
