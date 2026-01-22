import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {
    Button, 
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
    Avatar,
    Progress,
    Tabs,
    Tab
} from "@heroui/react";
import {
    BanknotesIcon,
    CalculatorIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusIcon,
    ScaleIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import {showToast} from '@/utils/toastUtils.jsx';
import axios from 'axios';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const CompensationIndex = ({title}) => {
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
    const [compensationReviews, setCompensationReviews] = useState([]);
    const [activeTab, setActiveTab] = useState('reviews');
    const [stats, setStats] = useState({
        total_reviews: 0,
        active_reviews: 0,
        pending_adjustments: 0,
        approved_adjustments: 0,
        total_budget: 0,
        utilized_budget: 0
    });
    const [pagination, setPagination] = useState({perPage: 15, currentPage: 1, total: 0, lastPage: 1});
    const [filters, setFilters] = useState({search: '', status: '', year: new Date().getFullYear()});
    const [departments, setDepartments] = useState([]);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        review_cycle_year: new Date().getFullYear(),
        effective_date: '',
        budget_amount: '',
        budget_currency: 'USD',
        guidelines: '',
        merit_increase_pool_percent: '',
        promotion_pool_percent: '',
        market_adjustment_pool_percent: '',
        status: 'draft'
    });

    // Permission checks using HRMAC
    const canCreate = hrmCanCreate('hrm.compensation') || isSuperAdmin();
    const canEdit = hrmCanUpdate('hrm.compensation') || isSuperAdmin();
    const canDelete = hrmCanDelete('hrm.compensation') || isSuperAdmin();
    const canApprove = hasAccess('hrm.compensation.approve') || isSuperAdmin();

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        {
            title: "Review Cycles",
            value: stats.total_reviews,
            icon: <CalculatorIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Compensation cycles"
        },
        {
            title: "Active",
            value: stats.active_reviews,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Currently in progress"
        },
        {
            title: "Pending Approval",
            value: stats.pending_adjustments,
            icon: <ScaleIcon className="w-6 h-6" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Awaiting approval"
        },
        {
            title: "Approved",
            value: stats.approved_adjustments,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Adjustments approved"
        },
        {
            title: "Budget Utilized",
            value: stats.total_budget > 0 
                ? `${((stats.utilized_budget / stats.total_budget) * 100).toFixed(1)}%`
                : '0%',
            icon: <BanknotesIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: `$${(stats.utilized_budget || 0).toLocaleString()} of $${(stats.total_budget || 0).toLocaleString()}`
        }
    ], [stats]);

    // Fetch data
    const fetchCompensationReviews = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.compensation.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                const data = response.data.items;
                setCompensationReviews(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch compensation reviews'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.compensation.stats'));
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
        fetchCompensationReviews();
    }, [fetchCompensationReviews]);

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
                const endpoint = selectedReview
                    ? route('hrm.compensation.update', selectedReview.id)
                    : route('hrm.compensation.store');
                const method = selectedReview ? 'put' : 'post';
                
                const response = await axios[method](endpoint, formData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Compensation review saved successfully']);
                    setShowAddModal(false);
                    setShowEditModal(false);
                    fetchCompensationReviews();
                    fetchStats();
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save compensation review']);
            }
        });

        showToast.promise(promise, {
            loading: selectedReview ? 'Updating review...' : 'Creating review...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? Object.values(data).flat().join(', ') : data
        });
    };

    const handleDelete = async (review) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.compensation.destroy', review.id));
                if (response.status === 200) {
                    resolve(['Compensation review deleted successfully']);
                    fetchCompensationReviews();
                    fetchStats();
                }
            } catch (error) {
                reject(['Failed to delete compensation review']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting review...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', ')
        });
    };

    const resetForm = () => {
        setSelectedReview(null);
        setFormData({
            name: '',
            review_cycle_year: new Date().getFullYear(),
            effective_date: '',
            budget_amount: '',
            budget_currency: 'USD',
            guidelines: '',
            merit_increase_pool_percent: '',
            promotion_pool_percent: '',
            market_adjustment_pool_percent: '',
            status: 'draft'
        });
    };

    const statusColorMap = {
        draft: 'default',
        planning: 'primary',
        in_progress: 'warning',
        under_review: 'secondary',
        approved: 'success',
        completed: 'success',
        cancelled: 'danger'
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount || 0);
    };

    const columns = [
        {uid: 'name', name: 'Review Cycle'},
        {uid: 'year', name: 'Year'},
        {uid: 'budget', name: 'Budget'},
        {uid: 'utilization', name: 'Utilization'},
        {uid: 'adjustments', name: 'Adjustments'},
        {uid: 'status', name: 'Status'},
        {uid: 'actions', name: 'Actions'}
    ];

    const renderCell = (review, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{review.name}</span>
                        {review.effective_date && (
                            <span className="text-xs text-default-500">
                                Effective: {new Date(review.effective_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                );
            case 'year':
                return (
                    <Chip variant="bordered" size="sm">
                        {review.review_cycle_year}
                    </Chip>
                );
            case 'budget':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {formatCurrency(review.budget_amount, review.budget_currency)}
                        </span>
                        <span className="text-xs text-default-400">
                            {review.budget_currency}
                        </span>
                    </div>
                );
            case 'utilization':
                const utilization = review.budget_amount > 0 
                    ? ((review.utilized_amount || 0) / review.budget_amount) * 100 
                    : 0;
                return (
                    <div className="w-24">
                        <Progress 
                            value={utilization} 
                            size="sm" 
                            color={utilization > 90 ? 'danger' : utilization > 70 ? 'warning' : 'success'}
                        />
                        <span className="text-xs text-default-500">{utilization.toFixed(1)}%</span>
                    </div>
                );
            case 'adjustments':
                return (
                    <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat" color="success">
                            {review.approved_adjustments_count || 0} approved
                        </Chip>
                        {(review.pending_adjustments_count || 0) > 0 && (
                            <Chip size="sm" variant="flat" color="warning">
                                {review.pending_adjustments_count} pending
                            </Chip>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <Chip color={statusColorMap[review.status]} variant="flat" size="sm">
                        {review.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                                    setSelectedReview(review);
                                    setShowViewModal(true);
                                }}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="analytics" 
                                startContent={<ChartBarIcon className="w-4 h-4" />}
                            >
                                View Analytics
                            </DropdownItem>
                            {canEdit && ['draft', 'planning'].includes(review.status) && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => {
                                        setSelectedReview(review);
                                        setFormData({
                                            name: review.name,
                                            review_cycle_year: review.review_cycle_year,
                                            effective_date: review.effective_date || '',
                                            budget_amount: review.budget_amount || '',
                                            budget_currency: review.budget_currency || 'USD',
                                            guidelines: review.guidelines || '',
                                            merit_increase_pool_percent: review.merit_increase_pool_percent || '',
                                            promotion_pool_percent: review.promotion_pool_percent || '',
                                            market_adjustment_pool_percent: review.market_adjustment_pool_percent || '',
                                            status: review.status
                                        });
                                        setShowEditModal(true);
                                    }}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && review.status === 'draft' && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger" 
                                    startContent={<XCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(review)}
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
            <Head title={title || "Compensation Planning"} />
            
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
                            {selectedReview ? 'Edit Compensation Review' : 'Create Compensation Review'}
                        </h2>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Review Name"
                                placeholder="e.g., Annual Compensation Review 2024"
                                value={formData.name}
                                onValueChange={(v) => setFormData(p => ({...p, name: v}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <Input
                                label="Review Cycle Year"
                                type="number"
                                value={formData.review_cycle_year}
                                onValueChange={(v) => setFormData(p => ({...p, review_cycle_year: v}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <Input
                                label="Effective Date"
                                type="date"
                                value={formData.effective_date}
                                onChange={(e) => setFormData(p => ({...p, effective_date: e.target.value}))}
                                isRequired
                                radius={themeRadius}
                            />
                            <div className="flex gap-2">
                                <Input
                                    label="Total Budget"
                                    type="number"
                                    value={formData.budget_amount}
                                    onValueChange={(v) => setFormData(p => ({...p, budget_amount: v}))}
                                    startContent={<CurrencyDollarIcon className="w-4 h-4 text-default-400" />}
                                    isRequired
                                    radius={themeRadius}
                                    className="flex-1"
                                />
                                <Select
                                    label="Currency"
                                    selectedKeys={[formData.budget_currency]}
                                    onSelectionChange={(keys) => setFormData(p => ({...p, budget_currency: Array.from(keys)[0]}))}
                                    radius={themeRadius}
                                    className="w-24"
                                >
                                    <SelectItem key="USD">USD</SelectItem>
                                    <SelectItem key="EUR">EUR</SelectItem>
                                    <SelectItem key="GBP">GBP</SelectItem>
                                    <SelectItem key="CAD">CAD</SelectItem>
                                </Select>
                            </div>
                            <Input
                                label="Merit Increase Pool %"
                                type="number"
                                value={formData.merit_increase_pool_percent}
                                onValueChange={(v) => setFormData(p => ({...p, merit_increase_pool_percent: v}))}
                                endContent={<span className="text-default-400">%</span>}
                                radius={themeRadius}
                            />
                            <Input
                                label="Promotion Pool %"
                                type="number"
                                value={formData.promotion_pool_percent}
                                onValueChange={(v) => setFormData(p => ({...p, promotion_pool_percent: v}))}
                                endContent={<span className="text-default-400">%</span>}
                                radius={themeRadius}
                            />
                            <Input
                                label="Market Adjustment Pool %"
                                type="number"
                                value={formData.market_adjustment_pool_percent}
                                onValueChange={(v) => setFormData(p => ({...p, market_adjustment_pool_percent: v}))}
                                endContent={<span className="text-default-400">%</span>}
                                radius={themeRadius}
                            />
                            <Select
                                label="Status"
                                selectedKeys={[formData.status]}
                                onSelectionChange={(keys) => setFormData(p => ({...p, status: Array.from(keys)[0]}))}
                                radius={themeRadius}
                            >
                                <SelectItem key="draft">Draft</SelectItem>
                                <SelectItem key="planning">Planning</SelectItem>
                                <SelectItem key="in_progress">In Progress</SelectItem>
                            </Select>
                            <div className="md:col-span-2">
                                <Textarea
                                    label="Guidelines"
                                    placeholder="Enter compensation review guidelines and policies..."
                                    value={formData.guidelines}
                                    onValueChange={(v) => setFormData(p => ({...p, guidelines: v}))}
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
                            {selectedReview ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Compensation Planning"
                subtitle="Manage salary reviews, adjustments, and compensation budgets"
                icon={<BanknotesIcon className="w-8 h-8" />}
                actions={
                    canCreate && (
                        <Button 
                            color="primary" 
                            variant="shadow"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={() => setShowAddModal(true)}
                        >
                            New Review Cycle
                        </Button>
                    )
                }
                stats={<StatsCards stats={statsData} isLoading={loading} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search reviews..."
                            value={filters.search}
                            onValueChange={(v) => handleFilterChange('search', v)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        />
                        <Select
                            placeholder="All Statuses"
                            selectedKeys={filters.status ? [filters.status] : []}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="draft">Draft</SelectItem>
                            <SelectItem key="planning">Planning</SelectItem>
                            <SelectItem key="in_progress">In Progress</SelectItem>
                            <SelectItem key="under_review">Under Review</SelectItem>
                            <SelectItem key="approved">Approved</SelectItem>
                            <SelectItem key="completed">Completed</SelectItem>
                        </Select>
                        <Select
                            placeholder="Year"
                            selectedKeys={filters.year ? [String(filters.year)] : []}
                            onSelectionChange={(keys) => handleFilterChange('year', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-[120px]"
                        >
                            {[2024, 2025, 2026].map(year => (
                                <SelectItem key={String(year)}>{year}</SelectItem>
                            ))}
                        </Select>
                    </div>
                }
                ariaLabel="Compensation Planning"
            >
                {/* Tabs */}
                <Tabs 
                    selectedKey={activeTab} 
                    onSelectionChange={setActiveTab}
                    className="mb-6"
                >
                    <Tab key="reviews" title="Review Cycles" />
                    <Tab key="adjustments" title="Pending Adjustments" />
                    <Tab key="analytics" title="Analytics" />
                </Tabs>

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
                            aria-label="Compensation reviews table"
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
                                items={compensationReviews} 
                                emptyContent="No compensation reviews found"
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
            </StandardPageLayout>
        </>
    );
};

CompensationIndex.layout = (page) => <App children={page} />;
export default CompensationIndex;
