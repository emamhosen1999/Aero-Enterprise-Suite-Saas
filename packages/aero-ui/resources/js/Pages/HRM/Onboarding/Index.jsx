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
    ClipboardDocumentListIcon,
    PlusIcon,
    ClockIcon,
    CheckCircleIcon,
    PlayCircleIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
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

const OnboardingIndex = ({ title, onboardings }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    // HRMAC permissions
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const canCreateOnboarding = canCreate('hrm.onboarding') || isSuperAdmin();
    const canEditOnboarding = canUpdate('hrm.onboarding') || isSuperAdmin();
    const canDeleteOnboarding = canDelete('hrm.onboarding') || isSuperAdmin();

    // State management
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(new Set([]));

    // Calculate stats from onboardings data
    const stats = useMemo(() => {
        const data = onboardings?.data || [];
        return {
            total: onboardings?.total || data.length,
            pending: data.filter(o => o.status === 'pending').length,
            inProgress: data.filter(o => o.status === 'in_progress').length,
            completed: data.filter(o => o.status === 'completed').length,
        };
    }, [onboardings]);

    // Stats cards data
    const statsData = useMemo(() => [
        {
            title: "Total",
            value: stats.total,
            icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All onboarding processes"
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

    // Handle create new onboarding
    const handleCreate = () => {
        router.visit(route('hrm.onboarding.create'));
    };

    // Handle view onboarding
    const handleView = (id) => {
        router.visit(route('hrm.onboarding.show', id));
    };

    // Handle edit onboarding
    const handleEdit = (id) => {
        router.visit(route('hrm.onboarding.edit', id));
    };

    // Handle delete onboarding
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this onboarding process?')) return;
        
        try {
            await router.delete(route('hrm.onboarding.destroy', id));
            showToast.success('Onboarding process deleted successfully');
        } catch (error) {
            showToast.error('Failed to delete onboarding process');
        }
    };

    // Table columns
    const columns = [
        { name: "EMPLOYEE", uid: "employee" },
        { name: "START DATE", uid: "start_date" },
        { name: "EXPECTED COMPLETION", uid: "expected_completion_date" },
        { name: "STATUS", uid: "status" },
        { name: "ACTIONS", uid: "actions" }
    ];

    // Render cell content
    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "employee":
                return (
                    <User
                        name={item.employee?.user?.name || 'N/A'}
                        description={item.employee?.employee_code || ''}
                        avatarProps={{
                            src: item.employee?.user?.avatar,
                            size: "sm"
                        }}
                    />
                );
            case "start_date":
                return item.start_date ? new Date(item.start_date).toLocaleDateString() : '-';
            case "expected_completion_date":
                return item.expected_completion_date ? new Date(item.expected_completion_date).toLocaleDateString() : '-';
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
                            {canEditOnboarding && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => handleEdit(item.id)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDeleteOnboarding && (
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
    }, [canEditOnboarding, canDeleteOnboarding]);

    // Handle pagination
    const handlePageChange = (page) => {
        router.visit(route('hrm.onboarding.index', { page }));
    };

    // Action buttons for StandardPageLayout
    const actionButtons = useMemo(() => (
        <>
            {canCreateOnboarding && (
                <Button 
                    color="primary" 
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={handleCreate}
                >
                    New Onboarding
                </Button>
            )}
        </>
    ), [canCreateOnboarding]);

    return (
        <>
            <Head title={title} />
            
            <StandardPageLayout
                title="Employee Onboarding"
                subtitle="Manage employee onboarding processes"
                icon={<ClipboardDocumentListIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={statsData} />}
                ariaLabel="Employee Onboarding Management"
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search by employee name..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                                inputWrapper: "bg-default-100"
                            }}
                            size="sm"
                            radius={themeRadius}
                            className="flex-1"
                        />
                        <Select
                            placeholder="Filter by status"
                            selectedKeys={statusFilter}
                            onSelectionChange={setStatusFilter}
                            classNames={{ trigger: "bg-default-100" }}
                            size="sm"
                            radius={themeRadius}
                            className="w-full sm:w-48"
                        >
                            <SelectItem key="pending">Pending</SelectItem>
                            <SelectItem key="in_progress">In Progress</SelectItem>
                            <SelectItem key="completed">Completed</SelectItem>
                            <SelectItem key="cancelled">Cancelled</SelectItem>
                        </Select>
                    </div>
                }
                pagination={
                    onboardings?.last_page > 1 && (
                        <div className="flex justify-center">
                            <Pagination
                                total={onboardings.last_page}
                                page={onboardings.current_page}
                                onChange={handlePageChange}
                                showControls
                                size="sm"
                                radius={themeRadius}
                            />
                        </div>
                    )
                }
            >
                {/* Data Table */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <Table
                        aria-label="Employee onboarding table"
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
                            items={onboardings?.data || []} 
                            emptyContent="No onboarding processes found"
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

export default OnboardingIndex;
