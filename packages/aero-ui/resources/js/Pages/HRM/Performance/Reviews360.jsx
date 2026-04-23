import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Progress, Avatar, Tabs, Tab } from "@heroui/react";
import { 
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    StarIcon,
    ClockIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    ChartBarIcon,
    PlayIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const Reviews360 = ({ title, employees: initialEmployees = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
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
    const [statsLoading, setStatsLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees);
    const [filters, setFilters] = useState({ search: '', employee: '', status: '', cycle: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        active: 0, 
        completed: 0, 
        pending: 0,
        avgScore: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false, launch: false });
    const [selectedReview, setSelectedReview] = useState(null);
    const [activeTab, setActiveTab] = useState('reviews');
    const [formData, setFormData] = useState({
        employee_id: '',
        reviewers: [],
        review_cycle: '',
        due_date: '',
        instructions: '',
        competencies: [],
        questions: []
    });

    // Permission checks
    const canCreateReview = canCreate('hrm.performance.360_reviews') || isSuperAdmin();
    const canUpdateReview = canUpdate('hrm.performance.360_reviews') || isSuperAdmin();
    const canDeleteReview = canDelete('hrm.performance.360_reviews') || isSuperAdmin();
    const canLaunchReview = canUpdate('hrm.performance.360_reviews') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Reviews", 
            value: stats.total, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active", 
            value: stats.active, 
            icon: <PlayIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Completed", 
            value: stats.completed, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Avg Score", 
            value: stats.avgScore ? `${stats.avgScore}/5` : 'N/A', 
            icon: <StarIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Review statuses
    const reviewStatuses = [
        { key: 'draft', label: 'Draft', color: 'default' },
        { key: 'active', label: 'Active', color: 'warning' },
        { key: 'completed', label: 'Completed', color: 'success' },
        { key: 'expired', label: 'Expired', color: 'danger' },
    ];

    const getStatusColor = (status) => {
        return reviewStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return reviewStatuses.find(s => s.key === status)?.label || status;
    };

    // Sample competencies for 360 review
    const defaultCompetencies = [
        'Leadership',
        'Communication',
        'Teamwork',
        'Problem Solving',
        'Initiative',
        'Adaptability',
        'Technical Skills',
        'Customer Focus'
    ];

    // Data fetching
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.360-reviews.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setReviews(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch 360° reviews'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.360-reviews.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch 360 review stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
        fetchStats();
    }, [fetchReviews, fetchStats]);

    // Modal handlers
    const openModal = (type, review = null) => {
        setSelectedReview(review);
        if (review) {
            setFormData({
                employee_id: review.employee_id || '',
                reviewers: review.reviewers || [],
                review_cycle: review.review_cycle || '',
                due_date: review.due_date || '',
                instructions: review.instructions || '',
                competencies: review.competencies || defaultCompetencies,
                questions: review.questions || []
            });
        } else {
            setFormData({
                employee_id: '',
                reviewers: [],
                review_cycle: '',
                due_date: '',
                instructions: '',
                competencies: defaultCompetencies,
                questions: []
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedReview(null);
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedReview 
                    ? route('hrm.performance.360-reviews.update', selectedReview.id)
                    : route('hrm.performance.360-reviews.store');
                
                const method = selectedReview ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `360° Review ${selectedReview ? 'updated' : 'created'} successfully`]);
                    fetchReviews();
                    fetchStats();
                    closeModal(selectedReview ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedReview ? 'update' : 'create'} 360° review`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedReview ? 'Updating' : 'Creating'} 360° review...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Launch review handler
    const handleLaunch = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('hrm.performance.360-reviews.launch', selectedReview.id)
                );
                if (response.status === 200) {
                    resolve([response.data.message || '360° Review launched successfully']);
                    fetchReviews();
                    fetchStats();
                    closeModal('launch');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to launch 360° review']);
            }
        });

        showToast.promise(promise, {
            loading: 'Launching 360° review...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(
                    route('hrm.performance.360-reviews.destroy', selectedReview.id)
                );
                if (response.status === 200) {
                    resolve([response.data.message || '360° Review deleted successfully']);
                    fetchReviews();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete 360° review']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting 360° review...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'reviewers', name: 'Reviewers' },
        { uid: 'cycle', name: 'Cycle' },
        { uid: 'progress', name: 'Progress' },
        { uid: 'due_date', name: 'Due Date' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar size="sm" name={item.employee?.name} />
                        <div>
                            <p className="font-medium">{item.employee?.name}</p>
                            <p className="text-small text-default-500">{item.employee?.designation?.name}</p>
                        </div>
                    </div>
                );
            case 'reviewers':
                return (
                    <div className="flex items-center gap-1">
                        <span className="text-small text-default-600">
                            {item.total_reviewers || 0} reviewers
                        </span>
                        {item.completed_reviews && (
                            <span className="text-small text-default-500">
                                ({item.completed_reviews}/{item.total_reviewers})
                            </span>
                        )}
                    </div>
                );
            case 'cycle':
                return item.review_cycle || 'N/A';
            case 'progress':
                const completionRate = item.total_reviewers > 0 
                    ? Math.round((item.completed_reviews / item.total_reviewers) * 100) 
                    : 0;
                return (
                    <div className="flex items-center gap-2">
                        <Progress 
                            value={completionRate} 
                            size="sm" 
                            className="w-20"
                            color={completionRate === 100 ? 'success' : completionRate > 50 ? 'warning' : 'default'}
                        />
                        <span className="text-small text-default-600">{completionRate}%</span>
                    </div>
                );
            case 'due_date':
                return item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A';
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(item.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(item.status)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex gap-1">
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light"
                            onPress={() => openModal('view', item)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {item.status === 'draft' && canLaunchReview && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                color="primary"
                                onPress={() => openModal('launch', item)}
                            >
                                <PlayIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canUpdateReview && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteReview && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light" 
                                color="danger"
                                onPress={() => openModal('delete', item)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return item[columnKey] || '-';
        }
    }, [canUpdateReview, canDeleteReview, canLaunchReview]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="3xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedReview ? 'Edit 360° Review' : 'Create 360° Review'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Employee"
                                        placeholder="Select employee"
                                        selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, employee_id: Array.from(keys)[0] || '' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {employees.map(employee => (
                                            <SelectItem key={employee.id}>{employee.name} - {employee.designation?.name}</SelectItem>
                                        ))}
                                    </Select>
                                    
                                    <Input
                                        label="Review Cycle"
                                        placeholder="e.g., Q4 2025, Annual 2025"
                                        value={formData.review_cycle}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, review_cycle: value }))}
                                        radius={themeRadius}
                                    />
                                </div>

                                <Input
                                    type="date"
                                    label="Due Date"
                                    value={formData.due_date}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, due_date: value }))}
                                    radius={themeRadius}
                                />

                                <Textarea
                                    label="Instructions for Reviewers"
                                    placeholder="Enter instructions for the reviewers about the review process..."
                                    value={formData.instructions}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, instructions: value }))}
                                    rows={4}
                                    radius={themeRadius}
                                />

                                <div>
                                    <label className="text-sm font-medium text-default-600 mb-2 block">
                                        Competencies to Evaluate
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {defaultCompetencies.map(competency => (
                                            <label key={competency} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.competencies.includes(competency)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                competencies: [...prev.competencies, competency]
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                competencies: prev.competencies.filter(c => c !== competency)
                                                            }));
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm">{competency}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedReview ? 'Update' : 'Create'} Review
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedReview && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">360° Review Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Employee</label>
                                        <p className="text-default-900">{selectedReview.employee?.name}</p>
                                        <p className="text-small text-default-500">{selectedReview.employee?.designation?.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Review Cycle</label>
                                        <p className="text-default-900">{selectedReview.review_cycle || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Due Date</label>
                                        <p className="text-default-900">
                                            {selectedReview.due_date ? new Date(selectedReview.due_date).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Status</label>
                                        <Chip 
                                            color={getStatusColor(selectedReview.status)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStatusLabel(selectedReview.status)}
                                        </Chip>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600">Review Progress</label>
                                    <div className="mt-2">
                                        <Progress 
                                            value={selectedReview.total_reviewers > 0 
                                                ? Math.round((selectedReview.completed_reviews / selectedReview.total_reviewers) * 100) 
                                                : 0
                                            }
                                            className="mb-2"
                                            color="primary"
                                        />
                                        <p className="text-small text-default-600">
                                            {selectedReview.completed_reviews || 0} of {selectedReview.total_reviewers || 0} reviews completed
                                        </p>
                                    </div>
                                </div>

                                {selectedReview.instructions && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Instructions</label>
                                        <p className="text-default-900 mt-1 text-sm bg-default-100 p-3 rounded">
                                            {selectedReview.instructions}
                                        </p>
                                    </div>
                                )}

                                {selectedReview.competencies && selectedReview.competencies.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Competencies</label>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {selectedReview.competencies.map(competency => (
                                                <Chip key={competency} size="sm" variant="flat" color="primary">
                                                    {competency}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedReview.average_score && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Overall Score</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <StarIcon 
                                                        key={star} 
                                                        className={`w-5 h-5 ${
                                                            star <= selectedReview.average_score 
                                                                ? 'text-warning fill-warning' 
                                                                : 'text-default-300'
                                                        }`} 
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-lg font-medium">{selectedReview.average_score}/5</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.launch && selectedReview && (
                <Modal isOpen={modalStates.launch} onOpenChange={() => closeModal('launch')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-primary">Launch 360° Review</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you ready to launch the 360° review for <strong>{selectedReview.employee?.name}</strong>?</p>
                            <p className="text-sm text-default-500">
                                All assigned reviewers will be notified and the review will become active. Review settings cannot be modified after launch.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('launch')}>Cancel</Button>
                            <Button color="primary" onPress={handleLaunch}>Launch Review</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedReview && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete 360° Review</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete this 360° review for <strong>{selectedReview.employee?.name}</strong>?</p>
                            <p className="text-sm text-default-500">This action cannot be undone and will remove all associated review data.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="360° Reviews Management">
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
                                                    <UserGroupIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        360° Reviews
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Multi-source feedback and performance reviews
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateReview && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Review
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search reviews..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Employees"
                                            selectedKeys={filters.employee ? [filters.employee] : []}
                                            onSelectionChange={(keys) => handleFilterChange('employee', Array.from(keys)[0] || '')}
                                        >
                                            {employees.map(employee => (
                                                <SelectItem key={employee.id}>{employee.name}</SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {reviewStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="360° Reviews" 
                                        classNames={{
                                            wrapper: "shadow-none border border-divider rounded-lg",
                                            th: "bg-default-100 text-default-600 font-semibold",
                                            td: "py-3"
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                        </TableHeader>
                                        <TableBody 
                                            items={reviews} 
                                            emptyContent={loading ? "Loading..." : "No 360° reviews found"}
                                            isLoading={loading}
                                        >
                                            {(item) => (
                                                <TableRow key={item.id}>
                                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    
                                    {pagination.total > pagination.perPage && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                                showControls
                                                showShadow
                                                color="primary"
                                                size={isMobile ? "sm" : "md"}
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

Reviews360.layout = (page) => <App children={page} />;
export default Reviews360;