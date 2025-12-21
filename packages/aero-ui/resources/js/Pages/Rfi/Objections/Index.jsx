import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import {
    ShieldExclamationIcon,
    PlusIcon,
    ChartBarIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    AdjustmentsHorizontalIcon,
    UserIcon,
    MapPinIcon,
    ArrowPathIcon,
    LinkIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    ChevronDownIcon,
    DocumentArrowUpIcon,
    PhotoIcon,
    DocumentIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import {
    CheckCircleIcon as CheckCircleSolid,
    XCircleIcon as XCircleSolid,
    ClockIcon as ClockSolid,
    ExclamationTriangleIcon as ExclamationTriangleSolid,
    ShieldExclamationIcon as ShieldExclamationSolid,
} from '@heroicons/react/24/solid';
import { Head, router, usePage } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import {
    Card,
    CardHeader,
    CardBody,
    Input,
    Button,
    Spinner,
    ScrollShadow,
    Skeleton,
    Select,
    SelectItem,
    ButtonGroup,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    Checkbox,
    CheckboxGroup,
    useDisclosure
} from "@heroui/react";
import StatsCards from "@/Components/StatsCards.jsx";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { getThemeRadius } from '@/Hooks/useThemeRadius.js';
import ErrorBoundary from "@/Components/Common/ErrorBoundary.jsx";
import PullToRefresh from "@/Components/Common/PullToRefresh.jsx";
import SwipeableCard from '@/Components/Common/SwipeableCard';
import ProfileAvatar from '@/Components/ProfileAvatar';

// Status configuration
const statusConfig = {
    'draft': {
        color: 'default',
        icon: ClockSolid,
        label: 'Draft',
    },
    'submitted': {
        color: 'primary',
        icon: DocumentArrowUpIcon,
        label: 'Submitted',
    },
    'under_review': {
        color: 'warning',
        icon: ExclamationTriangleSolid,
        label: 'Under Review',
    },
    'resolved': {
        color: 'success',
        icon: CheckCircleSolid,
        label: 'Resolved',
    },
    'rejected': {
        color: 'danger',
        icon: XCircleSolid,
        label: 'Rejected',
    },
};

// Category configuration
const categoryConfig = {
    'design_conflict': { label: 'Design Conflict', color: 'danger' },
    'site_mismatch': { label: 'Site Mismatch', color: 'warning' },
    'material_change': { label: 'Material Change', color: 'secondary' },
    'safety_concern': { label: 'Safety Concern', color: 'danger' },
    'specification_error': { label: 'Spec Error', color: 'primary' },
    'other': { label: 'Other', color: 'default' },
};

const ObjectionsIndex = ({ objections: initialObjections, filters, statuses, categories, creators, statistics }) => {
    const { auth } = usePage().props;
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Role-based access control
    const userIsAdmin = auth.roles?.includes('Administrator') ||
                        auth.roles?.includes('Super Administrator') ||
                        auth.roles?.includes('Daily Work Manager') || false;

    const canReviewObjections = auth.roles?.some(role =>
        ['Super Administrator', 'Administrator', 'Project Manager', 'Consultant', 'HR Manager'].includes(role)
    );

    // AbortController ref for cancelling in-flight requests
    const abortControllerRef = useRef(null);

    // Pull-to-refresh state for mobile
    const [isRefreshing, setIsRefreshing] = useState(false);

    // State
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const [currentPage, setCurrentPage] = useState(initialObjections?.current_page || 1);
    const [expandedItems, setExpandedItems] = useState(new Set());
    
    // Local objections state for smooth updates without page reload
    const [objections, setObjections] = useState(initialObjections);
    
    // Sync with props when they change (e.g., on page navigation)
    useEffect(() => {
        setObjections(initialObjections);
    }, [initialObjections]);

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [filterData, setFilterData] = useState({
        status: filters?.status || 'all',
        category: filters?.category || 'all',
        creator: filters?.creator || '',
    });

    // Create modal state
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const [createLoading, setCreateLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [createForm, setCreateForm] = useState({
        title: '',
        category: 'other',
        chainage_from: '',
        chainage_to: '',
        description: '',
        reason: '',
        status: 'draft',
    });

    // File handlers for create modal
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
        event.target.value = ''; // Reset input
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const resetCreateForm = () => {
        setCreateForm({
            title: '',
            category: 'other',
            chainage_from: '',
            chainage_to: '',
            description: '',
            reason: '',
            status: 'draft',
        });
        setSelectedFiles([]);
    };

    // Attach RFIs modal state
    const { isOpen: isAttachOpen, onOpen: onAttachOpen, onClose: onAttachClose } = useDisclosure();
    const [selectedObjection, setSelectedObjection] = useState(null);
    const [suggestedRfis, setSuggestedRfis] = useState([]);
    const [selectedRfis, setSelectedRfis] = useState([]);
    const [attachLoading, setAttachLoading] = useState(false);
    const [rfiSearchLoading, setRfiSearchLoading] = useState(false);
    const [rfiSearchQuery, setRfiSearchQuery] = useState('');

    // Edit modal state
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const [editLoading, setEditLoading] = useState(false);
    const [editObjection, setEditObjection] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        category: 'other',
        chainage_from: '',
        chainage_to: '',
        description: '',
        reason: '',
    });

    // Status update modal state
    const { isOpen: isStatusOpen, onOpen: onStatusOpen, onClose: onStatusClose } = useDisclosure();
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusAction, setStatusAction] = useState(null); // 'submit', 'review', 'resolve', 'reject'
    const [resolutionNotes, setResolutionNotes] = useState('');

    // History modal state
    const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
    const [historyObjection, setHistoryObjection] = useState(null);

    // Statistics state
    const [apiStats, setApiStats] = useState(statistics || null);

    // Cancel any in-flight request before starting a new one
    const cancelPendingRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        return abortControllerRef.current.signal;
    }, []);

    // Build filter params for API calls
    const buildFilterParams = useCallback(() => {
        const params = {};
        if (search) params.search = search;
        if (filterData.status && filterData.status !== 'all') params.status = filterData.status;
        if (filterData.category && filterData.category !== 'all') params.category = filterData.category;
        if (filterData.creator) params.creator = filterData.creator;
        params.page = currentPage;
        return params;
    }, [search, filterData, currentPage]);

    // Fetch data
    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setTableLoading(true);

        const params = buildFilterParams();

        router.get(route('objections.index'), params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setTableLoading(false);
                setIsRefreshing(false);
            }
        });
    }, [buildFilterParams]);

    // Refresh data
    const refreshData = useCallback(() => {
        setCurrentPage(1);
        fetchData();
    }, [fetchData]);

    // Pull-to-refresh handler for mobile
    const handlePullToRefresh = useCallback(async () => {
        if (isRefreshing || !isMobile) return;
        setIsRefreshing(true);
        refreshData();
        showToast.success('Data refreshed');
    }, [isRefreshing, isMobile, refreshData]);

    // Debounced search handler
    const searchTimeoutRef = useRef(null);
    const handleSearch = (event) => {
        const value = event.target.value;
        setSearch(value);
        setCurrentPage(1);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            fetchData();
        }, 300);
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilterData(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Toggle expanded state
    const toggleExpanded = (id) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    // Get status chip
    const getStatusChip = (status) => {
        const config = statusConfig[status] || statusConfig['draft'];
        const StatusIcon = config.icon;

        return (
            <Chip
                size="sm"
                variant="flat"
                color={config.color}
                startContent={<StatusIcon className="w-3 h-3" />}
                classNames={{
                    base: "h-6",
                    content: "text-xs font-medium"
                }}
            >
                {config.label}
            </Chip>
        );
    };

    // Get category chip
    const getCategoryChip = (category) => {
        const config = categoryConfig[category] || categoryConfig['other'];
        return (
            <Chip size="sm" variant="flat" color={config.color} className="text-xs">
                {config.label}
            </Chip>
        );
    };

    // Create objection
    const handleCreateObjection = async () => {
        if (!createForm.title || !createForm.description || !createForm.reason) {
            showToast.error('Please fill in all required fields');
            return;
        }

        setCreateLoading(true);
        try {
            // Use FormData to support file uploads
            const formData = new FormData();
            formData.append('title', createForm.title);
            formData.append('category', createForm.category);
            formData.append('description', createForm.description);
            formData.append('reason', createForm.reason);
            formData.append('status', createForm.status);
            if (createForm.chainage_from) {
                formData.append('chainage_from', createForm.chainage_from);
            }
            if (createForm.chainage_to) {
                formData.append('chainage_to', createForm.chainage_to);
            }
            
            // Append files
            selectedFiles.forEach((file) => {
                formData.append('files[]', file);
            });

            const response = await axios.post(route('objections.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast.success(response.data.message || 'Objection created successfully');
            onCreateClose();
            resetCreateForm();
            router.reload({ only: ['objections', 'statistics'] });
        } catch (error) {
            showToast.error(error.response?.data?.error || 'Failed to create objection');
        } finally {
            setCreateLoading(false);
        }
    };

    // Suggest RFIs by chainage or search
    const handleSuggestRfis = async (chainageFrom, chainageTo, searchQuery = '') => {
        setRfiSearchLoading(true);
        try {
            const params = {};
            if (chainageFrom) params.chainage_from = chainageFrom;
            if (chainageTo) params.chainage_to = chainageTo;
            if (searchQuery) params.search = searchQuery;
            
            const response = await axios.get(route('objections.suggestRfis'), { params });
            setSuggestedRfis(response.data.rfis || []);
        } catch (error) {
            console.error('Failed to suggest RFIs:', error);
            setSuggestedRfis([]);
        } finally {
            setRfiSearchLoading(false);
        }
    };

    // Handle RFI search
    const handleRfiSearch = () => {
        if (selectedObjection) {
            handleSuggestRfis(
                selectedObjection.chainage_from,
                selectedObjection.chainage_to,
                rfiSearchQuery
            );
        } else if (rfiSearchQuery) {
            handleSuggestRfis(null, null, rfiSearchQuery);
        }
    };

    // Open attach modal
    const openAttachModal = (objection) => {
        setSelectedObjection(objection);
        setSelectedRfis(objection.daily_works?.map(rfi => String(rfi.id)) || []);
        setRfiSearchQuery('');
        setSuggestedRfis([]);
        
        // Auto-search if chainage is set
        if (objection.chainage_from && objection.chainage_to) {
            handleSuggestRfis(objection.chainage_from, objection.chainage_to);
        }
        onAttachOpen();
    };

    // Attach RFIs to objection
    const handleAttachRfis = async () => {
        if (!selectedObjection || selectedRfis.length === 0) {
            showToast.error('Please select at least one RFI');
            return;
        }

        setAttachLoading(true);
        try {
            const response = await axios.post(route('objections.attachRfis', selectedObjection.id), {
                rfi_ids: selectedRfis.map(id => parseInt(id)),
            });
            showToast.success(response.data.message || 'RFIs attached successfully');
            onAttachClose();
            router.reload({ only: ['objections'] });
        } catch (error) {
            showToast.error(error.response?.data?.error || 'Failed to attach RFIs');
        } finally {
            setAttachLoading(false);
        }
    };

    // Open edit modal
    const openEditModal = (objection) => {
        setEditObjection(objection);
        setEditForm({
            title: objection.title || '',
            category: objection.category || 'other',
            chainage_from: objection.chainage_from || '',
            chainage_to: objection.chainage_to || '',
            description: objection.description || '',
            reason: objection.reason || '',
        });
        onEditOpen();
    };

    // Handle edit objection
    const handleEditObjection = async () => {
        if (!editForm.title || !editForm.description || !editForm.reason) {
            showToast.error('Please fill in all required fields');
            return;
        }

        setEditLoading(true);
        try {
            const response = await axios.put(route('objections.update', editObjection.id), editForm);
            showToast.success(response.data.message || 'Objection updated successfully');
            onEditClose();
            router.reload({ only: ['objections', 'statistics'] });
        } catch (error) {
            showToast.error(error.response?.data?.error || 'Failed to update objection');
        } finally {
            setEditLoading(false);
        }
    };

    // Open status modal
    const openStatusModal = (objection, action) => {
        setSelectedObjection(objection);
        setStatusAction(action);
        setResolutionNotes('');
        onStatusOpen();
    };

    // Handle status change
    const handleStatusChange = async () => {
        if (!selectedObjection || !statusAction) return;

        // Validate resolution notes for resolve/reject
        if (['resolve', 'reject'].includes(statusAction) && !resolutionNotes.trim()) {
            showToast.error('Please provide resolution notes');
            return;
        }

        setStatusLoading(true);
        try {
            let response;
            
            switch (statusAction) {
                case 'submit':
                    response = await axios.post(route('objections.submit', selectedObjection.id));
                    break;
                case 'review':
                    response = await axios.post(route('objections.review', selectedObjection.id));
                    break;
                case 'resolve':
                    response = await axios.post(route('objections.resolve', selectedObjection.id), {
                        resolution_notes: resolutionNotes,
                    });
                    break;
                case 'reject':
                    response = await axios.post(route('objections.reject', selectedObjection.id), {
                        resolution_notes: resolutionNotes,
                    });
                    break;
                default:
                    throw new Error('Invalid action');
            }
            
            showToast.success(response.data.message || 'Status updated successfully');
            
            // Update local state with the updated objection
            if (response.data.objection) {
                setObjections(prev => ({
                    ...prev,
                    data: prev.data.map(obj => 
                        obj.id === response.data.objection.id ? response.data.objection : obj
                    )
                }));
            }
            
            // Update statistics locally
            if (response.data.statistics) {
                setApiStats(response.data.statistics);
            }
            
            onStatusClose();
            setResolutionNotes('');
        } catch (error) {
            showToast.error(error.response?.data?.error || 'Failed to update status');
        } finally {
            setStatusLoading(false);
        }
    };

    // Delete objection
    const handleDeleteObjection = async (objection) => {
        if (!confirm('Are you sure you want to delete this objection?')) return;
        
        try {
            const response = await axios.delete(route('objections.destroy', objection.id));
            showToast.success(response.data.message || 'Objection deleted successfully');
            router.reload({ only: ['objections', 'statistics'] });
        } catch (error) {
            showToast.error(error.response?.data?.error || 'Failed to delete objection');
        }
    };

    // Get status action label
    const getStatusActionLabel = (action) => {
        switch (action) {
            case 'submit': return 'Submit for Review';
            case 'review': return 'Start Review';
            case 'resolve': return 'Resolve Objection';
            case 'reject': return 'Reject Objection';
            default: return 'Update Status';
        }
    };

    // Open history modal
    const openHistoryModal = (objection) => {
        setHistoryObjection(objection);
        onHistoryOpen();
    };

    // Format status for display
    const formatStatus = (status) => {
        return statusConfig[status]?.label || status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
    };

    // Effect for filter and pagination changes
    useEffect(() => {
        fetchData();
    }, [filterData, currentPage]);

    // Calculate statistics
    const stats = useMemo(() => {
        const data = apiStats || {};
        const total = data.total || objections?.total || 0;
        const active = data.active || 0;
        const resolved = data.resolved || 0;
        const pending = data.pending || 0;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        return [
            {
                title: 'Total Objections',
                value: total.toLocaleString(),
                icon: <ShieldExclamationIcon className="w-5 h-5" />,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                description: `${active} active`,
                trend: active > 0 ? 'down' : 'neutral'
            },
            {
                title: 'Active Issues',
                value: active.toLocaleString(),
                icon: <ExclamationTriangleIcon className="w-5 h-5" />,
                color: active > 10 ? 'text-red-600' : 'text-warning-600',
                bgColor: active > 10 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-warning-50 dark:bg-warning-900/20',
                description: active > 0 ? 'Require attention' : 'All clear!',
                trend: active > 10 ? 'down' : active > 0 ? 'neutral' : 'up'
            },
            {
                title: 'Pending Review',
                value: pending.toLocaleString(),
                icon: <ClockIcon className="w-5 h-5" />,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                description: pending > 0 ? 'Awaiting action' : 'All caught up!',
                trend: pending > 5 ? 'down' : 'neutral'
            },
            {
                title: 'Resolution Rate',
                value: `${resolutionRate}%`,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: resolutionRate >= 80 ? 'text-green-600' : resolutionRate >= 50 ? 'text-yellow-600' : 'text-red-600',
                bgColor: resolutionRate >= 80 ? 'bg-green-50 dark:bg-green-900/20' : resolutionRate >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20',
                description: `${resolved} resolved`,
                trend: resolutionRate >= 80 ? 'up' : resolutionRate >= 50 ? 'neutral' : 'down'
            }
        ];
    }, [apiStats, objections]);

    // Action buttons configuration
    const actionButtons = [
        {
            label: 'New Objection',
            icon: <PlusIcon className="w-4 h-4" />,
            color: 'primary',
            variant: 'solid',
            onPress: onCreateOpen
        },
    ];

    // Desktop columns
    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'chainage', label: 'Chainage Range' },
        { key: 'status', label: 'Status' },
        { key: 'affected_rfis', label: 'Affected RFIs' },
        { key: 'created_by', label: 'Created By' },
        { key: 'created_at', label: 'Date' },
        { key: 'actions', label: 'Actions' },
    ];

    // Render cell
    const renderCell = (objection, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className="flex items-center gap-2 max-w-[200px]">
                        <ShieldExclamationIcon className={`w-4 h-4 shrink-0 ${
                            objection.is_active ? 'text-warning animate-pulse' : 'text-success'
                        }`} />
                        <span className="font-medium text-sm truncate" title={objection.title}>
                            {objection.title}
                        </span>
                    </div>
                );
            case 'category':
                return getCategoryChip(objection.category);
            case 'chainage':
                return objection.chainage_from && objection.chainage_to ? (
                    <div className="flex items-center gap-1 text-xs">
                        <MapPinIcon className="w-3 h-3 text-default-400" />
                        <span>{objection.chainage_from} - {objection.chainage_to}</span>
                    </div>
                ) : (
                    <span className="text-xs text-default-400">Not set</span>
                );
            case 'status':
                return getStatusChip(objection.status);
            case 'affected_rfis':
                return (
                    <Button
                        size="sm"
                        variant="flat"
                        color={objection.daily_works_count > 0 ? 'primary' : 'default'}
                        startContent={<LinkIcon className="w-3 h-3" />}
                        onPress={() => openAttachModal(objection)}
                    >
                        {objection.daily_works_count || 0} RFI(s)
                    </Button>
                );
            case 'created_by':
                return (
                    <div className="flex items-center gap-2">
                        <ProfileAvatar
                            src={objection.created_by?.profile_image_url}
                            name={objection.created_by?.name || 'Unknown'}
                            size="sm"
                            className="w-6 h-6"
                        />
                        <span className="text-xs truncate max-w-[100px]">{objection.created_by?.name || 'Unknown'}</span>
                    </div>
                );
            case 'created_at':
                return (
                    <div className="flex items-center gap-1 text-xs">
                        <CalendarDaysIcon className="w-3 h-3 text-default-400" />
                        <span>{formatDate(objection.created_at)}</span>
                    </div>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Objection actions">
                            <DropdownItem
                                key="attach"
                                startContent={<LinkIcon className="w-4 h-4" />}
                                onPress={() => openAttachModal(objection)}
                            >
                                Manage RFIs
                            </DropdownItem>
                            {objection.status === 'draft' && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openEditModal(objection)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {objection.status === 'draft' && (
                                <DropdownItem
                                    key="submit"
                                    startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
                                    color="primary"
                                    onPress={() => openStatusModal(objection, 'submit')}
                                >
                                    Submit for Review
                                </DropdownItem>
                            )}
                            {objection.status === 'submitted' && (
                                <DropdownItem
                                    key="review"
                                    startContent={<ClockIcon className="w-4 h-4" />}
                                    color="warning"
                                    onPress={() => openStatusModal(objection, 'review')}
                                >
                                    Start Review
                                </DropdownItem>
                            )}
                            {(objection.status === 'submitted' || objection.status === 'under_review') && (
                                <DropdownItem
                                    key="resolve"
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    color="success"
                                    onPress={() => openStatusModal(objection, 'resolve')}
                                >
                                    Resolve
                                </DropdownItem>
                            )}
                            {(objection.status === 'submitted' || objection.status === 'under_review') && (
                                <DropdownItem
                                    key="reject"
                                    startContent={<XCircleSolid className="w-4 h-4" />}
                                    color="danger"
                                    onPress={() => openStatusModal(objection, 'reject')}
                                >
                                    Reject
                                </DropdownItem>
                            )}
                            {objection.status_logs?.length > 0 && (
                                <DropdownItem
                                    key="history"
                                    startContent={<ClockIcon className="w-4 h-4" />}
                                    onPress={() => openHistoryModal(objection)}
                                >
                                    View History
                                </DropdownItem>
                            )}
                            {objection.status === 'draft' && (
                                <DropdownItem
                                    key="delete"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    color="danger"
                                    className="text-danger"
                                    onPress={() => handleDeleteObjection(objection)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return '-';
        }
    };

    // Mobile accordion item
    const ObjectionAccordionItem = ({ objection, isExpanded, onToggle }) => {
        const statusConf = statusConfig[objection.status] || statusConfig['draft'];
        const StatusIcon = statusConf.icon;

        return (
            <Card
                radius={getThemeRadius()}
                className={`bg-content1 border shadow-sm ${
                    objection.is_active
                        ? 'border-warning/60 bg-warning-50/30 dark:bg-warning-900/10'
                        : 'border-divider/40'
                }`}
            >
                <CardHeader
                    className="p-3 cursor-pointer select-none"
                    onClick={onToggle}
                >
                    <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ShieldExclamationIcon className={`w-5 h-5 shrink-0 ${
                                objection.is_active ? 'text-warning animate-pulse' : 'text-success'
                            }`} />
                            <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-sm text-foreground truncate">
                                    {objection.title}
                                </h4>
                                <p className="text-xs text-default-500 truncate">
                                    {objection.chainage_from && objection.chainage_to
                                        ? `${objection.chainage_from} - ${objection.chainage_to}`
                                        : 'No chainage set'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Chip
                                size="sm"
                                variant="flat"
                                color={statusConf.color}
                                className="h-5 text-[10px]"
                            >
                                {statusConf.label}
                            </Chip>
                            <div className={`w-5 h-5 rounded-full bg-default-100 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDownIcon className="w-3 h-3 text-default-500" />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardBody className="px-3 pb-3 pt-0">
                                <Divider className="mb-3" />

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-default-400">Category:</span>
                                        {getCategoryChip(objection.category)}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-default-400">Chainage:</span>
                                        {objection.chainage_from && objection.chainage_to ? (
                                            <div className="flex items-center gap-1">
                                                <MapPinIcon className="w-3 h-3 text-default-400" />
                                                <span>{objection.chainage_from} - {objection.chainage_to}</span>
                                            </div>
                                        ) : (
                                            <span className="text-default-400">Not set</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-default-400">Affected RFIs:</span>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color={objection.daily_works_count > 0 ? 'primary' : 'default'}
                                            className="h-6 min-h-6 text-[10px]"
                                            onPress={() => openAttachModal(objection)}
                                        >
                                            {objection.daily_works_count || 0} RFI(s)
                                        </Button>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-default-400">Created By:</span>
                                        <div className="flex items-center gap-1.5">
                                            <ProfileAvatar
                                                src={objection.created_by?.profile_image_url}
                                                name={objection.created_by?.name}
                                                size="xs"
                                                className="w-4 h-4"
                                            />
                                            <span>{objection.created_by?.name || 'Unknown'}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-default-400">Date:</span>
                                        <span>{formatDate(objection.created_at)}</span>
                                    </div>

                                    {objection.description && (
                                        <div className="pt-2">
                                            <span className="text-default-400 block mb-1">Description:</span>
                                            <p className="text-default-600 text-[11px] line-clamp-3 bg-default-100 p-2 rounded">
                                                {objection.description}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        startContent={<LinkIcon className="w-3 h-3" />}
                                        onPress={() => openAttachModal(objection)}
                                    >
                                        Manage RFIs
                                    </Button>
                                    {objection.status === 'draft' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="default"
                                                startContent={<PencilIcon className="w-3 h-3" />}
                                                onPress={() => openEditModal(objection)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                startContent={<DocumentArrowUpIcon className="w-3 h-3" />}
                                                onPress={() => openStatusModal(objection, 'submit')}
                                            >
                                                Submit
                                            </Button>
                                        </>
                                    )}
                                    {objection.status === 'submitted' && (
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="warning"
                                            startContent={<ClockIcon className="w-3 h-3" />}
                                            onPress={() => openStatusModal(objection, 'review')}
                                        >
                                            Review
                                        </Button>
                                    )}
                                    {objection.status === 'under_review' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="success"
                                                startContent={<CheckCircleIcon className="w-3 h-3" />}
                                                onPress={() => openStatusModal(objection, 'resolve')}
                                            >
                                                Resolve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="danger"
                                                startContent={<XCircleSolid className="w-3 h-3" />}
                                                onPress={() => openStatusModal(objection, 'reject')}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {objection.status_logs?.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="default"
                                            startContent={<ClockIcon className="w-3 h-3" />}
                                            onPress={() => openHistoryModal(objection)}
                                        >
                                            History
                                        </Button>
                                    )}
                                    {objection.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            startContent={<TrashIcon className="w-3 h-3" />}
                                            onPress={() => handleDeleteObjection(objection)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </CardBody>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        );
    };

    // Desktop table skeleton
    const renderTableSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
        </div>
    );

    // Mobile skeleton
    const renderMobileSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
        </div>
    );

    return (
        <>
            <Head title="Objections Management" />

            {/* Create Objection Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={onCreateClose}
                size="lg"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <ShieldExclamationIcon className="w-5 h-5 text-warning" />
                        Create New Objection
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="Title"
                                placeholder="Enter objection title"
                                value={createForm.title}
                                onValueChange={(value) => setCreateForm(prev => ({ ...prev, title: value }))}
                                isRequired
                            />

                            <Select
                                label="Category"
                                selectedKeys={[createForm.category]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] || 'other';
                                    setCreateForm(prev => ({ ...prev, category: value }));
                                }}
                            >
                                {Object.entries(categories || categoryConfig).map(([key, value]) => (
                                    <SelectItem key={key}>{typeof value === 'string' ? value : value.label}</SelectItem>
                                ))}
                            </Select>

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Chainage From"
                                    placeholder="e.g., K23+500"
                                    value={createForm.chainage_from}
                                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, chainage_from: value }))}
                                />
                                <Input
                                    label="Chainage To"
                                    placeholder="e.g., K24+600"
                                    value={createForm.chainage_to}
                                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, chainage_to: value }))}
                                />
                            </div>

                            <Textarea
                                label="Description"
                                placeholder="Describe the objection in detail"
                                value={createForm.description}
                                onValueChange={(value) => setCreateForm(prev => ({ ...prev, description: value }))}
                                minRows={3}
                                isRequired
                            />

                            <Textarea
                                label="Reason"
                                placeholder="Explain the reason for this objection"
                                value={createForm.reason}
                                onValueChange={(value) => setCreateForm(prev => ({ ...prev, reason: value }))}
                                minRows={2}
                                isRequired
                            />

                            <Select
                                label="Status"
                                selectedKeys={[createForm.status]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] || 'draft';
                                    setCreateForm(prev => ({ ...prev, status: value }));
                                }}
                            >
                                <SelectItem key="draft">Save as Draft</SelectItem>
                                <SelectItem key="submitted">Submit Immediately</SelectItem>
                            </Select>

                            {/* File Upload Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-default-700">
                                    Supporting Documents (Optional)
                                </label>
                                <p className="text-xs text-default-400">
                                    Upload images, PDFs, Word, or Excel files
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="objection-file-upload"
                                />
                                <label
                                    htmlFor="objection-file-upload"
                                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-default-300 rounded-lg cursor-pointer hover:border-primary hover:bg-default-50 transition-colors"
                                >
                                    <DocumentIcon className="w-5 h-5 text-default-500" />
                                    <span className="text-sm text-default-600">
                                        Click to select files
                                    </span>
                                </label>

                                {/* Selected Files List */}
                                {selectedFiles.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        {selectedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-default-100 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {file.type.startsWith('image/') ? (
                                                        <PhotoIcon className="w-4 h-4 text-success shrink-0" />
                                                    ) : (
                                                        <DocumentTextIcon className="w-4 h-4 text-primary shrink-0" />
                                                    )}
                                                    <span className="text-xs truncate">{file.name}</span>
                                                    <span className="text-xs text-default-400 shrink-0">
                                                        ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </div>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={() => removeSelectedFile(index)}
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={() => { onCreateClose(); resetCreateForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleCreateObjection}
                            isLoading={createLoading}
                        >
                            Create Objection
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Attach RFIs Modal */}
            <Modal
                isOpen={isAttachOpen}
                onClose={onAttachClose}
                size="3xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-primary" />
                        Manage Affected RFIs
                        {selectedObjection && (
                            <span className="text-sm font-normal text-default-500">
                                - {selectedObjection.title}
                            </span>
                        )}
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            {/* Chainage Range Info */}
                            {selectedObjection?.chainage_from && selectedObjection?.chainage_to && (
                                <div className="flex flex-wrap items-center gap-2 p-3 bg-default-100 rounded-lg">
                                    <MapPinIcon className="w-5 h-5 text-default-500" />
                                    <span className="text-sm">
                                        Chainage Range: <strong>{selectedObjection.chainage_from}</strong> - <strong>{selectedObjection.chainage_to}</strong>
                                    </span>
                                </div>
                            )}

                            {/* Manual Search */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search RFIs by number, location, or description..."
                                    value={rfiSearchQuery}
                                    onChange={(e) => setRfiSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRfiSearch()}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                    size="sm"
                                    className="flex-1"
                                />
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    isLoading={rfiSearchLoading}
                                    onPress={handleRfiSearch}
                                >
                                    Search
                                </Button>
                                {selectedObjection?.chainage_from && selectedObjection?.chainage_to && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        isLoading={rfiSearchLoading}
                                        onPress={() => {
                                            setRfiSearchQuery('');
                                            handleSuggestRfis(selectedObjection.chainage_from, selectedObjection.chainage_to);
                                        }}
                                    >
                                        <ArrowPathIcon className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Currently Attached RFIs */}
                            {selectedObjection?.daily_works?.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleSolid className="w-4 h-4 text-success" />
                                        <span className="text-sm font-medium text-success">
                                            Currently Attached ({selectedObjection.daily_works.length})
                                        </span>
                                    </div>
                                    <div className="grid gap-2 max-h-[150px] overflow-auto border border-success/30 rounded-lg p-2 bg-success-50/30 dark:bg-success-900/10">
                                        {selectedObjection.daily_works.map((rfi) => (
                                            <div
                                                key={rfi.id}
                                                className="flex items-center gap-3 p-2 border border-divider rounded-lg bg-content1"
                                            >
                                                <Checkbox 
                                                    value={String(rfi.id)} 
                                                    isSelected={selectedRfis.includes(String(rfi.id))}
                                                    onValueChange={(isSelected) => {
                                                        if (isSelected) {
                                                            setSelectedRfis(prev => [...prev, String(rfi.id)]);
                                                        } else {
                                                            setSelectedRfis(prev => prev.filter(id => id !== String(rfi.id)));
                                                        }
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{rfi.number}</div>
                                                    <div className="text-xs text-default-500 flex items-center gap-2">
                                                        <MapPinIcon className="w-3 h-3" />
                                                        {rfi.location || 'No location'}
                                                        {rfi.type && (
                                                            <>
                                                                <span>•</span>
                                                                {rfi.type}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <Chip size="sm" variant="flat" color="success">Attached</Chip>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search Results / Suggested RFIs */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <MagnifyingGlassIcon className="w-4 h-4 text-default-500" />
                                    <span className="text-sm font-medium">
                                        {rfiSearchQuery ? 'Search Results' : 'Suggested RFIs'} 
                                        {suggestedRfis.length > 0 && ` (${suggestedRfis.length})`}
                                    </span>
                                </div>

                                {rfiSearchLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner />
                                    </div>
                                ) : suggestedRfis.length > 0 ? (
                                    <CheckboxGroup
                                        value={selectedRfis}
                                        onValueChange={setSelectedRfis}
                                    >
                                        <div className="grid gap-2 max-h-[300px] overflow-auto border border-divider rounded-lg p-2">
                                            {suggestedRfis.map((rfi) => {
                                                const isAlreadyAttached = selectedObjection?.daily_works?.some(dw => dw.id === rfi.id);
                                                return (
                                                    <div
                                                        key={rfi.id}
                                                        className={`flex items-center gap-3 p-2 border rounded-lg hover:bg-default-100 ${
                                                            isAlreadyAttached ? 'border-success/50 bg-success-50/20' : 'border-divider'
                                                        }`}
                                                    >
                                                        <Checkbox value={String(rfi.id)} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{rfi.number}</span>
                                                                {isAlreadyAttached && (
                                                                    <Chip size="sm" variant="flat" color="success" className="h-4 text-[10px]">
                                                                        Attached
                                                                    </Chip>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-default-500 flex items-center gap-2">
                                                                <MapPinIcon className="w-3 h-3" />
                                                                {rfi.location || 'No location'}
                                                                {rfi.type && (
                                                                    <>
                                                                        <span>•</span>
                                                                        {rfi.type}
                                                                    </>
                                                                )}
                                                                {rfi.incharge_user?.name && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <UserIcon className="w-3 h-3" />
                                                                        {rfi.incharge_user.name}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {rfi.description && (
                                                                <p className="text-[10px] text-default-400 truncate mt-0.5">
                                                                    {rfi.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CheckboxGroup>
                                ) : (
                                    <div className="text-center py-8 text-default-500 border border-dashed border-divider rounded-lg">
                                        <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>
                                            {rfiSearchQuery 
                                                ? 'No RFIs found matching your search.' 
                                                : selectedObjection?.chainage_from && selectedObjection?.chainage_to
                                                    ? 'No RFIs found in the specified chainage range.'
                                                    : 'Use the search box above to find RFIs.'}
                                        </p>
                                        <p className="text-xs mt-1">Try searching by RFI number, location, or description.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-default-500">
                                {selectedRfis.length} RFI(s) selected
                            </span>
                            <div className="flex gap-2">
                                <Button variant="light" onPress={onAttachClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleAttachRfis}
                                    isLoading={attachLoading}
                                    isDisabled={selectedRfis.length === 0}
                                >
                                    Save Attachments
                                </Button>
                            </div>
                        </div>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit Objection Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={onEditClose}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <PencilIcon className="w-5 h-5 text-primary" />
                        Edit Objection
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="Title"
                                placeholder="Enter objection title"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                isRequired
                            />
                            <Select
                                label="Category"
                                placeholder="Select category"
                                selectedKeys={[editForm.category]}
                                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                            >
                                {Object.entries(categoryConfig).map(([key, conf]) => (
                                    <SelectItem key={key} value={key}>
                                        {conf.label}
                                    </SelectItem>
                                ))}
                            </Select>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Chainage From"
                                    placeholder="e.g., K23+500"
                                    value={editForm.chainage_from}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, chainage_from: e.target.value }))}
                                />
                                <Input
                                    label="Chainage To"
                                    placeholder="e.g., K24+600"
                                    value={editForm.chainage_to}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, chainage_to: e.target.value }))}
                                />
                            </div>
                            <Textarea
                                label="Description"
                                placeholder="Describe the objection in detail"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                minRows={3}
                                isRequired
                            />
                            <Textarea
                                label="Reason"
                                placeholder="Explain the reason for raising this objection"
                                value={editForm.reason}
                                onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                                minRows={2}
                                isRequired
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onEditClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleEditObjection}
                            isLoading={editLoading}
                        >
                            Save Changes
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Status Update Modal */}
            <Modal
                isOpen={isStatusOpen}
                onClose={onStatusClose}
                size="lg"
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        {statusAction === 'submit' && <DocumentArrowUpIcon className="w-5 h-5 text-primary" />}
                        {statusAction === 'review' && <ClockIcon className="w-5 h-5 text-warning" />}
                        {statusAction === 'resolve' && <CheckCircleIcon className="w-5 h-5 text-success" />}
                        {statusAction === 'reject' && <XCircleSolid className="w-5 h-5 text-danger" />}
                        {getStatusActionLabel(statusAction)}
                    </ModalHeader>
                    <ModalBody>
                        {selectedObjection && (
                            <div className="space-y-4">
                                <div className="p-3 bg-default-100 rounded-lg">
                                    <p className="font-medium">{selectedObjection.title}</p>
                                    <p className="text-sm text-default-500 mt-1">{selectedObjection.description}</p>
                                </div>
                                
                                {statusAction === 'submit' && (
                                    <p className="text-sm text-default-600">
                                        Are you sure you want to submit this objection for review? 
                                        Once submitted, you won't be able to edit it.
                                    </p>
                                )}
                                
                                {statusAction === 'review' && (
                                    <p className="text-sm text-default-600">
                                        This will mark the objection as "Under Review". 
                                        You can then resolve or reject it after investigation.
                                    </p>
                                )}
                                
                                {(statusAction === 'resolve' || statusAction === 'reject') && (
                                    <Textarea
                                        label={statusAction === 'resolve' ? 'Resolution Notes' : 'Rejection Reason'}
                                        placeholder={statusAction === 'resolve' 
                                            ? 'Explain how the objection was resolved...'
                                            : 'Explain why the objection is being rejected...'
                                        }
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        minRows={3}
                                        isRequired
                                    />
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onStatusClose}>
                            Cancel
                        </Button>
                        <Button
                            color={statusAction === 'reject' ? 'danger' : statusAction === 'resolve' ? 'success' : 'primary'}
                            onPress={handleStatusChange}
                            isLoading={statusLoading}
                        >
                            {getStatusActionLabel(statusAction)}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Status History Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={onHistoryClose}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-primary" />
                        Status History
                    </ModalHeader>
                    <ModalBody>
                        {historyObjection && (
                            <div className="space-y-4">
                                {/* Current Status */}
                                <div className="p-3 bg-default-100 rounded-lg">
                                    <p className="font-medium">{historyObjection.title}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm text-default-500">Current Status:</span>
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={statusConfig[historyObjection.status]?.color || 'default'}
                                        >
                                            {formatStatus(historyObjection.status)}
                                        </Chip>
                                    </div>
                                </div>
                                
                                {/* Timeline */}
                                <div className="relative">
                                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-default-200"></div>
                                    
                                    {historyObjection.status_logs?.length > 0 ? (
                                        <div className="space-y-4">
                                            {historyObjection.status_logs.map((log, index) => {
                                                const toStatusConf = statusConfig[log.to_status] || {};
                                                const StatusIcon = toStatusConf.icon || ClockIcon;
                                                
                                                return (
                                                    <div key={log.id || index} className="relative flex gap-4 pl-8">
                                                        {/* Timeline Dot */}
                                                        <div 
                                                            className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                                                toStatusConf.bgColor || 'bg-default-100'
                                                            }`}
                                                        >
                                                            <StatusIcon className={`w-3 h-3 ${toStatusConf.textColor || 'text-default-500'}`} />
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div className="flex-1 pb-4">
                                                            <div className="bg-content2 rounded-lg p-3 border border-divider/40">
                                                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                                                    <Chip
                                                                        size="sm"
                                                                        variant="flat"
                                                                        color={statusConfig[log.from_status]?.color || 'default'}
                                                                    >
                                                                        {formatStatus(log.from_status)}
                                                                    </Chip>
                                                                    <span className="text-default-400">→</span>
                                                                    <Chip
                                                                        size="sm"
                                                                        variant="flat"
                                                                        color={toStatusConf.color || 'default'}
                                                                    >
                                                                        {formatStatus(log.to_status)}
                                                                    </Chip>
                                                                </div>
                                                                
                                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-default-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <UserIcon className="w-3 h-3" />
                                                                        {log.changed_by?.name || 'System'}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <CalendarIcon className="w-3 h-3" />
                                                                        {new Date(log.changed_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                
                                                                {log.notes && (
                                                                    <div className="mt-2 pt-2 border-t border-divider/40">
                                                                        <p className="text-sm text-default-600">{log.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-default-500">
                                            <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No status changes recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onHistoryClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[2000px]"
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
                        {/* Main Card Header */}
                        <CardHeader
                            className="border-b p-0"
                            style={{
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                background: `linear-gradient(135deg,
                                    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%,
                                    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                            }}
                        >
                            <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                                <div className="flex flex-col space-y-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Title Section */}
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`
                                                    ${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'}
                                                    rounded-xl flex items-center justify-center
                                                `}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-warning) 15%, transparent)`,
                                                    borderColor: `color-mix(in srgb, var(--theme-warning) 25%, transparent)`,
                                                    borderWidth: `var(--borderWidth, 2px)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <ShieldExclamationIcon
                                                    className={`
                                                        ${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                                                    `}
                                                    style={{ color: 'var(--theme-warning)' }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4
                                                    className={`
                                                        ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'}
                                                        font-bold text-foreground
                                                        ${!isLargeScreen ? 'truncate' : ''}
                                                    `}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Objections Management
                                                </h4>
                                                <p
                                                    className={`
                                                        ${isLargeScreen ? 'text-sm' : 'text-xs'}
                                                        text-default-500
                                                        ${!isLargeScreen ? 'truncate' : ''}
                                                    `}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Track and manage RFI objections across projects
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end w-full lg:w-auto">
                                                {actionButtons.map((button, index) => (
                                                    <Button
                                                        key={index}
                                                        size={isLargeScreen ? "md" : "sm"}
                                                        variant={button.variant || "flat"}
                                                        color={button.color || "primary"}
                                                        startContent={!isMobile && button.icon}
                                                        isIconOnly={isMobile}
                                                        onPress={button.onPress}
                                                        className={`${button.className || ''} font-medium ${isMobile ? 'min-w-9 h-9' : ''}`}
                                                        aria-label={button.label}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        {isMobile ? button.icon : button.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="pt-6">
                            {/* Quick Stats */}
                            <div className="relative">
                                <StatsCards
                                    stats={stats}
                                    onRefresh={refreshData}
                                    isLoading={statsLoading}
                                />
                            </div>

                            {/* Search and Filters Section */}
                            <div className="mb-4 space-y-4">
                                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                                    {/* Filter Toggle Button */}
                                    <Button
                                        size="sm"
                                        variant={showFilters ? 'solid' : 'bordered'}
                                        color={showFilters ? 'primary' : 'default'}
                                        onPress={() => setShowFilters(!showFilters)}
                                        radius={getThemeRadius()}
                                        className={`shrink-0 min-h-10 ${showFilters ? '' : 'border-divider/50'}`}
                                        startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                    >
                                        {isMobile ? '' : 'Filters'}
                                    </Button>

                                    {/* Search Field */}
                                    <div className="flex-1 min-w-0">
                                        <Input
                                            type="text"
                                            placeholder="Search by title, description, or chainage..."
                                            value={search}
                                            onChange={handleSearch}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400 shrink-0" />}
                                            classNames={{
                                                input: "text-foreground text-sm",
                                                inputWrapper: "min-h-10 bg-content2/50 border-divider/50 hover:border-divider",
                                            }}
                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                        />
                                    </div>
                                </div>

                                {/* Advanced Filters Panel */}
                                <AnimatePresence>
                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div
                                                className="p-3 rounded-lg border"
                                                style={{
                                                    background: 'var(--theme-content2, rgba(244, 244, 245, 0.8))',
                                                    borderColor: 'var(--theme-divider, rgba(228, 228, 231, 0.5))',
                                                }}
                                            >
                                                <div className="flex flex-wrap gap-3 items-end">
                                                    {/* Status Filter */}
                                                    <div className="w-full sm:w-auto sm:min-w-[160px]">
                                                        <Select
                                                            label="Status"
                                                            placeholder="All"
                                                            selectedKeys={filterData.status ? [filterData.status] : ["all"]}
                                                            onSelectionChange={(keys) => {
                                                                const value = Array.from(keys)[0] || 'all';
                                                                handleFilterChange('status', value);
                                                            }}
                                                            variant="bordered"
                                                            size="sm"
                                                            radius={getThemeRadius()}
                                                            classNames={{
                                                                trigger: "min-h-10",
                                                                value: "text-foreground text-sm",
                                                            }}
                                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                        >
                                                            <SelectItem key="all" value="all">All Statuses</SelectItem>
                                                            {Object.entries(statuses || statusConfig).map(([key, value]) => (
                                                                <SelectItem key={key} value={key}>
                                                                    {typeof value === 'string' ? value : value.label}
                                                                </SelectItem>
                                                            ))}
                                                        </Select>
                                                    </div>

                                                    {/* Category Filter */}
                                                    <div className="w-full sm:w-auto sm:min-w-[160px]">
                                                        <Select
                                                            label="Category"
                                                            placeholder="All"
                                                            selectedKeys={filterData.category ? [filterData.category] : ["all"]}
                                                            onSelectionChange={(keys) => {
                                                                const value = Array.from(keys)[0] || 'all';
                                                                handleFilterChange('category', value);
                                                            }}
                                                            variant="bordered"
                                                            size="sm"
                                                            radius={getThemeRadius()}
                                                            classNames={{
                                                                trigger: "min-h-10",
                                                                value: "text-foreground text-sm",
                                                            }}
                                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                        >
                                                            <SelectItem key="all" value="all">All Categories</SelectItem>
                                                            {Object.entries(categories || categoryConfig).map(([key, value]) => (
                                                                <SelectItem key={key} value={key}>
                                                                    {typeof value === 'string' ? value : value.label}
                                                                </SelectItem>
                                                            ))}
                                                        </Select>
                                                    </div>

                                                    {/* Clear Filters */}
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="danger"
                                                        radius={getThemeRadius()}
                                                        className="min-h-10"
                                                        onPress={() => {
                                                            setFilterData({
                                                                status: 'all',
                                                                category: 'all',
                                                                creator: '',
                                                            });
                                                            setSearch('');
                                                            setCurrentPage(1);
                                                        }}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Objections Table/List */}
                            <Card
                                radius={getThemeRadius()}
                                className="bg-content2/50 backdrop-blur-md border border-divider/30"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    backgroundColor: 'var(--theme-content2)',
                                    borderColor: 'var(--theme-divider)',
                                }}
                            >
                                <CardBody className="p-4">
                                    <ErrorBoundary
                                        fallbackTitle="Unable to load objections"
                                        fallbackDescription="There was an error loading the objections. Please try refreshing."
                                        onRetry={refreshData}
                                    >
                                        {tableLoading ? (
                                            isMobile ? renderMobileSkeleton() : renderTableSkeleton()
                                        ) : isMobile ? (
                                            <PullToRefresh
                                                onRefresh={handlePullToRefresh}
                                                disabled={tableLoading}
                                            >
                                                <div className="flex flex-col gap-2">
                                                    {objections?.data?.length > 0 ? (
                                                        objections.data.map((objection) => (
                                                            <SwipeableCard key={objection.id}>
                                                                <ObjectionAccordionItem
                                                                    objection={objection}
                                                                    isExpanded={expandedItems.has(objection.id)}
                                                                    onToggle={() => toggleExpanded(objection.id)}
                                                                />
                                                            </SwipeableCard>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12">
                                                            <ShieldExclamationIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                                            <p className="text-default-500 font-medium">No objections found</p>
                                                            <p className="text-default-400 text-sm mt-1">Create your first objection to get started</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </PullToRefresh>
                                        ) : (
                                            <Table
                                                aria-label="Objections table"
                                                removeWrapper
                                                classNames={{
                                                    base: "overflow-auto",
                                                    table: "min-w-full",
                                                    th: "bg-default-100 text-default-600 text-xs font-semibold uppercase",
                                                    td: "py-3",
                                                }}
                                            >
                                                <TableHeader columns={columns}>
                                                    {(column) => (
                                                        <TableColumn key={column.key}>
                                                            {column.label}
                                                        </TableColumn>
                                                    )}
                                                </TableHeader>
                                                <TableBody
                                                    items={objections?.data || []}
                                                    emptyContent={
                                                        <div className="text-center py-12">
                                                            <ShieldExclamationIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                                            <p className="text-default-500 font-medium">No objections found</p>
                                                            <p className="text-default-400 text-sm mt-1">Create your first objection to get started</p>
                                                        </div>
                                                    }
                                                >
                                                    {(objection) => (
                                                        <TableRow key={objection.id} className={objection.is_active ? 'bg-warning-50/50 dark:bg-warning-900/10' : ''}>
                                                            {(columnKey) => (
                                                                <TableCell>{renderCell(objection, columnKey)}</TableCell>
                                                            )}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        )}

                                        {/* Pagination */}
                                        {objections?.last_page > 1 && (
                                            <div className="flex justify-center mt-4 pt-4 border-t border-divider/30">
                                                <Pagination
                                                    total={objections.last_page}
                                                    page={objections.current_page}
                                                    onChange={handlePageChange}
                                                    size={isMobile ? "sm" : "md"}
                                                    showControls
                                                    showShadow
                                                    color="primary"
                                                />
                                            </div>
                                        )}
                                    </ErrorBoundary>
                                </CardBody>
                            </Card>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

ObjectionsIndex.layout = (page) => <App>{page}</App>;

export default ObjectionsIndex;
