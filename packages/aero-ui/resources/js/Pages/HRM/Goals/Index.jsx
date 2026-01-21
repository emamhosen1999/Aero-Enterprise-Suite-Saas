import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
    Button, 
    Input, 
    Select, 
    SelectItem, 
    Pagination, 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Textarea,
    Progress,
    Chip
} from "@heroui/react";
import { 
    FlagIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusIcon,
    ArrowPathIcon,
    ChartBarIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import GoalsTable from '@/Tables/HRM/GoalsTable.jsx';
import GoalForm from '@/Forms/HRM/GoalForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const GoalsIndex = ({ title, employees: initialEmployees, categories: initialCategories }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin, hasAccess } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
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

    // Data state
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [goals, setGoals] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [categories, setCategories] = useState(initialCategories || []);
    const [stats, setStats] = useState({ 
        total: 0, 
        in_progress: 0, 
        completed: 0, 
        overdue: 0,
        on_track: 0 
    });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [], category: '', employee_id: '' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, goal: null });

    // Permissions using HRMAC
    const canCreateGoal = canCreate('hrm.performance.goals') || isSuperAdmin();
    const canEditGoal = canUpdate('hrm.performance.goals') || isSuperAdmin();
    const canDeleteGoal = canDelete('hrm.performance.goals') || isSuperAdmin();
    const canViewAll = hasAccess('hrm.performance.goals') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Total Goals", value: stats.total, icon: <FlagIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "In Progress", value: stats.in_progress, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Completed", value: stats.completed, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Overdue", value: stats.overdue, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    // Fetch goals
    const fetchGoals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.goals.index'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined,
                    category: filters.category || undefined,
                    employee_id: filters.employee_id || undefined
                },
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.goals || response.data;
                setGoals(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            showToast.error('Failed to fetch goals');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.goals.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Fetch employees if not provided
    const fetchEmployees = useCallback(async () => {
        if (employees.length > 0) return;
        try {
            const response = await axios.get(route('hrm.employees.list'));
            if (response.status === 200) setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, [employees.length]);

    useEffect(() => {
        fetchGoals();
        fetchStats();
        fetchEmployees();
    }, [fetchGoals, fetchStats, fetchEmployees]);

    // CRUD handlers
    const handleView = (goal) => {
        setModalState({ type: 'view', goal });
    };
    
    const handleEdit = (goal) => {
        setModalState({ type: 'edit', goal });
    };
    
    const handleDelete = async (goal) => {
        if (!confirm(`Are you sure you want to delete the goal "${goal.title}"?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.goals.destroy', goal.id));
                resolve(['Goal deleted successfully']);
                fetchGoals();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete goal']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Deleting goal...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleUpdateProgress = async (goal, progress) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.patch(route('hrm.goals.update-progress', goal.id), { progress });
                resolve(['Progress updated']);
                fetchGoals();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to update progress']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Updating progress...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleComplete = async (goal) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.goals.complete', goal.id));
                resolve(['Goal marked as completed']);
                fetchGoals();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to complete goal']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Completing goal...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Form submit handler
    const handleFormSubmit = async (formData) => {
        const isEdit = modalState.type === 'edit';
        const url = isEdit 
            ? route('hrm.goals.update', modalState.goal.id) 
            : route('hrm.goals.store');
        const method = isEdit ? 'put' : 'post';
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios[method](url, formData);
                resolve([`Goal ${isEdit ? 'updated' : 'created'} successfully`]);
                setModalState({ type: null, goal: null });
                fetchGoals();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} goal`]);
            }
        });
        
        showToast.promise(promise, {
            loading: `${isEdit ? 'Updating' : 'Creating'} goal...`,
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Pagination handler
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Filter handler
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const closeModal = () => setModalState({ type: null, goal: null });

    const permissions = {
        canCreate: canCreateGoal,
        canEdit: canEditGoal,
        canDelete: canDeleteGoal,
        canComplete: canEditGoal
    };

    return (
        <>
            <Head title={title || "Goals & OKRs"} />
            
            {/* Create/Edit Modal */}
            <Modal 
                isOpen={modalState.type === 'create' || modalState.type === 'edit'} 
                onOpenChange={closeModal} 
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        {modalState.type === 'edit' ? 'Edit Goal' : 'Create Goal'}
                    </ModalHeader>
                    <ModalBody>
                        <GoalForm
                            goal={modalState.goal}
                            employees={employees}
                            categories={categories}
                            onSubmit={handleFormSubmit}
                            onCancel={closeModal}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* View Modal */}
            <Modal 
                isOpen={modalState.type === 'view'} 
                onOpenChange={closeModal} 
                size="xl"
            >
                <ModalContent>
                    <ModalHeader>{modalState.goal?.title}</ModalHeader>
                    <ModalBody>
                        {modalState.goal && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Chip
                                        color={
                                            modalState.goal.status === 'completed' ? 'success' :
                                            modalState.goal.status === 'in_progress' ? 'warning' :
                                            modalState.goal.status === 'overdue' ? 'danger' : 'default'
                                        }
                                        size="sm"
                                    >
                                        {modalState.goal.status?.replace('_', ' ')}
                                    </Chip>
                                    {modalState.goal.category && (
                                        <Chip variant="flat" size="sm">{modalState.goal.category}</Chip>
                                    )}
                                </div>
                                
                                <p className="text-default-600">{modalState.goal.description}</p>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{modalState.goal.progress}%</span>
                                    </div>
                                    <Progress 
                                        value={modalState.goal.progress} 
                                        color={modalState.goal.progress >= 100 ? 'success' : 'primary'}
                                        radius={themeRadius}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-default-500">Start Date</span>
                                        <p className="font-medium">{modalState.goal.start_date}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Due Date</span>
                                        <p className="font-medium">{modalState.goal.due_date}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Owner</span>
                                        <p className="font-medium">{modalState.goal.employee?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Weight</span>
                                        <p className="font-medium">{modalState.goal.weight}%</p>
                                    </div>
                                </div>
                                
                                {modalState.goal.key_results?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Key Results</h4>
                                        <div className="space-y-2">
                                            {modalState.goal.key_results.map((kr, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    <CheckCircleIcon className={`w-4 h-4 ${kr.completed ? 'text-success' : 'text-default-300'}`} />
                                                    <span>{kr.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={closeModal}>Close</Button>
                        {canEditGoal && modalState.goal?.status !== 'completed' && (
                            <Button color="success" onPress={() => handleComplete(modalState.goal)}>
                                Mark Complete
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Goals & OKRs"
                subtitle="Set and track employee goals and objectives"
                icon={<FlagIcon />}
                isLoading={loading && statsLoading}
                ariaLabel="Goals Management"
                actions={
                    <div className="flex gap-2">
                        <Button 
                            isIconOnly 
                            variant="flat" 
                            onPress={() => { fetchGoals(); fetchStats(); }}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                        {canCreateGoal && (
                            <Button 
                                color="primary" 
                                variant="shadow" 
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => setModalState({ type: 'create', goal: null })}
                            >
                                New Goal
                            </Button>
                        )}
                    </div>
                }
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            label="Search" 
                            placeholder="Search goals..." 
                            value={filters.search} 
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
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
                            <SelectItem key="not_started">Not Started</SelectItem>
                            <SelectItem key="in_progress">In Progress</SelectItem>
                            <SelectItem key="completed">Completed</SelectItem>
                            <SelectItem key="overdue">Overdue</SelectItem>
                            <SelectItem key="on_hold">On Hold</SelectItem>
                        </Select>
                        {canViewAll && (
                            <Select 
                                label="Employee" 
                                placeholder="All Employees" 
                                variant="bordered" 
                                size="sm" 
                                radius={themeRadius}
                                selectedKeys={filters.employee_id ? [filters.employee_id] : []}
                                onSelectionChange={(keys) => handleFilterChange('employee_id', Array.from(keys)[0] || '')}
                                className="w-full sm:w-48"
                            >
                                {employees.map(emp => (
                                    <SelectItem key={String(emp.id)}>{emp.name}</SelectItem>
                                ))}
                            </Select>
                        )}
                    </div>
                }
                pagination={
                    pagination.lastPage > 1 && (
                        <div className="flex justify-center">
                            <Pagination
                                total={pagination.lastPage}
                                page={pagination.currentPage}
                                onChange={handlePageChange}
                                showControls
                                radius={themeRadius}
                            />
                        </div>
                    )
                }
            >
                <GoalsTable
                    data={goals}
                    loading={loading}
                    permissions={permissions}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                    onUpdateProgress={handleUpdateProgress}
                />
            </StandardPageLayout>
        </>
    );
};

export default GoalsIndex;
