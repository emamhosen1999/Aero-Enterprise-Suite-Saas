import React, { useCallback, useMemo } from 'react';
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
    Progress
} from "@heroui/react";
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    DocumentTextIcon,
    PlayCircleIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import dayjs from 'dayjs';

// Status color mapping
const statusColorMap = {
    open: "success",
    closed: "default",
    draft: "warning",
    paused: "secondary"
};

// Employment type color mapping
const employmentTypeColorMap = {
    full_time: "primary",
    part_time: "secondary",
    contract: "warning",
    internship: "default"
};

const columns = [
    { name: "TITLE", uid: "title" },
    { name: "DEPARTMENT", uid: "department" },
    { name: "TYPE", uid: "employment_type" },
    { name: "POSITIONS", uid: "positions" },
    { name: "APPLICATIONS", uid: "applications_count" },
    { name: "STATUS", uid: "status" },
    { name: "DEADLINE", uid: "deadline" },
    { name: "ACTIONS", uid: "actions" }
];

const RecruitmentTable = ({
    jobs = [],
    loading = false,
    onView,
    onEdit,
    onDelete,
    onPublish,
    onClose,
    onViewApplications,
    canEdit = false,
    canDelete = false,
    canManage = false
}) => {
    const renderCell = useCallback((job, columnKey) => {
        switch (columnKey) {
            case "title":
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-default-900">{job.title}</span>
                        <span className="text-xs text-default-400 line-clamp-1">{job.location || 'Remote'}</span>
                    </div>
                );
            case "department":
                return (
                    <span className="text-sm text-default-600">
                        {job.department?.name || '-'}
                    </span>
                );
            case "employment_type":
                return (
                    <Chip
                        color={employmentTypeColorMap[job.employment_type] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {job.employment_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </Chip>
                );
            case "positions":
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{job.positions_filled || 0} / {job.positions || 1}</span>
                        <Progress 
                            value={(job.positions_filled || 0) / (job.positions || 1) * 100}
                            size="sm"
                            color={job.positions_filled >= job.positions ? "success" : "primary"}
                            className="max-w-[80px]"
                        />
                    </div>
                );
            case "applications_count":
                return (
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => onViewApplications?.(job)}
                        startContent={<DocumentTextIcon className="w-4 h-4" />}
                    >
                        {job.applications_count || 0}
                    </Button>
                );
            case "status":
                return (
                    <Chip
                        color={statusColorMap[job.status] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Draft'}
                    </Chip>
                );
            case "deadline":
                return (
                    <span className={`text-sm ${dayjs(job.deadline).isBefore(dayjs()) ? 'text-danger' : 'text-default-600'}`}>
                        {job.deadline ? dayjs(job.deadline).format('MMM D, YYYY') : '-'}
                    </span>
                );
            case "actions":
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Job Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => onView?.(job)}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="applications" 
                                startContent={<DocumentTextIcon className="w-4 h-4" />}
                                onPress={() => onViewApplications?.(job)}
                            >
                                View Applications ({job.applications_count || 0})
                            </DropdownItem>
                            {canManage && job.status === 'draft' && (
                                <DropdownItem 
                                    key="publish" 
                                    startContent={<PlayCircleIcon className="w-4 h-4" />}
                                    color="success"
                                    onPress={() => onPublish?.(job)}
                                >
                                    Publish
                                </DropdownItem>
                            )}
                            {canManage && job.status === 'open' && (
                                <DropdownItem 
                                    key="close" 
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={() => onClose?.(job)}
                                >
                                    Close Position
                                </DropdownItem>
                            )}
                            {canEdit && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => onEdit?.(job)}
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
                                    onPress={() => onDelete?.(job)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return job[columnKey];
        }
    }, [onView, onEdit, onDelete, onPublish, onClose, onViewApplications, canEdit, canDelete, canManage]);

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border border-divider rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-3 w-1/2 rounded" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded" />
                        <Skeleton className="h-6 w-16 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Table
            aria-label="Recruitment table"
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
            <TableBody items={jobs} emptyContent="No job postings found">
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

export default RecruitmentTable;
