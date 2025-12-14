import React, {useCallback} from "react";
import {useMediaQuery} from '@/Hooks/useMediaQuery.js';
import {router, usePage} from "@inertiajs/react";
import {showToast} from '@/utils/toastUtils';

import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    CircularProgress,
    Divider,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    ScrollShadow,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
    User,
} from "@heroui/react";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    MapPinIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleSolid,
    ExclamationTriangleIcon as ExclamationTriangleSolid,
} from '@heroicons/react/24/solid';

const WorkLocationsTable = ({ 
    allData, 
    setData, 
    loading, 
    handleClickOpen, 
    openModal, 
    setCurrentRow,
    users,
    auth
}) => {
    const { permissions } = usePage().props.auth;
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    // Handle refresh functionality
    const handleRefresh = useCallback(() => {
        router.reload({ only: ['jurisdictions'], onSuccess: () => {
            showToast.success('Work locations data refreshed successfully');
        }});
    }, []);

    // Permission checks
    const canEdit = permissions?.includes('jurisdiction.update') || auth?.roles?.includes('Administrator');
    const canDelete = permissions?.includes('jurisdiction.delete') || auth?.roles?.includes('Administrator');

    // Get status based on whether location has an incharge
    const getLocationStatus = (location) => {
        if (location.incharge_user) {
            return {
                label: 'Active',
                color: 'success',
                icon: <CheckCircleSolid className="w-3 h-3" />
            };
        }
        return {
            label: 'Pending',
            color: 'warning',
            icon: <ExclamationTriangleSolid className="w-3 h-3" />
        };
    };

    // Mobile card component for smaller screens
    const MobileWorkLocationCard = ({ location }) => {
        const status = getLocationStatus(location);
        
        return (
            <Card key={location.id} className="mb-4 bg-content1/80 backdrop-blur-md">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <MapPinIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h6 className="font-semibold text-foreground truncate">
                                    {location.location}
                                </h6>
                                <div className="flex items-center gap-2 mt-1">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={status.color}
                                        startContent={status.icon}
                                    >
                                        {status.label}
                                    </Chip>
                                </div>
                            </div>
                        </div>
                        {(canEdit || canDelete) && (
                            <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                    <Button
                                        variant="light"
                                        size="sm"
                                        isIconOnly
                                        className="text-default-400"
                                    >
                                        <EllipsisVerticalIcon className="w-4 h-4" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Location actions">
                                    {canEdit && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => {
                                                setCurrentRow(location);
                                                openModal('editWorkLocation');
                                            }}
                                        >
                                            Edit Location
                                        </DropdownItem>
                                    )}
                                    {canDelete && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => handleClickOpen(location.id, 'deleteWorkLocation')}
                                        >
                                            Delete Location
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="pt-3">
                    <div className="space-y-3">
                        {/* Chainage Information */}
                        <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-default-400" />
                            <span className="text-sm text-default-500">
                                Chainage: {location.start_chainage} - {location.end_chainage}
                            </span>
                        </div>
                        
                        {/* Incharge Information */}
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-default-400" />
                            <span className="text-sm text-default-500">
                                Incharge: {location.incharge_user?.name || 'Not assigned'}
                            </span>
                        </div>
                        
                        {/* Created Date */}
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-default-400" />
                            <span className="text-sm text-default-500">
                                Created: {new Date(location.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    };

    // Table columns configuration
    const columns = [
        { name: "Location", uid: "location", icon: MapPinIcon, sortable: true },
        { name: "Start Chainage", uid: "start_chainage", icon: DocumentTextIcon, sortable: true },
        { name: "End Chainage", uid: "end_chainage", icon: DocumentTextIcon, sortable: true },
        { name: "Incharge", uid: "incharge", icon: UserIcon, sortable: true },
        { name: "Status", uid: "status", icon: CheckCircleIcon, sortable: false },
        { name: "Created", uid: "created_at", icon: ClockIcon, sortable: true },
        ...(canEdit || canDelete ? [{ name: "Actions", uid: "actions", sortable: false }] : [])
    ];

    // Render cell content
    const renderCell = useCallback((location, columnKey) => {
        const cellValue = location[columnKey];

        switch (columnKey) {
            case "location":
                return (
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10">
                            <MapPinIcon className="w-3 h-3 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{cellValue}</span>
                    </div>
                );
            case "start_chainage":
            case "end_chainage":
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{cellValue}</span>
                    </div>
                );
            case "incharge":
                return (
                    <div className="flex items-center gap-2">
                        {location.incharge_user ? (
                            <User
                                name={location.incharge_user.name}
                                description={location.incharge_user.email}
                                avatarProps={{
                                    size: "sm",
                                    name: location.incharge_user.name,
                                    className: "bg-primary/10 text-primary"
                                }}
                            />
                        ) : (
                            <div className="flex items-center gap-2 text-default-400">
                                <UserIcon className="w-4 h-4" />
                                <span className="text-sm">Not assigned</span>
                            </div>
                        )}
                    </div>
                );
            case "status":
                const status = getLocationStatus(location);
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={status.color}
                        startContent={status.icon}
                    >
                        {status.label}
                    </Chip>
                );
            case "created_at":
                return (
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-default-400" />
                        <span className="text-sm text-default-500">
                            {new Date(cellValue).toLocaleDateString()}
                        </span>
                    </div>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Tooltip content="Edit location">
                                <Button
                                    variant="light"
                                    size="sm"
                                    isIconOnly
                                    onPress={() => {
                                        setCurrentRow(location);
                                        openModal('editWorkLocation');
                                    }}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip content="Delete location" color="danger">
                                <Button
                                    variant="light"
                                    size="sm"
                                    isIconOnly
                                    color="danger"
                                    onPress={() => handleClickOpen(location.id, 'deleteWorkLocation')}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                );
            default:
                return <span>{cellValue}</span>;
        }
    }, [canEdit, canDelete, setCurrentRow, openModal, handleClickOpen]);

    if (isMobile) {
        return (
            <div className="space-y-4">
                {/* Table Header with Refresh Button */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-lg font-semibold text-default-700">Work Locations</h3>
                    <Button
                        variant="flat"
                        color="primary"
                        size="sm"
                        radius={getThemeRadius()}
                        style={{
                            backgroundColor: 'rgba(var(--color-primary), 0.1)',
                            borderColor: 'rgba(var(--color-primary), 0.3)',
                            color: 'var(--color-text)'
                        }}
                        onClick={handleRefresh}
                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                    >
                        Refresh
                    </Button>
                </div>
                
                <ScrollShadow className="max-h-[70vh]">
                    {allData?.map((location) => (
                        <MobileWorkLocationCard key={location.id} location={location} />
                    ))}
                </ScrollShadow>
            </div>
        );
    }

    return (
        <div className="max-h-[84vh] overflow-y-auto">
            {/* Table Header with Refresh Button */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-semibold text-default-700">Work Locations</h3>
                <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    radius={getThemeRadius()}
                    style={{
                        backgroundColor: 'rgba(var(--color-primary), 0.1)',
                        borderColor: 'rgba(var(--color-primary), 0.3)',
                        color: 'var(--color-text)'
                    }}
                    onClick={handleRefresh}
                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                >
                    Refresh
                </Button>
            </div>
            
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    isStriped
                    selectionMode="none"
                    isCompact
                    isHeaderSticky
                    removeWrapper
                    aria-label="Work Locations Management Table"
                    classNames={{
                        wrapper: "min-h-[200px]",
                        table: "min-h-[300px]",
                        thead: "[&>tr]:first:shadow-small bg-default-100/80",
                        tbody: "divide-y divide-default-200/50",
                        tr: "group hover:bg-default-50/50 transition-colors h-12",
                        td: "py-2 px-3 text-sm",
                        th: "py-2 px-3 text-xs font-semibold"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn 
                                key={column.uid} 
                                align={column.uid === "actions" ? "center" : "start"}
                                className="bg-default-100/80 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-1">
                                    {column.icon && <column.icon className="w-3 h-3" />}
                                    <span className="text-xs font-semibold">{column.name}</span>
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={allData || []}
                        emptyContent="No work locations found"
                        isLoading={loading}
                        loadingContent={<CircularProgress size={40} />}
                    >
                        {(location) => (
                            <TableRow key={location.id}>
                                {(columnKey) => (
                                    <TableCell key={columnKey}>
                                        {renderCell(location, columnKey)}
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>
        </div>
    );
};

export default WorkLocationsTable;
