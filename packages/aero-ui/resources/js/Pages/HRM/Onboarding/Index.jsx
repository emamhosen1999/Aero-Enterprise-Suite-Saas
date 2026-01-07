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
    ClipboardDocumentListIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlayCircleIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { showToast } from '@/utils/toastUtils.jsx';

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

    // Permission checks
    const canCreate = auth.permissions?.includes('onboarding.create') || 
                     auth.roles?.some(r => r.name === 'Super Administrator') || false;
    const canEdit = auth.permissions?.includes('onboarding.update') || 
                   auth.roles?.some(r => r.name === 'Super Administrator') || false;
    const canDelete = auth.permissions?.includes('onboarding.delete') || 
                     auth.roles?.some(r => r.name === 'Super Administrator') || false;

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
                            {canEdit && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => handleEdit(item.id)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
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
    }, [canEdit, canDelete]);

    // Handle pagination
    const handlePageChange = (page) => {
        router.visit(route('hrm.onboarding.index', { page }));
    };

    return (
        <>
            <Head title={title} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Employee Onboarding Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ClipboardDocumentListIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Employee Onboarding
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee onboarding processes
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={handleCreate}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        New Onboarding
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
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
                                    
                                    {/* Pagination */}
                                    {onboardings?.last_page > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={onboardings.last_page}
                                                page={onboardings.current_page}
                                                onChange={handlePageChange}
                                                showControls
                                                size="sm"
                                                radius={getThemeRadius()}
                                            />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

OnboardingIndex.layout = (page) => <App children={page} />;
export default OnboardingIndex;
