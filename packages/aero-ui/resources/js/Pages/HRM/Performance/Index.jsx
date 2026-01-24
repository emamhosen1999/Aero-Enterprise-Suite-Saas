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

const PerformanceIndex = ({ title, employees: initialEmployees, templates: initialTemplates }) => {
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
    const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        template_id: '',
        review_period: '',
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

    useEffect(() => {
        fetchReviews();
        fetchStats();
        fetchEmployees();
    }, [fetchReviews, fetchStats, fetchEmployees]);

    // CRUD handlers
    const handleView = (review) => {
        window.location.href = route('hrm.performance.show', review.id);
    };
    
    const handleEdit = (review) => {
        window.location.href = route('hrm.performance.edit', review.id);
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
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.performance.store'), formData);
                resolve(['Performance review created successfully']);
                setCreateModalOpen(false);
                setFormData({ employee_id: '', template_id: '', review_period: '', notes: '' });
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
            <Modal isOpen={createModalOpen} onOpenChange={setCreateModalOpen} size="lg">
                <ModalContent>
                    <ModalHeader>Create Performance Review</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
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
                            
                            {templates.length > 0 && (
                                <Select
                                    label="Review Template"
                                    placeholder="Select template (optional)"
                                    selectedKeys={formData.template_id ? [formData.template_id] : []}
                                    onSelectionChange={(keys) => setFormData(prev => ({ ...prev, template_id: Array.from(keys)[0] }))}
                                    radius={themeRadius}
                                >
                                    {templates.map(template => (
                                        <SelectItem key={String(template.id)} value={String(template.id)}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                            
                            <Input
                                type="month"
                                label="Review Period"
                                value={formData.review_period}
                                onChange={(e) => setFormData(prev => ({ ...prev, review_period: e.target.value }))}
                                radius={themeRadius}
                            />
                            
                            <Textarea
                                label="Notes"
                                placeholder="Additional notes..."
                                value={formData.notes}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                                radius={themeRadius}
                                minRows={3}
                            />
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
