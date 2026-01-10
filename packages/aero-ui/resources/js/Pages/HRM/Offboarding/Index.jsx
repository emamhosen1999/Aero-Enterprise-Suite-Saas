import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Spinner,
    User
} from "@heroui/react";
import {
    ArrowRightStartOnRectangleIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlayCircleIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    CalendarDaysIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

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

const OffboardingIndex = ({ title, offboardings }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const themeRadius = useThemeRadius();
    
    // HRMAC permissions - TODO: Update with proper HRMAC module hierarchy path once defined
    const canCreateOffboarding = canCreate('hrm.offboarding') || isSuperAdmin();
    const canEditOffboarding = canUpdate('hrm.offboarding') || isSuperAdmin();
    const canDeleteOffboarding = canDelete('hrm.offboarding') || isSuperAdmin();
    
    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State management
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(new Set([]));

    // Calculate stats from offboardings data
    const stats = useMemo(() => {
        const data = offboardings?.data || [];
        return {
            total: offboardings?.total || data.length,
            pending: data.filter(o => o.status === 'pending').length,
            inProgress: data.filter(o => o.status === 'in_progress').length,
            completed: data.filter(o => o.status === 'completed').length,
        };
    }, [offboardings]);

    // Stats cards data
    const statsData = useMemo(() => [
        {
            title: "Total",
            value: stats.total,
            icon: <ArrowRightStartOnRectangleIcon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All offboarding processes"
        },
        {
            title: "Pending",
            value: stats.pending,
            icon: <ClockIcon className="w-5 h-5" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Not started"
        },
        {
            title: "In Progress",
            value: stats.inProgress,
            icon: <PlayCircleIcon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Currently active"
        },
        {
            title: "Completed",
            value: stats.completed,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Successfully finished"
        }
    ], [stats]);

    // Permissions using HRMAC
    // TODO: Update with correct HRMAC path once module hierarchy is defined for HRM
    const canCreateOffboarding = canCreate("hrm.offboarding") || isSuperAdmin();
    const canEditOffboarding = canUpdate("hrm.offboarding") || isSuperAdmin();
    const canDeleteOffboarding = canDelete("hrm.offboarding") || isSuperAdmin();
    const canDelete = auth.permissions?.includes('offboarding.delete') || 
                     auth.roles?.some(r => r.name === 'Super Administrator') || false;

    // Handle create new offboarding
    const handleCreate = () => {
        router.visit(route('hrm.offboarding.create'));
    };

    // Handle view offboarding
    const handleView = (id) => {
        router.visit(route('hrm.offboarding.show', id));
    };

    // Handle edit offboarding
    const handleEdit = (id) => {
        router.visit(route('hrm.offboarding.show', id));
    };

    // Handle delete offboarding
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this offboarding process?')) return;
        
        try {
            await router.delete(route('hrm.offboarding.destroy', id));
            showToast.success('Offboarding process deleted successfully');
        } catch (error) {
            showToast.error('Failed to delete offboarding process');
        }
    };

    // Table columns
    const columns = [
        { name: "EMPLOYEE", uid: "employee" },
        { name: "INITIATION DATE", uid: "initiation_date" },
        { name: "LAST WORKING DATE", uid: "last_working_date" },
        { name: "REASON", uid: "reason" },
        { name: "STATUS", uid: "status" },
        { name: "ACTIONS", uid: "actions" }
    ];

    // Render cell content
    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "employee":
                return (
                    <User
                        name={item.employee?.user?.name || item.employee?.name || 'N/A'}
                        description={item.employee?.employee_code || item.employee?.email || ''}
                        avatarProps={{
                            src: item.employee?.user?.avatar || item.employee?.avatar,
                            size: "sm"
                        }}
                    />
                );
            case "initiation_date":
                return item.initiation_date ? new Date(item.initiation_date).toLocaleDateString() : '-';
            case "last_working_date":
                return item.last_working_date ? new Date(item.last_working_date).toLocaleDateString() : '-';
            case "reason":
                return (
                    <span className="text-sm text-default-600 line-clamp-2">
                        {item.reason || '-'}
                    </span>
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
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => handleView(item.id)}
                            >
                                View
                            </DropdownItem>
                            {canEditOffboarding && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => handleEdit(item.id)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDeleteOffboarding && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger" 
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(item.id)}
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
    }, [canEditOffboarding, canDeleteOffboarding]);

    // Handle pagination
    const handlePageChange = (page) => {
        router.visit(route('hrm.offboarding.index', { page }));
    };

    // Action buttons for StandardPageLayout
    const actionButtons = useMemo(() => (
        <>
            {canCreateOffboarding && (
                <Button 
                    color="primary" 
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={handleCreate}
                    size={isMobile ? "sm" : "md"}
                >
                    New Offboarding
                </Button>
            )}
        </>
    ), [canCreateOffboarding, isMobile, handleCreate]);

    return (
        <>
            <Head title={title} />
            
            <StandardPageLayout
                title="Employee Offboarding"
                subtitle="Manage employee offboarding processes"
                icon={<ArrowRightStartOnRectangleIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={statsData} />}
                ariaLabel="Employee Offboarding Management"
            >
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Input
                        placeholder="Search by employee name..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        <Select
                                            placeholder="Filter by status"
                                            selectedKeys={statusFilter}
                                            onSelectionChange={setStatusFilter}
                                            classNames={{ trigger: "bg-default-100" }}
                                            size="sm"
                                            radius={getThemeRadius()}
                                        >
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="in_progress">In Progress</SelectItem>
                                            <SelectItem key="completed">Completed</SelectItem>
                                            <SelectItem key="cancelled">Cancelled</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {/* Data Table */}
                                    {loading ? (
                                        <div className="flex justify-center items-center py-12">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Employee offboarding table"
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
                                            <TableBody 
                                                items={offboardings?.data || []} 
                                                emptyContent="No offboarding processes found"
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
                                    )}
                                    
                                    {/* Pagination */}
                                    {offboardings?.last_page > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={offboardings.last_page}
                                                page={offboardings.current_page}
                                                onChange={handlePageChange}
                                                showControls
                                                size="sm"
                                                radius={themeRadius}
                                            />
                                        </div>
                                    )}
            </StandardPageLayout>
        </>
    );
};

OffboardingIndex.layout = (page) => <App children={page} />;
export default OffboardingIndex;
