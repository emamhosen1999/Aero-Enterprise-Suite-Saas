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
    MagnifyingGlassIcon,
    DocumentCheckIcon,
    XCircleIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";

const statusColorMap = {
    pending: "warning",
    investigating: "primary",
    action_taken: "success",
    closed: "default",
    dismissed: "default",
};

const severityColorMap = {
    minor: "success",
    moderate: "warning",
    major: "danger",
    critical: "danger",
};

const DisciplinaryCasesTable = ({
    cases = [],
    loading = false,
    onEdit,
    onDelete,
    onStartInvestigation,
    onTakeAction,
    onClose,
    onView,
    canEdit = false,
    canDelete = false,
    canManage = false,
}) => {
    const columns = [
        { key: "case_number", label: "CASE #" },
        { key: "employee", label: "EMPLOYEE" },
        { key: "action_type", label: "ACTION TYPE" },
        { key: "severity", label: "SEVERITY" },
        { key: "incident_date", label: "INCIDENT DATE" },
        { key: "status", label: "STATUS" },
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (caseItem, columnKey) => {
        switch (columnKey) {
            case "case_number":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{caseItem.case_number}</p>
                    </div>
                );
            case "employee":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{caseItem.employee?.name}</p>
                        <p className="text-xs text-default-400">{caseItem.employee?.email}</p>
                    </div>
                );
            case "action_type":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{caseItem.action_type?.name}</p>
                    </div>
                );
            case "severity":
                return (
                    <Chip
                        color={severityColorMap[caseItem.action_type?.severity] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {caseItem.action_type?.severity?.toUpperCase()}
                    </Chip>
                );
            case "incident_date":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{new Date(caseItem.incident_date).toLocaleDateString()}</p>
                    </div>
                );
            case "status":
                return (
                    <Chip
                        color={statusColorMap[caseItem.status] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {caseItem.status?.replace('_', ' ').toUpperCase()}
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
                                    onPress={() => onView(caseItem)}
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        {canManage && (
                            <>
                                {caseItem.status === 'pending' && (
                                    <Tooltip content="Start Investigation">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="primary"
                                            onPress={() => onStartInvestigation(caseItem)}
                                        >
                                            <MagnifyingGlassIcon className="w-4 h-4" />
                                        </Button>
                                    </Tooltip>
                                )}
                                {caseItem.status === 'investigating' && (
                                    <Tooltip content="Take Action">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="success"
                                            onPress={() => onTakeAction(caseItem)}
                                        >
                                            <DocumentCheckIcon className="w-4 h-4" />
                                        </Button>
                                    </Tooltip>
                                )}
                                {caseItem.status === 'action_taken' && (
                                    <Tooltip content="Close Case">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="default"
                                            onPress={() => onClose(caseItem)}
                                        >
                                            <XCircleIcon className="w-4 h-4" />
                                        </Button>
                                    </Tooltip>
                                )}
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
                                    {canEdit && caseItem.status === 'pending' && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit(caseItem)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {canDelete && caseItem.status === 'pending' && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => onDelete(caseItem)}
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
                return caseItem[columnKey];
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
            aria-label="Disciplinary cases table"
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
            <TableBody items={cases} emptyContent="No disciplinary cases found">
                {(caseItem) => (
                    <TableRow key={caseItem.id}>
                        {(columnKey) => (
                            <TableCell>{renderCell(caseItem, columnKey)}</TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default DisciplinaryCasesTable;
