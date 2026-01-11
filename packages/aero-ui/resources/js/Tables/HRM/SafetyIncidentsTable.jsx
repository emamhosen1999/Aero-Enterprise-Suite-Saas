import React, { useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
    Skeleton,
    Tooltip
} from "@heroui/react";
import { 
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MapPinIcon
} from "@heroicons/react/24/outline";

const SafetyIncidentsTable = ({ 
    data = [], 
    loading = false, 
    mode = 'incidents',
    permissions = {},
    onView,
    onEdit,
    onDelete,
    onResolve 
}) => {
    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'danger';
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'resolved':
            case 'closed':
            case 'passed':
                return 'success';
            case 'investigating':
            case 'in_progress':
            case 'scheduled':
                return 'warning';
            case 'open':
            case 'reported':
                return 'danger';
            case 'failed':
                return 'danger';
            default: 
                return 'default';
        }
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'injury':
            case 'accident':
                return <ExclamationTriangleIcon className="w-4 h-4 text-danger" />;
            case 'near_miss':
                return <ExclamationTriangleIcon className="w-4 h-4 text-warning" />;
            default:
                return null;
        }
    };

    // Columns for incidents
    const incidentColumns = [
        { uid: "title", name: "Incident", width: "30%" },
        { uid: "incident_date", name: "Date", width: "12%" },
        { uid: "location", name: "Location", width: "15%" },
        { uid: "severity", name: "Severity", width: "10%" },
        { uid: "status", name: "Status", width: "12%" },
        { uid: "assignee", name: "Assigned To", width: "13%" },
        { uid: "actions", name: "", width: "8%" },
    ];

    // Columns for inspections
    const inspectionColumns = [
        { uid: "title", name: "Inspection", width: "30%" },
        { uid: "inspection_date", name: "Date", width: "12%" },
        { uid: "location", name: "Area/Location", width: "18%" },
        { uid: "inspector", name: "Inspector", width: "15%" },
        { uid: "status", name: "Status", width: "15%" },
        { uid: "actions", name: "", width: "10%" },
    ];

    const columns = mode === 'inspections' ? inspectionColumns : incidentColumns;

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "title":
                return (
                    <div className="flex items-start gap-2">
                        {mode === 'incidents' && getTypeIcon(item.type)}
                        <div className="flex flex-col">
                            <span className="font-medium">{item.title}</span>
                            {item.type && (
                                <span className="text-xs text-default-400 capitalize">{item.type?.replace('_', ' ')}</span>
                            )}
                        </div>
                    </div>
                );
            
            case "incident_date":
            case "inspection_date":
                const date = item.incident_date || item.inspection_date;
                return date ? (
                    <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
                ) : (
                    <span className="text-default-400">-</span>
                );
            
            case "location":
                return (
                    <div className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3 text-default-400" />
                        <span className="text-sm">{item.location || 'N/A'}</span>
                    </div>
                );
            
            case "severity":
                return item.severity ? (
                    <Chip 
                        color={getSeverityColor(item.severity)} 
                        size="sm" 
                        variant="flat"
                    >
                        {item.severity}
                    </Chip>
                ) : null;
            
            case "status":
                return (
                    <Chip 
                        color={getStatusColor(item.status)} 
                        size="sm" 
                        variant="dot"
                    >
                        {item.status?.replace('_', ' ')}
                    </Chip>
                );
            
            case "assignee":
            case "inspector":
                const person = item.assignee || item.inspector;
                return person ? (
                    <div className="flex items-center gap-2">
                        <Avatar 
                            src={person.avatar} 
                            name={person.name} 
                            size="sm"
                            showFallback
                        />
                        <span className="text-sm">{person.name}</span>
                    </div>
                ) : (
                    <span className="text-default-400 text-sm">Unassigned</span>
                );
            
            case "actions":
                return (
                    <div className="flex justify-end">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                <DropdownItem
                                    key="view"
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                    onPress={() => onView?.(item)}
                                >
                                    View Details
                                </DropdownItem>
                                {permissions.canEdit && (
                                    <DropdownItem
                                        key="edit"
                                        startContent={<PencilIcon className="w-4 h-4" />}
                                        onPress={() => onEdit?.(item)}
                                    >
                                        Edit
                                    </DropdownItem>
                                )}
                                {permissions.canResolve && mode === 'incidents' && item.status !== 'resolved' && (
                                    <DropdownItem
                                        key="resolve"
                                        startContent={<CheckCircleIcon className="w-4 h-4" />}
                                        color="success"
                                        onPress={() => onResolve?.(item)}
                                    >
                                        Mark Resolved
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
                    </div>
                );
            
            default:
                return item[columnKey] || '-';
        }
    }, [mode, permissions, onView, onEdit, onDelete, onResolve]);

    // Loading skeleton
    if (loading && data.length === 0) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-3 w-1/2 rounded" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Table 
            aria-label={mode === 'inspections' ? "Safety Inspections Table" : "Safety Incidents Table"}
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.uid} width={column.width}>
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody 
                items={data} 
                emptyContent={
                    <div className="text-center py-8 text-default-400">
                        <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No {mode === 'inspections' ? 'inspections' : 'incidents'} found</p>
                    </div>
                }
                loadingContent={<Skeleton className="h-12 w-full rounded" />}
                isLoading={loading}
            >
                {(item) => (
                    <TableRow 
                        key={item.id}
                        className={
                            item.severity === 'critical' || item.severity === 'high' 
                                ? 'bg-danger/5 hover:bg-danger/10' 
                                : ''
                        }
                    >
                        {(columnKey) => (
                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default SafetyIncidentsTable;
