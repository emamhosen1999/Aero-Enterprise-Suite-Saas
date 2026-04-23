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
    Tabs,
    Tab,
    Card,
    CardBody
} from "@heroui/react";
import { 
    GiftIcon,
    HeartIcon,
    BanknotesIcon,
    ShieldCheckIcon,
    PlusIcon,
    ArrowPathIcon,
    UserGroupIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import BenefitsTable from '@/Tables/HRM/BenefitsTable.jsx';
import BenefitForm from '@/Forms/HRM/BenefitForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const BenefitsIndex = ({ title, employees: initialEmployees, benefitTypes: initialBenefitTypes }) => {
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
    const [benefits, setBenefits] = useState([]);
    const [benefitPlans, setBenefitPlans] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [benefitTypes, setBenefitTypes] = useState(initialBenefitTypes || []);
    const [activeTab, setActiveTab] = useState('enrollments');
    const [stats, setStats] = useState({ 
        total_plans: 0, 
        active_enrollments: 0, 
        pending_enrollments: 0,
        total_cost: 0 
    });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', type: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, benefit: null });

    // Permissions using HRMAC
    const canCreateBenefit = canCreate('hrm.compensation.benefits') || isSuperAdmin();
    const canEditBenefit = canUpdate('hrm.compensation.benefits') || isSuperAdmin();
    const canDeleteBenefit = canDelete('hrm.compensation.benefits') || isSuperAdmin();
    const canManagePlans = hasAccess('hrm.compensation.benefits') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Benefit Plans", value: stats.total_plans, icon: <GiftIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Active Enrollments", value: stats.active_enrollments, icon: <UserGroupIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Pending", value: stats.pending_enrollments, icon: <ShieldCheckIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Monthly Cost", value: `$${(stats.total_cost || 0).toLocaleString()}`, icon: <BanknotesIcon className="w-6 h-6" />, color: "text-info", iconBg: "bg-info/20" },
    ], [stats]);

    // Fetch benefits/enrollments
    const fetchBenefits = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'plans' ? 'hrm.benefits.plans.index' : 'hrm.benefits.enrollments.index';
            const response = await axios.get(route(endpoint), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    type: filters.type || undefined,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                },
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.benefits || response.data.enrollments || response.data;
                setBenefits(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch benefits:', error);
            showToast.error('Failed to fetch benefits');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage, activeTab]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.benefits.stats'));
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

    // Fetch benefit plans
    const fetchBenefitPlans = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.benefits.plans.list'));
            if (response.status === 200) setBenefitPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch benefit plans:', error);
        }
    }, []);

    useEffect(() => {
        fetchBenefits();
        fetchStats();
        fetchEmployees();
        fetchBenefitPlans();
    }, [fetchBenefits, fetchStats, fetchEmployees, fetchBenefitPlans]);

    // Handle tab change
    const handleTabChange = (key) => {
        setActiveTab(key);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        setFilters({ search: '', type: '', status: [] });
    };

    // CRUD handlers
    const handleView = (benefit) => {
        setModalState({ type: 'view', benefit });
    };
    
    const handleEdit = (benefit) => {
        setModalState({ type: 'edit', benefit });
    };
    
    const handleDelete = async (benefit) => {
        const itemType = activeTab === 'plans' ? 'benefit plan' : 'enrollment';
        if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;
        
        const endpoint = activeTab === 'plans' 
            ? route('hrm.benefits.plans.destroy', benefit.id)
            : route('hrm.benefits.enrollments.destroy', benefit.id);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(endpoint);
                resolve([`${itemType} deleted successfully`]);
                fetchBenefits();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || `Failed to delete ${itemType}`]);
            }
        });
        
        showToast.promise(promise, {
            loading: `Deleting ${itemType}...`,
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleApprove = async (enrollment) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.benefits.enrollments.approve', enrollment.id));
                resolve(['Enrollment approved']);
                fetchBenefits();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to approve enrollment']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Approving enrollment...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Form submit handler
    const handleFormSubmit = async (formData) => {
        const isEdit = modalState.type === 'edit';
        const isEnrollment = activeTab === 'enrollments' || formData.employee_id;
        
        let url, method;
        if (isEnrollment) {
            url = isEdit 
                ? route('hrm.benefits.enrollments.update', modalState.benefit.id) 
                : route('hrm.benefits.enrollments.store');
        } else {
            url = isEdit 
                ? route('hrm.benefits.plans.update', modalState.benefit.id) 
                : route('hrm.benefits.plans.store');
        }
        method = isEdit ? 'put' : 'post';
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios[method](url, formData);
                resolve([`Benefit ${isEdit ? 'updated' : 'created'} successfully`]);
                setModalState({ type: null, benefit: null });
                fetchBenefits();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} benefit`]);
            }
        });
        
        showToast.promise(promise, {
            loading: `${isEdit ? 'Updating' : 'Creating'} benefit...`,
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

    const closeModal = () => setModalState({ type: null, benefit: null });

    const permissions = {
        canCreate: canCreateBenefit,
        canEdit: canEditBenefit,
        canDelete: canDeleteBenefit,
        canApprove: canManagePlans
    };

    const benefitTypeOptions = benefitTypes.length > 0 ? benefitTypes : [
        { key: 'health', label: 'Health Insurance' },
        { key: 'dental', label: 'Dental Insurance' },
        { key: 'vision', label: 'Vision Insurance' },
        { key: 'life', label: 'Life Insurance' },
        { key: 'retirement', label: 'Retirement/401k' },
        { key: 'disability', label: 'Disability Insurance' },
        { key: 'wellness', label: 'Wellness Program' },
        { key: 'transport', label: 'Transport Allowance' },
        { key: 'education', label: 'Education Assistance' },
        { key: 'other', label: 'Other' }
    ];

    return (
        <>
            <Head title={title || "Benefits & Compensation"} />
            
            {/* Create/Edit Modal */}
            <Modal 
                isOpen={modalState.type === 'create' || modalState.type === 'edit'} 
                onOpenChange={closeModal} 
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        {modalState.type === 'edit' 
                            ? `Edit ${activeTab === 'plans' ? 'Benefit Plan' : 'Enrollment'}` 
                            : `Create ${activeTab === 'plans' ? 'Benefit Plan' : 'Enrollment'}`}
                    </ModalHeader>
                    <ModalBody>
                        <BenefitForm
                            benefit={modalState.benefit}
                            employees={employees}
                            benefitPlans={benefitPlans}
                            benefitTypes={benefitTypeOptions}
                            mode={activeTab === 'plans' ? 'plan' : 'enrollment'}
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
                    <ModalHeader>{modalState.benefit?.name || modalState.benefit?.plan?.name}</ModalHeader>
                    <ModalBody>
                        {modalState.benefit && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {activeTab === 'enrollments' && (
                                        <>
                                            <div>
                                                <span className="text-default-500">Employee</span>
                                                <p className="font-medium">{modalState.benefit.employee?.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-default-500">Plan</span>
                                                <p className="font-medium">{modalState.benefit.plan?.name}</p>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <span className="text-default-500">Type</span>
                                        <p className="font-medium">{modalState.benefit.type || modalState.benefit.plan?.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Status</span>
                                        <p className="font-medium capitalize">{modalState.benefit.status}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Coverage Amount</span>
                                        <p className="font-medium">${modalState.benefit.coverage_amount?.toLocaleString() || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Monthly Cost</span>
                                        <p className="font-medium">${modalState.benefit.monthly_cost?.toLocaleString() || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Start Date</span>
                                        <p className="font-medium">{modalState.benefit.start_date || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">End Date</span>
                                        <p className="font-medium">{modalState.benefit.end_date || 'Ongoing'}</p>
                                    </div>
                                </div>
                                
                                {modalState.benefit.description && (
                                    <div>
                                        <span className="text-default-500 text-sm">Description</span>
                                        <p className="mt-1">{modalState.benefit.description}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={closeModal}>Close</Button>
                        {permissions.canApprove && modalState.benefit?.status === 'pending' && (
                            <Button color="success" onPress={() => handleApprove(modalState.benefit)}>
                                Approve Enrollment
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Benefits & Compensation"
                subtitle="Manage employee benefits, insurance, and compensation packages"
                icon={<HeartIcon />}
                isLoading={loading && statsLoading}
                ariaLabel="Benefits Management"
                actions={
                    <div className="flex gap-2">
                        <Button 
                            isIconOnly 
                            variant="flat" 
                            onPress={() => { fetchBenefits(); fetchStats(); }}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                        {canCreateBenefit && (
                            <Button 
                                color="primary" 
                                variant="shadow" 
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => setModalState({ type: 'create', benefit: null })}
                            >
                                {activeTab === 'plans' ? 'New Plan' : 'Enroll Employee'}
                            </Button>
                        )}
                    </div>
                }
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={
                    <div className="space-y-4">
                        <Tabs 
                            selectedKey={activeTab} 
                            onSelectionChange={handleTabChange}
                            variant="underlined"
                            color="primary"
                        >
                            <Tab key="enrollments" title="Enrollments" />
                            <Tab key="plans" title="Benefit Plans" />
                        </Tabs>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input 
                                label="Search" 
                                placeholder={`Search ${activeTab}...`}
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
                                label="Type" 
                                placeholder="All Types" 
                                variant="bordered" 
                                size="sm" 
                                radius={themeRadius}
                                selectedKeys={filters.type ? [filters.type] : []}
                                onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || '')}
                                className="w-full sm:w-48"
                            >
                                {benefitTypeOptions.map(type => (
                                    <SelectItem key={type.key}>{type.label}</SelectItem>
                                ))}
                            </Select>
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
                                <SelectItem key="active">Active</SelectItem>
                                <SelectItem key="pending">Pending</SelectItem>
                                <SelectItem key="expired">Expired</SelectItem>
                                <SelectItem key="cancelled">Cancelled</SelectItem>
                            </Select>
                        </div>
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
                <BenefitsTable
                    data={benefits}
                    loading={loading}
                    mode={activeTab}
                    permissions={permissions}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                />
            </StandardPageLayout>
        </>
    );
};

BenefitsIndex.layout = (page) => <App children={page} />;
export default BenefitsIndex;
