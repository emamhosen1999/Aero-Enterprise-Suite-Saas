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
    ArrowRightCircleIcon,
    ArrowLeftCircleIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";

const statusColorMap = {
    available: "success",
    allocated: "primary",
    maintenance: "warning",
    retired: "default",
    lost: "danger",
};

const AssetsTable = ({
    assets = [],
    loading = false,
    onEdit,
    onDelete,
    onAllocate,
    onReturn,
    onView,
    canEdit = false,
    canDelete = false,
    canAllocate = false,
}) => {
    const columns = [
        { key: "asset_tag", label: "ASSET TAG" },
        { key: "name", label: "NAME" },
        { key: "category", label: "CATEGORY" },
        { key: "serial_number", label: "SERIAL #" },
        { key: "status", label: "STATUS" },
        { key: "allocated_to", label: "ALLOCATED TO" },
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (asset, columnKey) => {
        switch (columnKey) {
            case "asset_tag":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{asset.asset_tag}</p>
                        {asset.qr_code && (
                            <p className="text-xs text-default-400">QR: {asset.qr_code}</p>
                        )}
                    </div>
                );
            case "name":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{asset.name}</p>
                    </div>
                );
            case "category":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{asset.category?.name}</p>
                    </div>
                );
            case "serial_number":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{asset.serial_number || '-'}</p>
                    </div>
                );
            case "status":
                return (
                    <Chip
                        color={statusColorMap[asset.status] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {asset.status?.toUpperCase()}
                    </Chip>
                );
            case "allocated_to":
                return (
                    <div className="flex flex-col">
                        {asset.current_allocation ? (
                            <>
                                <p className="text-sm font-semibold">{asset.current_allocation.employee?.name}</p>
                                <p className="text-xs text-default-400">
                                    Since {new Date(asset.current_allocation.allocated_at).toLocaleDateString()}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-default-400">-</p>
                        )}
                    </div>
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
                                    onPress={() => onView(asset)}
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        {canAllocate && (
                            <>
                                {asset.status === 'available' && (
                                    <Tooltip content="Allocate">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="primary"
                                            onPress={() => onAllocate(asset)}
                                        >
                                            <ArrowRightCircleIcon className="w-4 h-4" />
                                        </Button>
                                    </Tooltip>
                                )}
                                {asset.status === 'allocated' && (
                                    <Tooltip content="Return">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="success"
                                            onPress={() => onReturn(asset)}
                                        >
                                            <ArrowLeftCircleIcon className="w-4 h-4" />
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
                                    {canEdit && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit(asset)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {canDelete && asset.status !== 'allocated' && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => onDelete(asset)}
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
                return asset[columnKey];
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
            aria-label="Assets table"
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
            <TableBody items={assets} emptyContent="No assets found">
                {(asset) => (
                    <TableRow key={asset.id}>
                        {(columnKey) => (
                            <TableCell>{renderCell(asset, columnKey)}</TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default AssetsTable;
