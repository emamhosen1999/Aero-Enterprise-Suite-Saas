import React, { useMemo } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    Pagination,
    Spinner,
    Checkbox,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button
} from "@heroui/react";
import {
    MapPinIcon,
    ShieldCheckIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import { router } from '@inertiajs/react';

/**
 * RfiTable - Data table for RFI list
 * 
 * Features:
 * - GPS validation badges
 * - Permit indicators
 * - Multi-select for bulk operations
 * - Status chips with colors
 * - Responsive actions dropdown
 */
const RfiTable = ({
    rfis = [],
    loading = false,
    pagination = { currentPage: 1, lastPage: 1, total: 0 },
    onPageChange,
    onEdit,
    onDelete,
    selectedRfis = [],
    onSelectionChange,
    canEdit = false,
    canDelete = false,
    canApprove = false
}) => {
    
    const columns = [
        { uid: 'select', name: '', sortable: false },
        { uid: 'number', name: 'RFI Number', sortable: true },
        { uid: 'date', name: 'Date', sortable: true },
        { uid: 'layer', name: 'Layer', sortable: false },
        { uid: 'chainage', name: 'Chainage', sortable: false },
        { uid: 'gps', name: 'GPS', sortable: false },
        { uid: 'permit', name: 'Permit', sortable: false },
        { uid: 'status', name: 'Status', sortable: true },
        { uid: 'actions', name: 'Actions', sortable: false }
    ];

    // Status color mapping
    const statusColorMap = {
        pending: "warning",
        approved: "success",
        rejected: "danger",
        cancelled: "default",
        rfi_submitted: "primary",
        inspection_scheduled: "secondary",
        inspection_completed: "success"
    };

    // GPS validation badge
    const renderGpsBadge = (rfi) => {
        const isValid = rfi.gps_validation_status === 'valid';
        return (
            <Tooltip content={`GPS: ${isValid ? 'Verified' : 'Unverified'} (${rfi.gps_distance_m || 0}m)`}>
                <Chip
                    size="sm"
                    variant="flat"
                    color={isValid ? "success" : "danger"}
                    startContent={<MapPinIcon className="w-3 h-3" />}
                >
                    {isValid ? 'Valid' : 'Invalid'}
                </Chip>
            </Tooltip>
        );
    };

    // Permit status badge
    const renderPermitBadge = (rfi) => {
        if (!rfi.requires_permit) {
            return <Chip size="sm" variant="flat" color="default">N/A</Chip>;
        }
        
        const statusMap = {
            approved: { color: "success", icon: CheckCircleIcon, label: "Approved" },
            pending: { color: "warning", icon: ShieldCheckIcon, label: "Pending" },
            required: { color: "danger", icon: XCircleIcon, label: "Required" }
        };
        
        const status = statusMap[rfi.permit_status] || statusMap.required;
        const Icon = status.icon;
        
        return (
            <Tooltip content={`Work Permit: ${status.label}`}>
                <Chip
                    size="sm"
                    variant="flat"
                    color={status.color}
                    startContent={<Icon className="w-3 h-3" />}
                >
                    {status.label}
                </Chip>
            </Tooltip>
        );
    };

    // Render cell content
    const renderCell = (rfi, columnKey) => {
        switch (columnKey) {
            case 'select':
                return (
                    <Checkbox
                        isSelected={selectedRfis.includes(rfi.id)}
                        onValueChange={(checked) => {
                            if (checked) {
                                onSelectionChange([...selectedRfis, rfi.id]);
                            } else {
                                onSelectionChange(selectedRfis.filter(id => id !== rfi.id));
                            }
                        }}
                        size="sm"
                    />
                );
            
            case 'number':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold">{rfi.number}</span>
                        {rfi.work_location_name && (
                            <span className="text-xs text-default-500">{rfi.work_location_name}</span>
                        )}
                    </div>
                );
            
            case 'date':
                return (
                    <div className="flex flex-col">
                        <span>{new Date(rfi.date).toLocaleDateString()}</span>
                        {rfi.inspection_date && (
                            <span className="text-xs text-default-500">
                                Inspect: {new Date(rfi.inspection_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                );
            
            case 'layer':
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        {rfi.layer || 'N/A'}
                    </Chip>
                );
            
            case 'chainage':
                return rfi.start_chainage_m && rfi.end_chainage_m ? (
                    <div className="text-sm">
                        <div>Ch {rfi.start_chainage_m}m</div>
                        <div className="text-xs text-default-500">
                            to {rfi.end_chainage_m}m
                        </div>
                    </div>
                ) : <span className="text-default-500">N/A</span>;
            
            case 'gps':
                return renderGpsBadge(rfi);
            
            case 'permit':
                return renderPermitBadge(rfi);
            
            case 'status':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={statusColorMap[rfi.status] || "default"}
                    >
                        {rfi.status?.replace('_', ' ').toUpperCase()}
                    </Chip>
                );
            
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="RFI Actions">
                            <DropdownItem
                                key="view"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('rfi.show', rfi.id))}
                            >
                                View Details
                            </DropdownItem>
                            
                            {canEdit && rfi.status === 'pending' && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => onEdit(rfi)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            
                            {canApprove && rfi.status === 'pending' && (
                                <DropdownItem
                                    key="approve"
                                    className="text-success"
                                    color="success"
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleApprove(rfi)}
                                >
                                    Approve
                                </DropdownItem>
                            )}
                            
                            {canApprove && rfi.status === 'pending' && (
                                <DropdownItem
                                    key="reject"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<XCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleReject(rfi)}
                                >
                                    Reject
                                </DropdownItem>
                            )}
                            
                            {canDelete && (
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => onDelete(rfi)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            
            default:
                return rfi[columnKey] || '-';
        }
    };

    // Handle approve/reject
    const handleApprove = (rfi) => {
        router.post(route('rfi.approve', rfi.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Table will refresh via parent component
            }
        });
    };

    const handleReject = (rfi) => {
        router.post(route('rfi.reject', rfi.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Table will refresh via parent component
            }
        });
    };

    // Handle select all
    const allSelected = rfis.length > 0 && selectedRfis.length === rfis.length;
    const someSelected = selectedRfis.length > 0 && !allSelected;

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(rfis.map(rfi => rfi.id));
        }
    };

    return (
        <div className="space-y-4">
            <Table
                aria-label="RFI Management Table"
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
                            align={column.uid === 'actions' ? 'center' : 'start'}
                        >
                            {column.uid === 'select' ? (
                                <Checkbox
                                    isSelected={allSelected}
                                    isIndeterminate={someSelected}
                                    onValueChange={handleSelectAll}
                                    size="sm"
                                />
                            ) : (
                                column.name
                            )}
                        </TableColumn>
                    )}
                </TableHeader>
                
                <TableBody
                    items={rfis}
                    emptyContent={loading ? "Loading..." : "No RFIs found"}
                    loadingContent={<Spinner label="Loading RFIs..." />}
                    loadingState={loading ? "loading" : "idle"}
                >
                    {(rfi) => (
                        <TableRow key={rfi.id}>
                            {(columnKey) => (
                                <TableCell>{renderCell(rfi, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
                <div className="flex justify-center">
                    <Pagination
                        total={pagination.lastPage}
                        page={pagination.currentPage}
                        onChange={onPageChange}
                        showControls
                        color="primary"
                    />
                </div>
            )}
        </div>
    );
};

export default RfiTable;
