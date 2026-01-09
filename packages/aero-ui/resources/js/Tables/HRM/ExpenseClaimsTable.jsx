import React, { useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Chip,
    Tooltip,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Spinner,
} from "@heroui/react";
import {
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";

const statusColorMap = {
    draft: "default",
    submitted: "primary",
    pending: "warning",
    approved: "success",
    rejected: "danger",
    paid: "success",
    cancelled: "default",
};

const ExpenseClaimsTable = ({
    claims = [],
    loading = false,
    onEdit,
    onDelete,
    onApprove,
    onReject,
    onView,
    canEdit = false,
    canDelete = false,
    canApprove = false,
}) => {
    const columns = [
        { key: "claim_number", label: "CLAIM #" },
        { key: "employee", label: "EMPLOYEE" },
        { key: "category", label: "CATEGORY" },
        { key: "amount", label: "AMOUNT" },
        { key: "claim_date", label: "DATE" },
        { key: "status", label: "STATUS" },
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (claim, columnKey) => {
        switch (columnKey) {
            case "claim_number":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{claim.claim_number}</p>
                    </div>
                );
            case "employee":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{claim.employee?.name}</p>
                        <p className="text-xs text-default-400">{claim.employee?.email}</p>
                    </div>
                );
            case "category":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{claim.category?.name}</p>
                    </div>
                );
            case "amount":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">${parseFloat(claim.amount).toFixed(2)}</p>
                    </div>
                );
            case "claim_date":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{new Date(claim.claim_date).toLocaleDateString()}</p>
                    </div>
                );
            case "status":
                return (
                    <Chip
                        color={statusColorMap[claim.status] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {claim.status?.toUpperCase()}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        {onView && (
                            <Tooltip content="View">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => onView(claim)}
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        {canApprove && claim.status === 'pending' && (
                            <>
                                <Tooltip content="Approve">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="success"
                                        onPress={() => onApprove(claim)}
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Reject">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => onReject(claim)}
                                    >
                                        <XCircleIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                        {(canEdit || canDelete) && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Actions">
                                    {canEdit && claim.status === 'draft' && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit(claim)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {canDelete && claim.status === 'draft' && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => onDelete(claim)}
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
                return claim[columnKey];
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <Table
            aria-label="Expense claims table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3",
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
            </TableHeader>
            <TableBody items={claims} emptyContent="No expense claims found">
                {(claim) => (
                    <TableRow key={claim.id}>
                        {(columnKey) => (
                            <TableCell>{renderCell(claim, columnKey)}</TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default ExpenseClaimsTable;
