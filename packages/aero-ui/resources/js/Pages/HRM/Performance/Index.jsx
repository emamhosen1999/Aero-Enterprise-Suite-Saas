import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    PlusIcon,
    ArrowPathIcon,
    StarIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import PerformanceReviewsTable from '@/Tables/HRM/PerformanceReviewsTable.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { router } from '@inertiajs/react';

const PerformanceIndex = ({ title, employees: initialEmployees, templates: initialTemplates, departments: initialDepartments }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
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
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [templates, setTemplates] = useState(initialTemplates || []);
    const [departments, setDepartments] = useState(initialDepartments || []);
    const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        reviewer_id: auth?.user?.id?.toString() || '', // Default to current user as reviewer
        template_id: '',
        review_period_start: '',
        review_period_end: '',
        review_date: new Date().toISOString().split('T')[0], // Default to today
        department_id: '',
        status: 'scheduled',
        notes: ''
    });

    // Permissions using HRMAC with proper path
    const canCreateReview = canCreate('hrm.performance') || isSuperAdmin();
    const canEditReview = canUpdate('hrm.performance') || isSuperAdmin();
    const canDeleteReview = canDelete('hrm.performance') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Total Reviews", value: stats.total, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "In Progress", value: stats.in_progress, icon: <ChartBarIcon className="w-6 h-6" />, color: "text-info", iconBg: "bg-info/20" },
        { title: "Completed", value: stats.completed, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    // Fetch reviews
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.index'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                },
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.reviews || response.data;
                setReviews(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            showToast.error('Failed to fetch performance reviews');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.stats'));
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

    // Fetch departments if not provided
    const fetchDepartments = useCallback(async () => {
        if (departments.length > 0) return;
        try {
            const response = await axios.get(route('hrm.departments.index'), {
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.departments || response.data.data || response.data;
                setDepartments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    }, [departments.length]);

    // Fetch templates if not provided
    const fetchTemplates = useCallback(async () => {
        if (templates.length > 0) return;
        try {
            const response = await axios.get(route('hrm.performance.templates.index'), {
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.templates || response.data.data || response.data;
                setTemplates(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    }, [templates.length]);

    useEffect(() => {
        fetchReviews();
        fetchStats();
        fetchEmployees();
        fetchDepartments();
        fetchTemplates();
    }, [fetchReviews, fetchStats, fetchEmployees, fetchDepartments, fetchTemplates]);

    // CRUD handlers
    const handleView = (review) => {
        router.visit(route('hrm.performance.show', review.id));
    };
    
    const handleEdit = (review) => {
        router.visit(route('hrm.performance.edit', review.id));
    };
    
    const handleDelete = async (review) => {
        if (!confirm(`Are you sure you want to delete this performance review?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.performance.destroy', review.id));
                resolve(['Performance review deleted successfully']);
                fetchReviews();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete review']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Deleting review...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleApprove = async (review) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.performance.approve', review.id));
                resolve(['Performance review approved']);
                fetchReviews();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to approve review']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Approving review...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Create new review
    const handleCreate = async () => {
        if (!formData.employee_id) {
            showToast.error('Please select an employee');
            return;
        }
        if (!formData.reviewer_id) {
            showToast.error('Please select a reviewer');
            return;
        }
        if (!formData.department_id) {
            showToast.error('Please select a department');
            return;
        }
        if (!formData.template_id) {
            showToast.error('Please select a review template');
            return;
        }
        if (!formData.review_period_start || !formData.review_period_end) {
            showToast.error('Please specify the review period');
            return;
        }
        if (!formData.review_date) {
            showToast.error('Please specify the review date');
            return;
        }
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.performance.store'), formData);
                resolve(['Performance review created successfully']);
                setCreateModalOpen(false);
                setFormData({ 
                    employee_id: '', 
                    reviewer_id: auth?.user?.id?.toString() || '',
                    template_id: '', 
                    review_period_start: '',
                    review_period_end: '',
                    review_date: new Date().toISOString().split('T')[0],
                    department_id: '',
                    status: 'scheduled',
                    notes: '' 
                });
                fetchReviews();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to create review']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Creating review...',
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

    const permissions = {
        canCreate: canCreateReview,
        canEdit: canEditReview,
        canDelete: canDeleteReview,
        canApprove: canEditReview
    };

    return (
        <>
            <Head title={title || "Performance Management"} />
            
            {/* Create Modal */}
            <Modal isOpen={createModalOpen} onOpenChange={setCreateModalOpen} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>Create Performance Review</ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Employee"
                                placeholder="Select employee"
                                selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, employee_id: Array.from(keys)[0] }))}
                                radius={themeRadius}
                                isRequired
                            >
                                {employees.map(emp => (
                                    <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                        {emp.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            
                            <Select
                                label="Reviewer"
                                placeholder="Select reviewer"
                                selectedKeys={formData.reviewer_id ? [formData.reviewer_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, reviewer_id: Array.from(keys)[0] }))}
                                radius={themeRadius}
                                isRequired
                            >
                                {employees.map(emp => (
                                    <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                        {emp.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            
                            <Select
                                label="Department"
                                placeholder="Select department"
                                selectedKeys={formData.department_id ? [formData.department_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, department_id: Array.from(keys)[0] }))}
                                radius={themeRadius}
                                isRequired
                            >
                                {departments.map(dept => (
                                    <SelectItem key={String(dept.id)} value={String(dept.id)}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            
                            <Select
                                label="Review Template"
                                placeholder="Select template"
                                selectedKeys={formData.template_id ? [formData.template_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, template_id: Array.from(keys)[0] }))}
                                radius={themeRadius}
                                isRequired
                            >
                                {templates.map(template => (
                                    <SelectItem key={String(template.id)} value={String(template.id)}>
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            
                            <Input
                                type="date"
                                label="Review Period Start"
                                value={formData.review_period_start}
                                onChange={(e) => setFormData(prev => ({ ...prev, review_period_start: e.target.value }))}
                                radius={themeRadius}
                                isRequired
                            />
                            
                            <Input
                                type="date"
                                label="Review Period End"
                                value={formData.review_period_end}
                                onChange={(e) => setFormData(prev => ({ ...prev, review_period_end: e.target.value }))}
                                radius={themeRadius}
                                isRequired
                            />
                            
                            <Input
                                type="date"
                                label="Review Date"
                                description="Scheduled date for the review"
                                value={formData.review_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))}
                                radius={themeRadius}
                                isRequired
                            />
                            
                            <Select
                                label="Status"
                                placeholder="Select status"
                                selectedKeys={formData.status ? [formData.status] : ['scheduled']}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] }))}
                                radius={themeRadius}
                                isRequired
                            >
                                <SelectItem key="scheduled">Scheduled</SelectItem>
                                <SelectItem key="in_progress">In Progress</SelectItem>
                                <SelectItem key="pending_acknowledgment">Pending Acknowledgment</SelectItem>
                                <SelectItem key="completed">Completed</SelectItem>
                                <SelectItem key="cancelled">Cancelled</SelectItem>
                            </Select>
                            
                            <div className="md:col-span-2">
                                <Textarea
                                    label="Notes"
                                    placeholder="Additional notes about this review..."
                                    value={formData.notes}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                                    radius={themeRadius}
                                    minRows={3}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setCreateModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleCreate}>Create Review</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Performance Reviews"
                subtitle="Manage employee performance evaluations"
                icon={<StarIcon />}
                isLoading={loading && statsLoading}
                ariaLabel="Performance Management"
                actions={
                    <div className="flex gap-2">
                        <Button 
                            isIconOnly 
                            variant="flat" 
                            onPress={() => { fetchReviews(); fetchStats(); }}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                        {canCreateReview && (
                            <Button 
                                color="primary" 
                                variant="shadow" 
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => setCreateModalOpen(true)}
                            >
                                New Review
                            </Button>
                        )}
                    </div>
                }
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            label="Search" 
                            placeholder="Search reviews..." 
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
                            <SelectItem key="draft">Draft</SelectItem>
                            <SelectItem key="pending">Pending</SelectItem>
                            <SelectItem key="in_progress">In Progress</SelectItem>
                            <SelectItem key="completed">Completed</SelectItem>
                            <SelectItem key="approved">Approved</SelectItem>
                        </Select>
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
                <PerformanceReviewsTable
                    data={reviews}
                    loading={loading}
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

PerformanceIndex.layout = (page) => <App children={page} />;
export default PerformanceIndex;
