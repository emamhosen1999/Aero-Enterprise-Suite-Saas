import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import {
    Button,
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
    ClockIcon,
    CheckCircleIcon,
    PlayCircleIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import axios from 'axios';

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

const OffboardingIndex = ({ title }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const themeRadius = useThemeRadius();
    
    // HRMAC permissions
    const canCreateOffboarding = canCreate('hrm.offboarding') || isSuperAdmin();
    const canEditOffboarding = canUpdate('hrm.offboarding') || isSuperAdmin();
    const canDeleteOffboarding = canDelete('hrm.offboarding') || isSuperAdmin();

    // State management
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [offboardings, setOffboardings] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });

    // Stats cards data
    const statsData = useMemo(() => [
        {
            title: "Total",
            value: stats.total,
            icon: <ArrowRightStartOnRectangleIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "Pending",
            value: stats.pending,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-warning",
            iconBg: "bg-warning/20"
        },
        {
            title: "In Progress",
            value: stats.inProgress,
            icon: <PlayCircleIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "Completed",
            value: stats.completed,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20"
        }
    ], [stats]);

    // Fetch offboardings
    const fetchOffboardings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.offboarding.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                }
            });
            if (response.status === 200) {
                setOffboardings(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch offboardings:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.offboarding.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOffboardings();
        fetchStats();
    }, [fetchOffboardings, fetchStats]);

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
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.offboarding.destroy', id));
                resolve(['Offboarding deleted successfully']);
                fetchOffboardings();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete offboarding']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Deleting offboarding...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
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
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            <Button 
                isIconOnly 
                variant="flat" 
                onPress={() => { fetchOffboardings(); fetchStats(); }}
            >
                <ArrowPathIcon className="w-4 h-4" />
            </Button>
            {canCreateOffboarding && (
                <Button 
                    color="primary" 
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={handleCreate}
                >
                    New Offboarding
                </Button>
            )}
        </>
    ), [canCreateOffboarding, fetchOffboardings, fetchStats]);

    // Filter section
    const filterSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input
                label="Search"
                placeholder="Search by employee name..."
                value={filters.search}
                onValueChange={(value) => handleFilterChange('search', value)}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                variant="bordered"
                size="sm"
                radius={themeRadius}
                className="flex-1"
                isClearable
                onClear={() => handleFilterChange('search', '')}
            />
            <Select
                label="Status"
                placeholder="All Statuses"
                variant="bordered"
                size="sm"
                radius={themeRadius}
                selectionMode="multiple"
                selectedKeys={new Set(filters.status)}
                onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                className="w-full sm:w-48"
            >
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="in_progress">In Progress</SelectItem>
                <SelectItem key="completed">Completed</SelectItem>
                <SelectItem key="cancelled">Cancelled</SelectItem>
            </Select>
        </div>
    ), [filters, themeRadius]);

    // Pagination section
    const paginationSection = pagination.lastPage > 1 ? (
        <div className="flex justify-center">
            <Pagination
                total={pagination.lastPage}
                page={pagination.currentPage}
                onChange={handlePageChange}
                showControls
                radius={themeRadius}
            />
        </div>
    ) : null;

    return (
        <>
            <Head title={title || "Employee Offboarding"} />
            
            <StandardPageLayout
                title="Employee Offboarding"
                subtitle="Manage employee offboarding processes"
                icon={<ArrowRightStartOnRectangleIcon className="w-6 h-6" />}
                isLoading={loading && statsLoading}
                ariaLabel="Employee Offboarding Management"
                actions={actionButtons}
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={filterSection}
                pagination={paginationSection}
            >
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
                            items={offboardings} 
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
            </StandardPageLayout>
        </>
    );
};

export default OffboardingIndex;
