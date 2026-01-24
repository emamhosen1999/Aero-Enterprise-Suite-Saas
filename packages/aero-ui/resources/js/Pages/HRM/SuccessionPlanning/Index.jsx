import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Spinner,
    Textarea,
    Skeleton,
} from "@heroui/react";
import {
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon,
    UserPlusIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const SuccessionPlanningIndex = ({ title, stats: initialStats, designations, departments }) => {
    const { auth } = usePage().props;
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

    // State
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState(initialStats || {});
    const [filters, setFilters] = useState({ search: '', status: '', priority: '', department_id: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        designation_id: '',
        department_id: '',
        current_holder_id: '',
        description: '',
        priority: 'medium',
        risk_level: 'medium',
        status: 'draft',
        target_date: '',
        notes: '',
    });
    const [formLoading, setFormLoading] = useState(false);

    // Stats data
    const statsData = useMemo(() => [
        { title: "Total Plans", value: stats.total || 0, icon: <UserGroupIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Active", value: stats.active || 0, icon: <CheckCircleIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Critical Positions", value: stats.critical_positions || 0, icon: <ExclamationTriangleIcon className="w-5 h-5" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "High Risk", value: stats.high_risk || 0, icon: <ArrowTrendingUpIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Ready Now", value: stats.ready_now_candidates || 0, icon: <UserPlusIcon className="w-5 h-5" />, color: "text-secondary", iconBg: "bg-secondary/20" },
        { title: "No Successor", value: stats.no_successor || 0, icon: <ExclamationTriangleIcon className="w-5 h-5" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    // Permissions using HRMAC
    const canCreate = hrmCanCreate('hrm.succession') || isSuperAdmin();
    const canEdit = hrmCanUpdate('hrm.succession') || isSuperAdmin();
    const canDelete = hrmCanDelete('hrm.succession') || isSuperAdmin();

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.succession.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters,
                }
            });
            if (response.status === 200) {
                setPlans(response.data.plans || []);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (error) {
            showToast.error('Failed to fetch succession plans');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.succession.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchStats();
    }, []);

    // Handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const openAddModal = () => {
        setEditingPlan(null);
        setFormData({
            title: '',
            designation_id: '',
            department_id: '',
            current_holder_id: '',
            description: '',
            priority: 'medium',
            risk_level: 'medium',
            status: 'draft',
            target_date: '',
            notes: '',
        });
        setModalOpen(true);
    };

    const openEditModal = (plan) => {
        setEditingPlan(plan);
        setFormData({
            title: plan.title || '',
            designation_id: plan.designation_id?.toString() || '',
            department_id: plan.department_id?.toString() || '',
            current_holder_id: plan.current_holder_id?.toString() || '',
            description: plan.description || '',
            priority: plan.priority || 'medium',
            risk_level: plan.risk_level || 'medium',
            status: plan.status || 'draft',
            target_date: plan.target_date || '',
            notes: plan.notes || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = editingPlan
                    ? route('hrm.succession.update', editingPlan.id)
                    : route('hrm.succession.store');
                const method = editingPlan ? 'put' : 'post';

                const response = await axios[method](url, formData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Success']);
                    setModalOpen(false);
                    fetchData();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: editingPlan ? 'Updating succession plan...' : 'Creating succession plan...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this succession plan?')) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.succession.destroy', id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Deleted']);
                    fetchData();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to delete');
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting...',
            success: (data) => data.join(', '),
            error: (data) => data,
        });
    };

    // Priority colors
    const priorityColorMap = {
        critical: 'danger',
        high: 'warning',
        medium: 'primary',
        low: 'default',
    };

    // Risk colors
    const riskColorMap = {
        high: 'danger',
        medium: 'warning',
        low: 'success',
    };

    // Status colors
    const statusColorMap = {
        draft: 'default',
        active: 'success',
        on_hold: 'warning',
        completed: 'primary',
        cancelled: 'danger',
    };

    // Table columns
    const columns = [
        { uid: 'title', name: 'Position' },
        { uid: 'department', name: 'Department' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'risk', name: 'Risk' },
        { uid: 'candidates', name: 'Candidates' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        {item.designation && (
                            <p className="text-xs text-default-500">{item.designation.title}</p>
                        )}
                    </div>
                );
            case 'department':
                return <span className="text-default-600">{item.department?.name || '-'}</span>;
            case 'priority':
                return (
                    <Chip size="sm" color={priorityColorMap[item.priority]} variant="flat">
                        {item.priority}
                    </Chip>
                );
            case 'risk':
                return (
                    <Chip size="sm" color={riskColorMap[item.risk_level]} variant="flat">
                        {item.risk_level}
                    </Chip>
                );
            case 'candidates':
                return (
                    <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold">{item.candidates?.length || 0}</span>
                        <span className="text-default-500 text-sm">
                            ({item.candidates?.filter(c => c.readiness_level === 'ready_now').length || 0} ready)
                        </span>
                    </div>
                );
            case 'status':
                return (
                    <Chip size="sm" color={statusColorMap[item.status]} variant="flat">
                        {item.status?.replace('_', ' ')}
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
                                onPress={() => window.location.href = route('hrm.succession.show', item.id)}
                            >
                                View Details
                            </DropdownItem>
                            {canEdit && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openEditModal(item)}
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
    };

    return (
        <>
            <Head title={title} />

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onOpenChange={setModalOpen}
                size="2xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader>
                        <h2 className="text-lg font-semibold">
                            {editingPlan ? 'Edit Succession Plan' : 'Create Succession Plan'}
                        </h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Title"
                                placeholder="Enter position title"
                                value={formData.title}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, title: v }))}
                                isRequired
                                radius={themeRadius}
                                className="md:col-span-2"
                            />

                            <Select
                                label="Department"
                                placeholder="Select department"
                                selectedKeys={formData.department_id ? [formData.department_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, department_id: Array.from(keys)[0] || '' }))}
                                radius={themeRadius}
                            >
                                {departments?.map(d => (
                                    <SelectItem key={String(d.id)}>{d.name}</SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Designation"
                                placeholder="Select designation"
                                selectedKeys={formData.designation_id ? [formData.designation_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, designation_id: Array.from(keys)[0] || '' }))}
                                radius={themeRadius}
                            >
                                {designations?.map(d => (
                                    <SelectItem key={String(d.id)}>{d.name}</SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Priority"
                                selectedKeys={[formData.priority]}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, priority: Array.from(keys)[0] || 'medium' }))}
                                radius={themeRadius}
                                isRequired
                            >
                                <SelectItem key="critical">Critical</SelectItem>
                                <SelectItem key="high">High</SelectItem>
                                <SelectItem key="medium">Medium</SelectItem>
                                <SelectItem key="low">Low</SelectItem>
                            </Select>

                            <Select
                                label="Risk Level"
                                selectedKeys={[formData.risk_level]}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, risk_level: Array.from(keys)[0] || 'medium' }))}
                                radius={themeRadius}
                                isRequired
                            >
                                <SelectItem key="high">High</SelectItem>
                                <SelectItem key="medium">Medium</SelectItem>
                                <SelectItem key="low">Low</SelectItem>
                            </Select>

                            <Select
                                label="Status"
                                selectedKeys={[formData.status]}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] || 'draft' }))}
                                radius={themeRadius}
                                isRequired
                            >
                                <SelectItem key="draft">Draft</SelectItem>
                                <SelectItem key="active">Active</SelectItem>
                                <SelectItem key="on_hold">On Hold</SelectItem>
                                <SelectItem key="completed">Completed</SelectItem>
                                <SelectItem key="cancelled">Cancelled</SelectItem>
                            </Select>

                            <Input
                                type="date"
                                label="Target Date"
                                value={formData.target_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                                radius={themeRadius}
                            />

                            <Textarea
                                label="Description"
                                placeholder="Enter description"
                                value={formData.description}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
                                radius={themeRadius}
                                className="md:col-span-2"
                            />

                            <Textarea
                                label="Notes"
                                placeholder="Additional notes"
                                value={formData.notes}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, notes: v }))}
                                radius={themeRadius}
                                className="md:col-span-2"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={formLoading}>
                            {editingPlan ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <StandardPageLayout
                title="Succession Planning"
                subtitle="Manage talent pipeline and critical positions"
                icon={<UserGroupIcon className="w-8 h-8" />}
                actions={
                    canCreate && (
                        <Button
                            color="primary"
                            variant="shadow"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={openAddModal}
                        >
                            Add Plan
                        </Button>
                    )
                }
                stats={<StatsCards stats={statsData} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search positions..."
                            value={filters.search}
                            onValueChange={(v) => handleFilterChange('search', v)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        />

                        <Select
                            placeholder="All Priorities"
                            selectedKeys={filters.priority ? [filters.priority] : []}
                            onSelectionChange={(keys) => handleFilterChange('priority', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="critical">Critical</SelectItem>
                            <SelectItem key="high">High</SelectItem>
                            <SelectItem key="medium">Medium</SelectItem>
                            <SelectItem key="low">Low</SelectItem>
                        </Select>

                        <Select
                            placeholder="All Statuses"
                            selectedKeys={filters.status ? [filters.status] : []}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="draft">Draft</SelectItem>
                            <SelectItem key="active">Active</SelectItem>
                            <SelectItem key="on_hold">On Hold</SelectItem>
                            <SelectItem key="completed">Completed</SelectItem>
                        </Select>

                        <Select
                            placeholder="All Departments"
                            selectedKeys={filters.department_id ? [filters.department_id] : []}
                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            {departments?.map(d => (
                                <SelectItem key={String(d.id)}>{d.name}</SelectItem>
                            ))}
                        </Select>
                    </div>
                }
                ariaLabel="Succession Planning"
            >
                {/* Table */}
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
                        aria-label="Succession Plans"
                        isHeaderSticky
                        classNames={{
                            wrapper: "shadow-none border border-divider rounded-lg",
                            th: "bg-default-100 text-default-600 font-semibold",
                            td: "py-3"
                        }}
                    >
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={plans} emptyContent="No succession plans found">
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
                {pagination.lastPage > 1 && (
                    <div className="flex justify-center mt-6">
                        <Pagination
                            total={pagination.lastPage}
                            page={pagination.currentPage}
                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                            showControls
                            radius={themeRadius}
                        />
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

SuccessionPlanningIndex.layout = (page) => <App children={page} />;
export default SuccessionPlanningIndex;
