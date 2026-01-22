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
    Avatar,
    Progress
} from "@heroui/react";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlayIcon,
    PlusIcon,
    StarIcon,
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

const Feedback360Index = ({title}) => {
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
    const [feedbackReviews, setFeedbackReviews] = useState([]);
    const [stats, setStats] = useState({
        total_reviews: 0,
        active_reviews: 0,
        completed_reviews: 0,
        pending_responses: 0,
        average_score: 0
    });
    const [pagination, setPagination] = useState({perPage: 15, currentPage: 1, total: 0, lastPage: 1});
    const [filters, setFilters] = useState({search: '', status: ''});
    const [employees, setEmployees] = useState([]);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        employee_id: '',
        title: '',
        description: '',
        competencies_to_evaluate: [],
        questions: [],
        self_assessment_required: true,
        manager_assessment_required: true,
        peer_assessment_required: true,
        direct_report_assessment_required: false,
        min_peer_reviewers: 3,
        max_peer_reviewers: 5,
        is_anonymous: true,
        start_date: '',
        end_date: ''
    });

    // Permission checks using HRMAC
    const canCreate = hrmCanCreate('hrm.feedback-360') || isSuperAdmin();
    const canEdit = hrmCanUpdate('hrm.feedback-360') || isSuperAdmin();
    const canDelete = hrmCanDelete('hrm.feedback-360') || isSuperAdmin();

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        {
            title: "Total Reviews",
            value: stats.total_reviews,
            icon: <UsersIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All 360° feedback reviews"
        },
        {
            title: "Active",
            value: stats.active_reviews,
            icon: <PlayIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Currently in progress"
        },
        {
            title: "Completed",
            value: stats.completed_reviews,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Finished reviews"
        },
        {
            title: "Pending Responses",
            value: stats.pending_responses,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Awaiting feedback"
        },
        {
            title: "Avg. Score",
            value: stats.average_score?.toFixed(1) || '0.0',
            icon: <StarIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Average rating"
        }
    ], [stats]);

    // Fetch data
    const fetchFeedbackReviews = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.feedback-360.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                const data = response.data.items;
                setFeedbackReviews(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch 360° feedback reviews'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.feedback-360.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.employees.list'));
            if (response.status === 200) {
                setEmployees(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, []);

    useEffect(() => {
        fetchFeedbackReviews();
    }, [fetchFeedbackReviews]);

    useEffect(() => {
        fetchStats();
        fetchEmployees();
    }, [fetchStats, fetchEmployees]);

    // Handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, currentPage: 1}));
    };

    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedFeedback
                    ? route('hrm.feedback-360.update', selectedFeedback.id)
                    : route('hrm.feedback-360.store');
                const method = selectedFeedback ? 'put' : 'post';
                
                const response = await axios[method](endpoint, formData);
                if (response.status === 200) {
                    resolve([response.data.message || '360° feedback saved successfully']);
                    setShowAddModal(false);
                    setShowEditModal(false);
                    fetchFeedbackReviews();
                    fetchStats();
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save 360° feedback']);
            }
        });

        showToast.promise(promise, {
            loading: selectedFeedback ? 'Updating review...' : 'Creating review...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? Object.values(data).flat().join(', ') : data
        });
    };

    const handleLaunch = async (feedback) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.feedback-360.launch', feedback.id));
                if (response.status === 200) {
                    resolve(['360° feedback review launched successfully']);
                    fetchFeedbackReviews();
                    fetchStats();
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to launch review']);
            }
        });

        showToast.promise(promise, {
            loading: 'Launching review...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', ')
        });
    };

    const handleDelete = async (feedback) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.feedback-360.destroy', feedback.id));
                if (response.status === 200) {
                    resolve(['360° feedback deleted successfully']);
                    fetchFeedbackReviews();
                    fetchStats();
                }
            } catch (error) {
                reject(['Failed to delete 360° feedback']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting review...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', ')
        });
    };

    const resetForm = () => {
        setSelectedFeedback(null);
        setFormData({
            employee_id: '',
            title: '',
            description: '',
            competencies_to_evaluate: [],
            questions: [],
            self_assessment_required: true,
            manager_assessment_required: true,
            peer_assessment_required: true,
            direct_report_assessment_required: false,
            min_peer_reviewers: 3,
            max_peer_reviewers: 5,
            is_anonymous: true,
            start_date: '',
            end_date: ''
        });
    };

    const statusColorMap = {
        draft: 'default',
        active: 'success',
        completed: 'secondary',
        cancelled: 'danger'
    };

    const columns = [
        {uid: 'employee', name: 'Employee'},
        {uid: 'title', name: 'Review Title'},
        {uid: 'status', name: 'Status'},
        {uid: 'responses', name: 'Responses'},
        {uid: 'score', name: 'Score'},
        {uid: 'dates', name: 'Period'},
        {uid: 'actions', name: 'Actions'}
    ];

    const renderCell = (feedback, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            name={`${feedback.employee?.first_name || ''} ${feedback.employee?.last_name || ''}`}
                            size="sm"
                        />
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                                {feedback.employee?.first_name} {feedback.employee?.last_name}
                            </span>
                            <span className="text-xs text-default-500">
                                {feedback.employee?.designation?.title}
                            </span>
                        </div>
                    </div>
                );
            case 'title':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{feedback.title}</span>
                        {feedback.is_anonymous && (
                            <Chip size="sm" variant="flat" className="mt-1">Anonymous</Chip>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <Chip color={statusColorMap[feedback.status]} variant="flat" size="sm">
                        {feedback.status?.charAt(0).toUpperCase() + feedback.status?.slice(1)}
                    </Chip>
                );
            case 'responses':
                return (
                    <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4 text-default-400" />
                        <span>{feedback.responses_count || 0}</span>
                    </div>
                );
            case 'score':
                return feedback.overall_score 
                    ? (
                        <div className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-warning" />
                            <span className="font-medium">{feedback.overall_score.toFixed(1)}</span>
                        </div>
                    )
                    : <span className="text-default-400">-</span>;
            case 'dates':
                return (
                    <div className="flex flex-col text-xs">
                        <span>{feedback.start_date ? new Date(feedback.start_date).toLocaleDateString() : '-'}</span>
                        <span className="text-default-400">to {feedback.end_date ? new Date(feedback.end_date).toLocaleDateString() : '-'}</span>
                    </div>
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
                                    setSelectedFeedback(feedback);
                                    setShowViewModal(true);
                                }}
                            >
                                View Details
                            </DropdownItem>
                            {feedback.status === 'draft' && canEdit && (
                                <DropdownItem 
                                    key="launch" 
                                    startContent={<PlayIcon className="w-4 h-4" />}
                                    onPress={() => handleLaunch(feedback)}
                                >
                                    Launch Review
                                </DropdownItem>
                            )}
                            {canEdit && feedback.status === 'draft' && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => {
                                        setSelectedFeedback(feedback);
                                        setFormData({
                                            employee_id: feedback.employee_id,
                                            title: feedback.title,
                                            description: feedback.description || '',
                                            competencies_to_evaluate: feedback.competencies_to_evaluate || [],
                                            questions: feedback.questions || [],
                                            self_assessment_required: feedback.self_assessment_required,
                                            manager_assessment_required: feedback.manager_assessment_required,
                                            peer_assessment_required: feedback.peer_assessment_required,
                                            direct_report_assessment_required: feedback.direct_report_assessment_required,
                                            min_peer_reviewers: feedback.min_peer_reviewers || 3,
                                            max_peer_reviewers: feedback.max_peer_reviewers || 5,
                                            is_anonymous: feedback.is_anonymous,
                                            start_date: feedback.start_date || '',
                                            end_date: feedback.end_date || ''
                                        });
                                        setShowEditModal(true);
                                    }}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger" 
                                    startContent={<XCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(feedback)}
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
            <Head title={title || "360° Feedback"} />
            
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
                            {selectedFeedback ? 'Edit 360° Feedback' : 'Create 360° Feedback'}
                        </h2>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Employee"
                                placeholder="Select employee"
                                selectedKeys={formData.employee_id ? [String(formData.employee_id)] : []}
                                onSelectionChange={(keys) => setFormData(p => ({...p, employee_id: Array.from(keys)[0]}))}
                                isRequired
                                radius={themeRadius}
                            >
                                {employees.map(emp => (
                                    <SelectItem key={String(emp.id)}>
                                        {emp.first_name} {emp.last_name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Input
                                label="Review Title"
                                placeholder="e.g., Q4 2024 360° Review"
                                value={formData.title}
                                onValueChange={(v) => setFormData(p => ({...p, title: v}))}
                                isRequired
                                radius={themeRadius}
                            />
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
                            <div className="md:col-span-2">
                                <Textarea
                                    label="Description"
                                    placeholder="Describe the purpose of this 360° review..."
                                    value={formData.description}
                                    onValueChange={(v) => setFormData(p => ({...p, description: v}))}
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
                            {selectedFeedback ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="360° Feedback Management">
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
                                                    <ArrowPathIcon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{color: 'var(--theme-primary)'}} 
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        360° Feedback
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Multi-rater feedback for comprehensive performance insights
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
                                                        New 360° Review
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search reviews..."
                                            value={filters.search}
                                            onValueChange={(v) => handleFilterChange('search', v)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                        />
                                        <Select
                                            placeholder="All Statuses"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                        >
                                            <SelectItem key="draft">Draft</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="completed">Completed</SelectItem>
                                            <SelectItem key="cancelled">Cancelled</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Table */}
                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({length: 5}).map((_, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <Skeleton className="h-12 w-12 rounded-full" />
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
                                                aria-label="360° Feedback reviews table"
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
                                                    items={feedbackReviews} 
                                                    emptyContent="No 360° feedback reviews found"
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

Feedback360Index.layout = (page) => <App children={page} />;
export default Feedback360Index;
