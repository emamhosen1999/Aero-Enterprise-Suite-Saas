import React, { useState } from 'react';
import { 
    PencilIcon, 
    TrashIcon, 
    EyeIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { 
    Button, 
    Chip, 
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    User,
    Spinner
} from '@heroui/react';
import dayjs from 'dayjs';

const PerformanceReviewsTable = ({ data, loading, permissions, onView, onEdit, onDelete, onApprove }) => {
    const getStatusChip = (status) => {
        switch (status) {
            case 'draft':
                return (
                    <Chip 
                        variant="flat" 
                        color="default" 
                        size="sm"
                        startContent={<DocumentTextIcon className="w-4 h-4" />}
                    >
                        Draft
                    </Chip>
                );
            case 'pending':
                return (
                    <Chip 
                        variant="flat" 
                        color="warning" 
                        size="sm"
                        startContent={<ClockIcon className="w-4 h-4" />}
                    >
                        Pending
                    </Chip>
                );
            case 'in_progress':
                return (
                    <Chip 
                        variant="flat" 
                        color="primary" 
                        size="sm"
                        startContent={<ClockIcon className="w-4 h-4" />}
                    >
                        In Progress
                    </Chip>
                );
            case 'completed':
                return (
                    <Chip 
                        variant="flat" 
                        color="success" 
                        size="sm"
                        startContent={<CheckCircleIcon className="w-4 h-4" />}
                    >
                        Completed
                    </Chip>
                );
            case 'approved':
                return (
                    <Chip 
                        variant="flat" 
                        color="secondary" 
                        size="sm"
                        startContent={<CheckCircleIcon className="w-4 h-4" />}
                    >
                        Approved
                    </Chip>
                );
            case 'rejected':
                return (
                    <Chip 
                        variant="flat" 
                        color="danger" 
                        size="sm"
                    >
                        Rejected
                    </Chip>
                );
            default:
                return (
                    <Chip 
                        variant="flat" 
                        color="default" 
                        size="sm"
                    >
                        {status}
                    </Chip>
                );
        }
    };

    const columns = [
        { name: "Employee", uid: "employee" },
        { name: "Review Type", uid: "review_type" },
        { name: "Period", uid: "period" },
        { name: "Status", uid: "status" },
        { name: "Reviewer", uid: "reviewer" },
        { name: "Score", uid: "score" },
        { name: "Actions", uid: "actions" }
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "employee":
                return (
                    <User 
                        name={item.employee?.name}
                        description={item.employee?.designation?.name}
                        avatarProps={{
                            src: item.employee?.avatar,
                            name: item.employee?.name,
                            size: "sm"
                        }}
                    />
                );
            case "review_type":
                return item.template?.name || item.review_type;
            case "period":
                return item.review_period ? dayjs(item.review_period).format('MMM YYYY') : 'N/A';
            case "status":
                return getStatusChip(item.status);
            case "reviewer":
                return item.reviewer?.name || 'N/A';
            case "score":
                return item.score || 'N/A';
            case "actions":
                return (
                    <div className="relative flex items-center justify-end">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    aria-label="More actions"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                {permissions.includes('performance-reviews.view') && (
                                    <DropdownItem
                                        key="view"
                                        startContent={<EyeIcon className="w-4 h-4" />}
                                        onPress={() => onView(item)}
                                    >
                                        View Details
                                    </DropdownItem>
                                )}
                                
                                {permissions.includes('performance-reviews.update') && item.status !== 'completed' && (
                                    <DropdownItem
                                        key="edit"
                                        startContent={<PencilIcon className="w-4 h-4" />}
                                        onPress={() => onEdit(item)}
                                    >
                                        Edit Review
                                    </DropdownItem>
                                )}
                                
                                {permissions.includes('performance-reviews.approve') && item.status === 'pending' && (
                                    <DropdownItem
                                        key="approve"
                                        startContent={<CheckCircleIcon className="w-4 h-4" />}
                                        onPress={() => onApprove(item)}
                                    >
                                        Approve/Finalize
                                    </DropdownItem>
                                )}
                                
                                {permissions.includes('performance-reviews.delete') && item.status !== 'completed' && (
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => onDelete(item)}
                                    >
                                        Delete
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return item[columnKey];
        }
    };
    
    return (
        <div className="w-full">
            <Table
                aria-label="Performance Reviews Table"
                classNames={{
                    wrapper: "glass-table",
                    th: "bg-transparent",
                    td: "group-data-[hover=true]:bg-default-50",
                }}
                isStriped
                removeWrapper
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn 
                            key={column.uid} 
                            align={column.uid === "actions" ? "end" : "start"}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody 
                    items={data} 
                    isLoading={loading}
                    loadingContent={<Spinner label="Loading..." />}
                    emptyContent="No performance reviews found"
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
        </div>
    );
};

export default PerformanceReviewsTable;
