import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {motion} from 'framer-motion';
import {
    Button, 
    Card, 
    CardBody, 
    CardHeader, 
    Chip, 
    Input, 
    Select, 
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Skeleton,
    Textarea,
    Progress,
    Tabs,
    Tab
} from "@heroui/react";
import {
    ArrowTrendingUpIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusIcon,
    UserGroupIcon,
    UsersIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import {showToast} from '@/utils/toastUtils.jsx';
import axios from 'axios';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const WorkforcePlanningIndex = ({title}) => {
    const {auth} = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate: hrmCanCreate, canUpdate: hrmCanUpdate, canDelete: hrmCanDelete, isSuperAdmin, hasAccess } = useHRMAC();
    
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
    const [workforcePlans, setWorkforcePlans] = useState([]);
    const [activeTab, setActiveTab] = useState('plans');
    const [stats, setStats] = useState({
        total_plans: 0,
        active_plans: 0,
        total_planned_positions: 0,
        filled_positions: 0,
        open_positions: 0,
        current_headcount: 0,
        planned_headcount: 0
    });
    const [pagination, setPagination] = useState({perPage: 15, currentPage: 1, total: 0, lastPage: 1});
    const [filters, setFilters] = useState({search: '', status: '', department_id: ''});
    const [departments, setDepartments] = useState([]);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        department_id: '',
        fiscal_year: new Date().getFullYear(),
        start_date: '',
        end_date: '',
        current_headcount: '',
        planned_headcount: '',
        objectives: '',
        assumptions: '',
        status: 'draft'
    });

    // Permission checks using HRMAC
    const canCreate = hrmCanCreate('hrm.workforce-planning') || isSuperAdmin();
    const canEdit = hrmCanUpdate('hrm.workforce-planning') || isSuperAdmin();
    const canDelete = hrmCanDelete('hrm.workforce-planning') || isSuperAdmin();
    const canApprove = hasAccess('hrm.workforce-planning.approve') || isSuperAdmin();

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        {
            title: "Workforce Plans",
            value: stats.total_plans,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Total planning cycles"
        },
        {
            title: "Active Plans",
            value: stats.active_plans,
            icon: <CalendarDaysIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Currently in progress"
        },
        {
            title: "Current Headcount",
            value: stats.current_headcount,
            icon: <UsersIcon className="w-6 h-6" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Active employees"
        },
        {
            title: "Planned Headcount",
            value: stats.planned_headcount,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Target headcount"
        },
        {
            title: "Open Positions",
            value: stats.open_positions,
            icon: <BuildingOffice2Icon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: `${stats.filled_positions || 0} filled`
        }
    ], [stats]);

    // Fetch data
    const fetchWorkforcePlans = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.workforce-planning.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                const data = response.data.items;
                setWorkforcePlans(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch workforce plans'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.workforce-planning.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.departments.list'));
            if (response.status === 200) {
                setDepartments(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    }, []);

    useEffect(() => {
        fetchWorkforcePlans();
    }, [fetchWorkforcePlans]);

    useEffect(() => {
        fetchStats();
        fetchDepartments();
    }, [fetchStats, fetchDepartments]);

    // Handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, currentPage: 1}));
    };

    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedPlan
                    ? route('hrm.workforce-planning.update', selectedPlan.id)
                    : route('hrm.workforce-planning.store');
                const method = selectedPlan ? 'put' : 'post';
                
                const response = await axios[method](endpoint, formData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Workforce plan saved successfully']);
                    setShowAddModal(false);
                    setShowEditModal(false);
                    fetchWorkforcePlans();
                    fetchStats();
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save workforce plan']);
            }
        });

        showToast.promise(promise, {
            loading: selectedPlan ? 'Updating plan...' : 'Creating plan...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? Object.values(data).flat().join(', ') : data
        });
    };

    const handleApprove = async (plan) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.workforce-planning.approve', plan.id));
                if (response.status === 200) {
                    resolve(['Workforce plan approved successfully']);
                    fetchWorkforcePlans();
                    fetchStats();
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to approve plan']);
            }
        });

        showToast.promise(promise, {
            loading: 'Approving plan...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', ')
        });
    };

    const handleDelete = async (plan) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.workforce-planning.destroy', plan.id));
                if (response.status === 200) {
                    resolve(['Workforce plan deleted successfully']);
                    fetchWorkforcePlans();
                    fetchStats();
                }
            } catch (error) {
                reject(['Failed to delete workforce plan']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting plan...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', ')
        });
    };

    const resetForm = () => {
        setSelectedPlan(null);
        setFormData({
            name: '',
            department_id: '',
            fiscal_year: new Date().getFullYear(),
            start_date: '',
            end_date: '',
            current_headcount: '',
            planned_headcount: '',
            objectives: '',
            assumptions: '',
            status: 'draft'
        });
    };

    const statusColorMap = {
        draft: 'default',
        pending_approval: 'warning',
        approved: 'success',
        active: 'primary',
        completed: 'secondary',
        archived: 'default'
    };

    const columns = [
        {uid: 'name', name: 'Plan Name'},
        {uid: 'department', name: 'Department'},
        {uid: 'period', name: 'Period'},
        {uid: 'headcount', name: 'Headcount'},
        {uid: 'positions', name: 'Positions'},
        {uid: 'status', name: 'Status'},
        {uid: 'actions', name: 'Actions'}
    ];

    const renderCell = (plan, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{plan.name}</span>
                        <span className="text-xs text-default-500">FY {plan.fiscal_year}</span>
                    </div>
                );
            case 'department':
                return plan.department?.name || <span className="text-default-400">All Departments</span>;
            case 'period':
                return (
                    <div className="flex flex-col text-xs">
                        <span>{plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '-'}</span>
                        <span className="text-default-400">to {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : '-'}</span>
                    </div>
                );
            case 'headcount':
                const growth = plan.planned_headcount - plan.current_headcount;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{plan.current_headcount} → {plan.planned_headcount}</span>
                        <Chip 
                            size="sm" 
                            variant="flat" 
                            color={growth > 0 ? 'success' : growth < 0 ? 'danger' : 'default'}
                        >
                            {growth > 0 ? '+' : ''}{growth} {growth === 1 || growth === -1 ? 'position' : 'positions'}
                        </Chip>
                    </div>
                );
            case 'positions':
                return (
                    <div className="w-24">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs">{plan.filled_positions_count || 0}/{plan.positions_count || 0}</span>
                        </div>
                        <Progress 
                            value={plan.positions_count > 0 
                                ? ((plan.filled_positions_count || 0) / plan.positions_count) * 100 
                                : 0
                            } 
                            size="sm" 
                            color="success"
                        />
                    </div>
                );
            case 'status':
                return (
                    <Chip color={statusColorMap[plan.status]} variant="flat" size="sm">
                        {plan.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => {
                                    setSelectedPlan(plan);
                                    setShowViewModal(true);
                                }}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="forecast" 
                                startContent={<ArrowTrendingUpIcon className="w-4 h-4" />}
                            >
                                View Forecast
                            </DropdownItem>
                            {canApprove && plan.status === 'pending_approval' && (
                                <DropdownItem 
                                    key="approve" 
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleApprove(plan)}
                                >
                                    Approve Plan
                                </DropdownItem>
                            )}
                            {canEdit && ['draft', 'pending_approval'].includes(plan.status) && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => {
                                        setSelectedPlan(plan);
                                        setFormData({
                                            name: plan.name,
                                            department_id: plan.department_id || '',
                                            fiscal_year: plan.fiscal_year,
                                            start_date: plan.start_date || '',
                                            end_date: plan.end_date || '',
                                            current_headcount: plan.current_headcount || '',
                                            planned_headcount: plan.planned_headcount || '',
                                            objectives: plan.objectives || '',
                                            assumptions: plan.assumptions || '',
                                            status: plan.status
                                        });
                                        setShowEditModal(true);
                                    }}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && plan.status === 'draft' && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger" 
                                    startContent={<XCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(plan)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title || "Workforce Planning"} />
            
            {/* Add/Edit Modal */}
            <Modal 
                isOpen={showAddModal || showEditModal} 
                onOpenChange={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                }}
                size="3xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="border-b border-divider">
                        <h2 className="text-lg font-semibold">
                            {selectedPlan ? 'Edit Workforce Plan' : 'Create Workforce Plan'}
                        </h2>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Plan Name"
                                placeholder="e.g., Q1 2024 Hiring Plan"
                                value={formData.name}
                                onValueChange={(v) => setFormData(p => ({...p, name: v}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <Select
                                label="Department"
                                placeholder="All Departments"
                                selectedKeys={formData.department_id ? [String(formData.department_id)] : []}
                                onSelectionChange={(keys) => setFormData(p => ({...p, department_id: Array.from(keys)[0] || ''}))}
                                radius={themeRadius}
                            >
                                {departments.map(dept => (
                                    <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                                ))}
                            </Select>
                            <Input
                                label="Fiscal Year"
                                type="number"
                                value={formData.fiscal_year}
                                onValueChange={(v) => setFormData(p => ({...p, fiscal_year: v}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <Select
                                label="Status"
                                selectedKeys={[formData.status]}
                                onSelectionChange={(keys) => setFormData(p => ({...p, status: Array.from(keys)[0]}))}
                                radius={themeRadius}
                            >
                                <SelectItem key="draft">Draft</SelectItem>
                                <SelectItem key="pending_approval">Pending Approval</SelectItem>
                            </Select>
                            <Input
                                label="Start Date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData(p => ({...p, start_date: e.target.value}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData(p => ({...p, end_date: e.target.value}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <Input
                                label="Current Headcount"
                                type="number"
                                value={formData.current_headcount}
                                onValueChange={(v) => setFormData(p => ({...p, current_headcount: v}))}
                                startContent={<UsersIcon className="w-4 h-4 text-default-400" />}
                                isRequired
                                radius={themeRadius}
                            />
                            <Input
                                label="Planned Headcount"
                                type="number"
                                value={formData.planned_headcount}
                                onValueChange={(v) => setFormData(p => ({...p, planned_headcount: v}))}
                                startContent={<UserGroupIcon className="w-4 h-4 text-default-400" />}
                                isRequired
                                radius={themeRadius}
                            />
                            <div className="md:col-span-2">
                                <Textarea
                                    label="Objectives"
                                    placeholder="What are the goals of this workforce plan?"
                                    value={formData.objectives}
                                    onValueChange={(v) => setFormData(p => ({...p, objectives: v}))}
                                    radius={themeRadius}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Textarea
                                    label="Assumptions"
                                    placeholder="Key assumptions for this plan..."
                                    value={formData.assumptions}
                                    onValueChange={(v) => setFormData(p => ({...p, assumptions: v}))}
                                    radius={themeRadius}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="border-t border-divider">
                        <Button variant="flat" onPress={() => {
                            setShowAddModal(false);
                            setShowEditModal(false);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            {selectedPlan ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Workforce Planning">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{scale: 0.9, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            transition={{duration: 0.5}}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
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
                                                <div 
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ChartBarIcon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{color: 'var(--theme-primary)'}} 
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Workforce Planning
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Strategic headcount planning and workforce forecasting
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => setShowAddModal(true)}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        New Workforce Plan
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} />
                                    
                                    {/* Tabs */}
                                    <Tabs 
                                        selectedKey={activeTab} 
                                        onSelectionChange={setActiveTab}
                                        className="mb-6"
                                    >
                                        <Tab key="plans" title="Workforce Plans" />
                                        <Tab key="positions" title="Planned Positions" />
                                        <Tab key="forecast" title="Forecast" />
                                    </Tabs>

                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search plans..."
                                            value={filters.search}
                                            onValueChange={(v) => handleFilterChange('search', v)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                        />
                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id ? [String(filters.department_id)] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || '')}
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                        >
                                            {departments.map(dept => (
                                                <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            placeholder="All Statuses"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                        >
                                            <SelectItem key="draft">Draft</SelectItem>
                                            <SelectItem key="pending_approval">Pending Approval</SelectItem>
                                            <SelectItem key="approved">Approved</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="completed">Completed</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Table */}
                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({length: 5}).map((_, i) => (
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
                                        <>
                                            <Table
                                                aria-label="Workforce plans table"
                                                isHeaderSticky
                                                classNames={{
                                                    wrapper: "shadow-none border border-divider rounded-lg",
                                                    th: "bg-default-100 text-default-600 font-semibold",
                                                    td: "py-3"
                                                }}
                                            >
                                                <TableHeader columns={columns}>
                                                    {(column) => (
                                                        <TableColumn key={column.uid}>
                                                            {column.name}
                                                        </TableColumn>
                                                    )}
                                                </TableHeader>
                                                <TableBody 
                                                    items={workforcePlans} 
                                                    emptyContent="No workforce plans found"
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
                                            
                                            {/* Pagination */}
                                            {pagination.lastPage > 1 && (
                                                <div className="flex justify-center mt-4">
                                                    <Pagination
                                                        total={pagination.lastPage}
                                                        page={pagination.currentPage}
                                                        onChange={(page) => setPagination(p => ({...p, currentPage: page}))}
                                                        showControls
                                                    />
                                                </div>
                                            )}
                                        </>
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

WorkforcePlanningIndex.layout = (page) => <App children={page} />;
export default WorkforcePlanningIndex;
