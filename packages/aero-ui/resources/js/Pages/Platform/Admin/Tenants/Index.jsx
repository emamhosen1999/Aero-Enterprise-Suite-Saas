import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    ButtonGroup,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Checkbox,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Skeleton,
} from '@heroui/react';
import {
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    EllipsisVerticalIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
    PlusIcon,
    EyeIcon,
    PencilIcon,
    ArchiveBoxIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    CalendarDaysIcon,
    DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import App from '@/Layouts/App';
import StatsCards from '@/Components/StatsCards';


const TenantManagement = ({ title }) => {
    const { auth } = usePage().props;

    // Theme radius helper (REQUIRED)
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

    // Responsive breakpoints (REQUIRED)
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
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [selectedTenants, setSelectedTenants] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        status: [],
        plan: 'all',
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 30,
        total: 0,
        lastPage: 1,
    });

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        thisMonth: 0,
        archived: 0,
    });

    const [modalStates, setModalStates] = useState({
        bulk: false,
        action: false,
    });
    const [bulkOperation, setBulkOperation] = useState(null);
    const [actionData, setActionData] = useState({ tenant: null, action: null });

    // Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        {
            title: "Total Tenants",
            value: stats.total,
            icon: <BuildingOffice2Icon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All tenants"
        },
        {
            title: "Active",
            value: stats.active,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Active tenants"
        },
        {
            title: "Suspended",
            value: stats.suspended,
            icon: <ExclamationTriangleIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Suspended tenants"
        },
        {
            title: "Pending",
            value: stats.pending,
            icon: <ClockIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Pending setup"
        },
        {
            title: "This Month",
            value: stats.thisMonth,
            icon: <CalendarDaysIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "New this month"
        },
        {
            title: "Archived",
            value: stats.archived,
            icon: <ArchiveBoxIcon />,
            color: "text-default",
            iconBg: "bg-default/20",
            description: "Archived tenants"
        }
    ], [stats]);

    // Permission checks
    const canCreate = auth?.permissions?.includes('tenants.create') || true;

    // Filter change handler
    const handleFilterChange = useCallback((filterKey, filterValue) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: filterValue
        }));
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    }, []);

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.v1.tenants.index'), {
                params: {
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    search: filters.search || undefined,
                    status: filters.status !== 'all' ? filters.status : undefined,
                    plan: filters.plan !== 'all' ? filters.plan : undefined,
                },
            });
            setTenants(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.meta?.total || 0,
                lastPage: response.data.meta?.last_page || 1,
            }));
        } catch (error) {
            showToast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.perPage, filters]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('api.v1.tenants.stats'));
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchPlans = useCallback(async () => {
        try {
            const response = await axios.get(route('api.v1.plans.index'));
            setPlans(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    useEffect(() => {
        fetchStats();
        fetchPlans();
    }, [fetchStats, fetchPlans]);

    const handleSelectAll = () => {
        if (selectedTenants.size === tenants.length) {
            setSelectedTenants(new Set());
        } else {
            setSelectedTenants(new Set(tenants.map(t => t.id)));
        }
    };

    const handleSelectTenant = (tenantId) => {
        const newSelection = new Set(selectedTenants);
        if (newSelection.has(tenantId)) {
            newSelection.delete(tenantId);
        } else {
            newSelection.add(tenantId);
        }
        setSelectedTenants(newSelection);
    };

    const handleBulkOperation = (operation) => {
        if (selectedTenants.size === 0) {
            showToast.error('Please select at least one tenant');
            return;
        }
        setBulkOperation(operation);
        setIsBulkModalOpen(true);
    };

    const executeBulkOperation = async () => {
        const tenantIds = Array.from(selectedTenants);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('api.v1.bulk-tenant-operations.execute'), {
                    tenant_ids: tenantIds,
                    operation: bulkOperation,
                    async: true,
                });
                
                setIsBulkModalOpen(false);
                setSelectedTenants(new Set());
                await fetchTenants();
                await fetchStats();
                resolve([response.data.message]);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to execute bulk operation']);
            }
        });

        showToast.promise(promise, {
            loading: `Executing ${bulkOperation} operation...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleTenantAction = (tenant, action) => {
        if (action === 'view') {
            router.visit(route('admin.tenants.show', { tenant: tenant.id }));
        } else if (action === 'edit') {
            router.visit(route('admin.tenants.edit', { tenant: tenant.id }));
        } else {
            setActionModal({ open: true, tenant, action });
        }
    };

    const executeAction = async () => {
        const { tenant, action } = actionModal;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                let response;
                if (action === 'suspend') {
                    response = await axios.post(route('api.v1.tenants.suspend', { tenant: tenant.id }));
                } else if (action === 'activate') {
                    response = await axios.post(route('api.v1.tenants.activate', { tenant: tenant.id }));
                } else if (action === 'archive') {
                    response = await axios.post(route('api.v1.tenants.archive', { tenant: tenant.id }));
                } else if (action === 'delete') {
                    response = await axios.delete(route('api.v1.tenants.destroy', { tenant: tenant.id }));
                }
                
                setActionModal({ open: false, tenant: null, action: null });
                await fetchTenants();
                await fetchStats();
                resolve([response.data.message || `Tenant ${action}d successfully`]);
            } catch (error) {
                reject(error.response?.data?.message || `Failed to ${action} tenant`);
            }
        });

        showToast.promise(promise, {
            loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing tenant...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const getActionLabel = (action) => {
        const labels = {
            suspend: 'Suspend Tenant',
            activate: 'Activate Tenant',
            archive: 'Archive Tenant',
            delete: 'Delete Tenant',
        };
        return labels[action] || action;
    };

    const getActionColor = (action) => {
        const colors = {
            suspend: 'warning',
            activate: 'success',
            archive: 'secondary',
            delete: 'danger',
        };
        return colors[action] || 'primary';
    };

    const statusColorMap = {
        active: 'success',
        suspended: 'warning',
        inactive: 'default',
        pending: 'primary',
        provisioning: 'secondary',
        failed: 'danger',
        archived: 'default',
    };

    const renderCell = (tenant, columnKey) => {
        switch (columnKey) {
            case 'select':
                return (
                    <Checkbox
                        isSelected={selectedTenants.has(tenant.id)}
                        onValueChange={() => handleSelectTenant(tenant.id)}
                        radius={getThemeRadius()}
                    />
                );
            case 'name':
                return (
                    <div 
                        className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleTenantAction(tenant, 'view')}
                    >
                        <span className="font-semibold text-primary">{tenant.name}</span>
                        <span className="text-xs text-default-500">{tenant.domain || tenant.subdomain}</span>
                    </div>
                );
            case 'status':
                return (
                    <Chip
                        color={statusColorMap[tenant.status] || 'default'}
                        size="sm"
                        variant="flat"
                        radius={getThemeRadius()}
                    >
                        {tenant.status}
                    </Chip>
                );
            case 'plan':
                return tenant.plan?.name || 'No Plan';
            case 'users':
                return `${tenant.current_users || 0} / ${tenant.max_users || '∞'}`;
            case 'created_at':
                return new Date(tenant.created_at).toLocaleDateString();
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu 
                            aria-label="Tenant actions"
                            onAction={(key) => handleTenantAction(tenant, key)}
                        >
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="edit" 
                                startContent={<PencilIcon className="w-4 h-4" />}
                            >
                                Edit
                            </DropdownItem>
                            {tenant.status !== 'suspended' && (
                                <DropdownItem 
                                    key="suspend" 
                                    startContent={<PauseIcon className="w-4 h-4" />}
                                    className="text-warning"
                                    color="warning"
                                >
                                    Suspend
                                </DropdownItem>
                            )}
                            {tenant.status === 'suspended' && (
                                <DropdownItem 
                                    key="activate" 
                                    startContent={<PlayIcon className="w-4 h-4" />}
                                    className="text-success"
                                    color="success"
                                >
                                    Activate
                                </DropdownItem>
                            )}
                            {tenant.status !== 'archived' && (
                                <DropdownItem 
                                    key="archive" 
                                    startContent={<ArchiveBoxIcon className="w-4 h-4" />}
                                >
                                    Archive
                                </DropdownItem>
                            )}
                            <DropdownItem 
                                key="delete" 
                                className="text-danger" 
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return tenant[columnKey];
        }
    };

    const columns = [
        { key: 'select', label: <Checkbox isSelected={selectedTenants.size === tenants.length} onValueChange={handleSelectAll} radius={getThemeRadius()} /> },
        { key: 'name', label: 'Tenant' },
        { key: 'status', label: 'Status' },
        { key: 'plan', label: 'Plan' },
        { key: 'users', label: 'Users' },
        { key: 'created_at', label: 'Created' },
        { key: 'actions', label: 'Actions' },
    ];

    // RENDER STRUCTURE (CRITICAL - Follow LeavesAdmin.jsx exactly)
    return (
        <>
            <Head title={title || "Tenant Management"} />

            {/* Bulk Operation Confirmation Modal */}
            {modalStates.bulk && (
                <Modal
                    isOpen={modalStates.bulk}
                    onOpenChange={() => closeModal('bulk')}
                    size="md"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Confirm Bulk Operation</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>
                                Are you sure you want to {bulkOperation} {selectedTenants.size} tenant(s)?
                            </p>
                            {bulkOperation === 'delete' && (
                                <p className="text-warning text-sm mt-2">
                                    This will soft delete the tenants. They can be recovered within 30 days.
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('bulk')}>
                                Cancel
                            </Button>
                            <Button
                                color={bulkOperation === 'delete' ? 'danger' : 'primary'}
                                onPress={executeBulkOperation}
                            >
                                Confirm
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Single Tenant Action Confirmation Modal */}
            {modalStates.action && (
                <Modal
                    isOpen={modalStates.action}
                    onOpenChange={() => closeModal('action')}
                    size="md"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">{getActionLabel(actionData.action)}</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>
                                Are you sure you want to {actionData.action} tenant <strong>{actionData.tenant?.name}</strong>?
                            </p>
                            {actionData.action === 'delete' && (
                                <p className="text-warning text-sm mt-2">
                                    This will soft delete the tenant. It can be recovered within 30 days.
                                </p>
                            )}
                            {actionData.action === 'suspend' && (
                                <p className="text-default-500 text-sm mt-2">
                                    Suspended tenants will not be able to access their workspace.
                                </p>
                            )}
                            {actionData.action === 'archive' && (
                                <p className="text-default-500 text-sm mt-2">
                                    Archived tenants will be removed from active lists but data will be preserved.
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('action')}>
                                Cancel
                            </Button>
                            <Button
                                color={getActionColor(actionData.action)}
                                onPress={executeAction}
                            >
                                {actionData.action?.charAt(0).toUpperCase() + actionData.action?.slice(1)}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Tenant Management"
            >
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
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
                                {/* Card Header with title + action buttons */}
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
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section with icon */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div
                                                        className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl flex items-center justify-center`}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <BuildingOffice2Icon
                                                            className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4
                                                            className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? 'truncate' : ''}`}
                                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                        >
                                                            Tenant Management
                                                        </h4>
                                                        <p
                                                            className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 ${isMobile ? 'truncate' : ''}`}
                                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                        >
                                                            Manage all tenants and perform bulk operations
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 flex-wrap">
                                                    {canCreate && (
                                                        <Button
                                                            color="primary"
                                                            variant="shadow"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={() => router.visit(route('admin.tenants.create'))}
                                                            size={isMobile ? "sm" : "md"}
                                                            className="font-semibold"
                                                            style={{
                                                                borderRadius: `var(--borderRadius, 8px)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Create Tenant
                                                        </Button>
                                                    )}
                                                    <Button
                                                        color="default"
                                                        variant="bordered"
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        size={isMobile ? "sm" : "md"}
                                                        className="font-semibold"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Export
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top) */}
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />

                                    {/* 2. Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <div className="flex-1">
                                            <Input
                                                label="Search Tenants"
                                                placeholder="Search by name or domain..."
                                                value={filters.search}
                                                onValueChange={(value) => handleFilterChange('search', value)}
                                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                className="w-full"
                                                classNames={{
                                                    input: "text-sm",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                                aria-label="Search tenants"
                                            />
                                        </div>
                                        <div className="flex gap-2 items-end">
                                            <ButtonGroup
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                className="bg-white/5"
                                            >
                                                <Button
                                                    isIconOnly={isMobile}
                                                    color={showFilters ? 'primary' : 'default'}
                                                    onPress={() => setShowFilters(!showFilters)}
                                                    className={showFilters ? 'bg-purple-500/20' : 'bg-white/5'}
                                                >
                                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                                    {!isMobile && <span className="ml-1">Filters</span>}
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    </div>

                                    {/* Advanced Filters Panel */}
                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="mb-6 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Select
                                                        label="Status"
                                                        placeholder="Select status..."
                                                        selectionMode="multiple"
                                                        selectedKeys={new Set(filters.status)}
                                                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                        classNames={{
                                                            trigger: "text-sm",
                                                        }}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                        aria-label="Filter by status"
                                                    >
                                                        <SelectItem key="active" value="active">Active</SelectItem>
                                                        <SelectItem key="suspended" value="suspended">Suspended</SelectItem>
                                                        <SelectItem key="pending" value="pending">Pending</SelectItem>
                                                        <SelectItem key="provisioning" value="provisioning">Provisioning</SelectItem>
                                                        <SelectItem key="archived" value="archived">Archived</SelectItem>
                                                    </Select>

                                                    <Select
                                                        label="Plan"
                                                        placeholder="Select plan..."
                                                        selectedKeys={filters.plan !== 'all' ? [filters.plan] : []}
                                                        onSelectionChange={(keys) => handleFilterChange('plan', Array.from(keys)[0] || 'all')}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                        classNames={{
                                                            trigger: "text-sm",
                                                        }}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                        aria-label="Filter by plan"
                                                    >
                                                        <SelectItem key="all">All Plans</SelectItem>
                                                        {plans.map(plan => (
                                                            <SelectItem key={plan.id}>{plan.name}</SelectItem>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Bulk Actions Bar */}
                                    {selectedTenants.size > 0 && (
                                        <div className="flex gap-2 mb-4 p-3 bg-primary/10 rounded-lg">
                                            <span className="text-sm text-default-600 flex items-center mr-2">
                                                {selectedTenants.size} selected
                                            </span>
                                            <Button
                                                size="sm"
                                                color="success"
                                                variant="flat"
                                                onPress={() => handleBulkOperation('activate')}
                                                startContent={<PlayIcon className="w-4 h-4" />}
                                            >
                                                Activate
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="warning"
                                                variant="flat"
                                                onPress={() => handleBulkOperation('suspend')}
                                                startContent={<PauseIcon className="w-4 h-4" />}
                                            >
                                                Suspend
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="flat"
                                                onPress={() => handleBulkOperation('delete')}
                                                startContent={<TrashIcon className="w-4 h-4" />}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    )}

                                    {/* 3. Data Table */}
                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-3/4 rounded" />
                                                        <Skeleton className="h-3 w-1/2 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Tenant management table"
                                            isHeaderSticky
                                            classNames={{
                                                wrapper: "shadow-none border border-divider rounded-lg",
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-3"
                                            }}
                                        >
                                            <TableHeader columns={columns}>
                                                {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                            </TableHeader>
                                            <TableBody items={tenants} emptyContent="No tenants found">
                                                {(tenant) => (
                                                    <TableRow key={tenant.id}>
                                                        {(columnKey) => <TableCell>{renderCell(tenant, columnKey)}</TableCell>}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}

                                    {/* 4. Pagination */}
                                    {pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                                showControls
                                                showShadow
                                                color="primary"
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

// REQUIRED: Use App layout wrapper
TenantManagement.layout = (page) => <App>{page}</App>;
export default TenantManagement;
