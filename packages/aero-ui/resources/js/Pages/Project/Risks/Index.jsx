import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    Skeleton,
} from "@heroui/react";
import {
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    FunnelIcon,
    BugAntIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { ThemedCard, ThemedCardHeader, ThemedCardBody, getThemedCardStyle } from '@/Components/UI/ThemedCard';

const RisksIndex = ({ title, project, risks: initialRisks, stats: initialStats, users, filters: initialFilters }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { hasAccess, canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

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
    const [risks, setRisks] = useState(initialRisks?.data || []);
    const [stats, setStats] = useState(initialStats || {});
    const [pagination, setPagination] = useState({
        currentPage: initialRisks?.current_page || 1,
        lastPage: initialRisks?.last_page || 1,
        perPage: 15,
        total: initialRisks?.total || 0,
    });

    // Filters
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        type: initialFilters?.type || 'all',
        status: initialFilters?.status || [],
        highPriority: initialFilters?.high_priority || false,
        overdue: initialFilters?.overdue || false,
    });

    // Modal states
    const [modalStates, setModalStates] = useState({
        create: false,
        edit: false,
        delete: false,
        convertToIssue: false,
    });
    const [currentRisk, setCurrentRisk] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        type: 'risk',
        title: '',
        description: '',
        status: 'open',
        probability: 'medium',
        impact: 'medium',
        mitigation_plan: '',
        contingency_plan: '',
        owner_id: null,
        target_resolution_date: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);

    // Permissions
    const canManageRisks = canUpdate('project.risks') || isSuperAdmin();
    const canCreateRisks = canCreate('project.risks') || isSuperAdmin();
    const canDeleteRisks = canDelete('project.risks') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Risks",
            value: stats.total_risks || 0,
            icon: <ShieldExclamationIcon className="w-5 h-5" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Identified risks"
        },
        {
            title: "Total Issues",
            value: stats.total_issues || 0,
            icon: <BugAntIcon className="w-5 h-5" />,
            color: "text-danger",
            iconBg: "bg-danger/20",
            description: "Active issues"
        },
        {
            title: "Open",
            value: stats.open || 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Pending resolution"
        },
        {
            title: "High Priority",
            value: stats.high_priority || 0,
            icon: <ExclamationTriangleIcon className="w-5 h-5" />,
            color: "text-danger",
            iconBg: "bg-danger/20",
            description: "Critical attention"
        },
        {
            title: "Overdue",
            value: stats.overdue || 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: "text-danger",
            iconBg: "bg-danger/20",
            description: "Past target date"
        },
    ], [stats]);

    // Status options
    const statusOptions = [
        { key: 'open', label: 'Open', color: 'primary' },
        { key: 'mitigating', label: 'Mitigating', color: 'warning' },
        { key: 'resolved', label: 'Resolved', color: 'success' },
        { key: 'closed', label: 'Closed', color: 'default' },
        { key: 'accepted', label: 'Accepted', color: 'secondary' },
    ];

    const probabilityOptions = [
        { key: 'low', label: 'Low', color: 'success' },
        { key: 'medium', label: 'Medium', color: 'warning' },
        { key: 'high', label: 'High', color: 'danger' },
        { key: 'critical', label: 'Critical', color: 'danger' },
    ];

    const impactOptions = [
        { key: 'low', label: 'Low', color: 'success' },
        { key: 'medium', label: 'Medium', color: 'warning' },
        { key: 'high', label: 'High', color: 'danger' },
        { key: 'critical', label: 'Critical', color: 'danger' },
    ];

    // Table columns
    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'probability', label: 'Probability' },
        { key: 'impact', label: 'Impact' },
        { key: 'score', label: 'Score' },
        { key: 'owner', label: 'Owner' },
        { key: 'target_date', label: 'Target Date' },
        { key: 'actions', label: 'Actions' },
    ];

    // Fetch risks data
    const fetchRisks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('project.risks.index', { project: project.id }), {
                params: {
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    search: filters.search || undefined,
                    type: filters.type !== 'all' ? filters.type : undefined,
                    status: filters.status.length > 0 ? filters.status : undefined,
                    high_priority: filters.highPriority || undefined,
                    overdue: filters.overdue || undefined,
                },
            });

            if (response.status === 200) {
                setRisks(response.data.risks.data || []);
                setStats(response.data.stats || {});
                setPagination(prev => ({
                    ...prev,
                    currentPage: response.data.risks.current_page,
                    lastPage: response.data.risks.last_page,
                    total: response.data.risks.total,
                }));
            }
        } catch (error) {
            console.error('Error fetching risks:', error);
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch risks'
            });
        } finally {
            setLoading(false);
        }
    }, [project.id, pagination.currentPage, pagination.perPage, filters]);

    useEffect(() => {
        fetchRisks();
    }, [fetchRisks]);

    // Handle filter changes
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Modal handlers
    const openModal = useCallback((modalType, risk = null) => {
        if (risk) {
            setCurrentRisk(risk);
            setFormData({
                type: risk.type,
                title: risk.title,
                description: risk.description || '',
                status: risk.status,
                probability: risk.probability,
                impact: risk.impact,
                mitigation_plan: risk.mitigation_plan || '',
                contingency_plan: risk.contingency_plan || '',
                owner_id: risk.owner_id,
                target_resolution_date: risk.target_resolution_date || '',
            });
        } else {
            setCurrentRisk(null);
            setFormData({
                type: 'risk',
                title: '',
                description: '',
                status: 'open',
                probability: 'medium',
                impact: 'medium',
                mitigation_plan: '',
                contingency_plan: '',
                owner_id: null,
                target_resolution_date: '',
            });
        }
        setFormErrors({});
        setModalStates(prev => ({ ...prev, [modalType]: true }));
    }, []);

    const closeModal = useCallback((modalType) => {
        setModalStates(prev => ({ ...prev, [modalType]: false }));
        setCurrentRisk(null);
        setFormErrors({});
    }, []);

    // Form handlers
    const handleFormChange = useCallback((key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (formErrors[key]) {
            setFormErrors(prev => ({ ...prev, [key]: null }));
        }
    }, [formErrors]);

    // Submit handlers
    const handleCreate = useCallback(async () => {
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('project.risks.store', { project: project.id }),
                    formData
                );
                if (response.status === 200 || response.status === 201) {
                    closeModal('create');
                    fetchRisks();
                    resolve([response.data.message || 'Risk created successfully']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject([error.response?.data?.message || 'Failed to create risk']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating risk...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [formData, project.id, closeModal, fetchRisks]);

    const handleUpdate = useCallback(async () => {
        if (!currentRisk) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(
                    route('project.risks.update', { project: project.id, risk: currentRisk.id }),
                    formData
                );
                if (response.status === 200) {
                    closeModal('edit');
                    fetchRisks();
                    resolve([response.data.message || 'Risk updated successfully']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject([error.response?.data?.message || 'Failed to update risk']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating risk...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [currentRisk, formData, project.id, closeModal, fetchRisks]);

    const handleDelete = useCallback(async () => {
        if (!currentRisk) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(
                    route('project.risks.destroy', { project: project.id, risk: currentRisk.id })
                );
                if (response.status === 200) {
                    closeModal('delete');
                    fetchRisks();
                    resolve([response.data.message || 'Risk deleted successfully']);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete risk']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting risk...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [currentRisk, project.id, closeModal, fetchRisks]);

    const handleConvertToIssue = useCallback(async () => {
        if (!currentRisk) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('project.risks.convert-to-issue', { project: project.id, risk: currentRisk.id })
                );
                if (response.status === 200) {
                    closeModal('convertToIssue');
                    fetchRisks();
                    resolve([response.data.message || 'Risk converted to issue successfully']);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to convert risk to issue']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Converting to issue...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [currentRisk, project.id, closeModal, fetchRisks]);

    // Render table cell
    const renderCell = useCallback((risk, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{risk.title}</span>
                        {risk.description && (
                            <span className="text-xs text-default-400 truncate max-w-xs">
                                {risk.description.substring(0, 50)}...
                            </span>
                        )}
                    </div>
                );
            case 'type':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={risk.type === 'risk' ? 'warning' : 'danger'}
                    >
                        {risk.type === 'risk' ? 'Risk' : 'Issue'}
                    </Chip>
                );
            case 'status':
                const statusOption = statusOptions.find(s => s.key === risk.status);
                return (
                    <Chip size="sm" variant="flat" color={statusOption?.color || 'default'}>
                        {statusOption?.label || risk.status}
                    </Chip>
                );
            case 'probability':
                const probOption = probabilityOptions.find(p => p.key === risk.probability);
                return (
                    <Chip size="sm" variant="dot" color={probOption?.color || 'default'}>
                        {probOption?.label || risk.probability}
                    </Chip>
                );
            case 'impact':
                const impOption = impactOptions.find(i => i.key === risk.impact);
                return (
                    <Chip size="sm" variant="dot" color={impOption?.color || 'default'}>
                        {impOption?.label || risk.impact}
                    </Chip>
                );
            case 'score':
                const score = risk.risk_score || 0;
                const scoreColor = score >= 12 ? 'danger' : score >= 6 ? 'warning' : 'success';
                return (
                    <Chip size="sm" variant="solid" color={scoreColor}>
                        {score}
                    </Chip>
                );
            case 'owner':
                const owner = users?.find(u => u.id === risk.owner_id);
                return owner ? owner.name : '-';
            case 'target_date':
                if (!risk.target_resolution_date) return '-';
                const date = new Date(risk.target_resolution_date);
                const isOverdue = date < new Date() && risk.status !== 'resolved' && risk.status !== 'closed';
                return (
                    <span className={isOverdue ? 'text-danger font-medium' : ''}>
                        {date.toLocaleDateString()}
                    </span>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Risk Actions">
                            {canManageRisks && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openModal('edit', risk)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {risk.type === 'risk' && canManageRisks && (
                                <DropdownItem
                                    key="convert"
                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                    onPress={() => {
                                        setCurrentRisk(risk);
                                        openModal('convertToIssue', risk);
                                    }}
                                >
                                    Convert to Issue
                                </DropdownItem>
                            )}
                            {canDeleteRisks && (
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => openModal('delete', risk)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return risk[columnKey];
        }
    }, [users, statusOptions, probabilityOptions, impactOptions, canManageRisks, canDeleteRisks, openModal]);

    // Form Modal Component
    const renderFormModal = (isEdit = false) => (
        <Modal
            isOpen={isEdit ? modalStates.edit : modalStates.create}
            onOpenChange={() => closeModal(isEdit ? 'edit' : 'create')}
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
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">
                        {isEdit ? 'Edit Risk/Issue' : 'Create New Risk/Issue'}
                    </h2>
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Type"
                            placeholder="Select type"
                            selectedKeys={[formData.type]}
                            onSelectionChange={(keys) => handleFormChange('type', Array.from(keys)[0])}
                            isInvalid={!!formErrors.type}
                            errorMessage={formErrors.type}
                            radius={themeRadius}
                        >
                            <SelectItem key="risk">Risk</SelectItem>
                            <SelectItem key="issue">Issue</SelectItem>
                        </Select>

                        <Select
                            label="Status"
                            placeholder="Select status"
                            selectedKeys={[formData.status]}
                            onSelectionChange={(keys) => handleFormChange('status', Array.from(keys)[0])}
                            isInvalid={!!formErrors.status}
                            errorMessage={formErrors.status}
                            radius={themeRadius}
                        >
                            {statusOptions.map(opt => (
                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                            ))}
                        </Select>

                        <div className="col-span-2">
                            <Input
                                label="Title"
                                placeholder="Enter title"
                                value={formData.title}
                                onValueChange={(value) => handleFormChange('title', value)}
                                isInvalid={!!formErrors.title}
                                errorMessage={formErrors.title}
                                isRequired
                                radius={themeRadius}
                            />
                        </div>

                        <div className="col-span-2">
                            <Textarea
                                label="Description"
                                placeholder="Enter description"
                                value={formData.description}
                                onValueChange={(value) => handleFormChange('description', value)}
                                isInvalid={!!formErrors.description}
                                errorMessage={formErrors.description}
                                minRows={3}
                                radius={themeRadius}
                            />
                        </div>

                        <Select
                            label="Probability"
                            placeholder="Select probability"
                            selectedKeys={[formData.probability]}
                            onSelectionChange={(keys) => handleFormChange('probability', Array.from(keys)[0])}
                            isInvalid={!!formErrors.probability}
                            errorMessage={formErrors.probability}
                            radius={themeRadius}
                        >
                            {probabilityOptions.map(opt => (
                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                            ))}
                        </Select>

                        <Select
                            label="Impact"
                            placeholder="Select impact"
                            selectedKeys={[formData.impact]}
                            onSelectionChange={(keys) => handleFormChange('impact', Array.from(keys)[0])}
                            isInvalid={!!formErrors.impact}
                            errorMessage={formErrors.impact}
                            radius={themeRadius}
                        >
                            {impactOptions.map(opt => (
                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                            ))}
                        </Select>

                        <Select
                            label="Owner"
                            placeholder="Select owner"
                            selectedKeys={formData.owner_id ? [String(formData.owner_id)] : []}
                            onSelectionChange={(keys) => handleFormChange('owner_id', Array.from(keys)[0] ? parseInt(Array.from(keys)[0]) : null)}
                            radius={themeRadius}
                        >
                            {users?.map(user => (
                                <SelectItem key={String(user.id)}>{user.name}</SelectItem>
                            ))}
                        </Select>

                        <Input
                            type="date"
                            label="Target Resolution Date"
                            value={formData.target_resolution_date}
                            onChange={(e) => handleFormChange('target_resolution_date', e.target.value)}
                            isInvalid={!!formErrors.target_resolution_date}
                            errorMessage={formErrors.target_resolution_date}
                            radius={themeRadius}
                        />

                        <div className="col-span-2">
                            <Textarea
                                label="Mitigation Plan"
                                placeholder="Describe how to mitigate this risk"
                                value={formData.mitigation_plan}
                                onValueChange={(value) => handleFormChange('mitigation_plan', value)}
                                minRows={2}
                                radius={themeRadius}
                            />
                        </div>

                        <div className="col-span-2">
                            <Textarea
                                label="Contingency Plan"
                                placeholder="Describe the contingency plan"
                                value={formData.contingency_plan}
                                onValueChange={(value) => handleFormChange('contingency_plan', value)}
                                minRows={2}
                                radius={themeRadius}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={() => closeModal(isEdit ? 'edit' : 'create')}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={isEdit ? handleUpdate : handleCreate}
                        isLoading={formLoading}
                    >
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );

    return (
        <>
            <Head title={title || `Risks - ${project?.project_name}`} />

            {/* Create Modal */}
            {modalStates.create && renderFormModal(false)}

            {/* Edit Modal */}
            {modalStates.edit && renderFormModal(true)}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={modalStates.delete}
                onOpenChange={() => closeModal('delete')}
                size="sm"
            >
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete this {currentRisk?.type}?</p>
                        <p className="font-medium mt-2">{currentRisk?.title}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => closeModal('delete')}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleDelete} isLoading={formLoading}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Convert to Issue Modal */}
            <Modal
                isOpen={modalStates.convertToIssue}
                onOpenChange={() => closeModal('convertToIssue')}
                size="sm"
            >
                <ModalContent>
                    <ModalHeader>Convert Risk to Issue</ModalHeader>
                    <ModalBody>
                        <p>This will convert the risk to an active issue. The risk has materialized and requires immediate attention.</p>
                        <p className="font-medium mt-2">{currentRisk?.title}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => closeModal('convertToIssue')}>
                            Cancel
                        </Button>
                        <Button color="warning" onPress={handleConvertToIssue} isLoading={formLoading}>
                            Convert to Issue
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Risk Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="transition-all duration-200"
                                style={getThemedCardStyle()}
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
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-warning) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ShieldExclamationIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-warning)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Risks & Issues
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        {project?.project_name} - Risk Register
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateRisks && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('create')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Risk/Issue
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} />

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search risks..."
                                            value={filters.search}
                                            onValueChange={(value) => handleFilterChange('search', value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                            className="flex-1"
                                            radius={themeRadius}
                                        />

                                        <Select
                                            placeholder="Type"
                                            selectedKeys={[filters.type]}
                                            onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            className="w-full sm:w-40"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="risk">Risks Only</SelectItem>
                                            <SelectItem key="issue">Issues Only</SelectItem>
                                        </Select>

                                        <Select
                                            placeholder="Status"
                                            selectionMode="multiple"
                                            selectedKeys={new Set(filters.status)}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                                            classNames={{ trigger: "bg-default-100" }}
                                            className="w-full sm:w-48"
                                            radius={themeRadius}
                                        >
                                            {statusOptions.map(opt => (
                                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Button
                                            variant={filters.highPriority ? "solid" : "flat"}
                                            color={filters.highPriority ? "danger" : "default"}
                                            onPress={() => handleFilterChange('highPriority', !filters.highPriority)}
                                            size={isMobile ? "sm" : "md"}
                                        >
                                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                            High Priority
                                        </Button>
                                    </div>

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
                                            aria-label="Risks table"
                                            isHeaderSticky
                                            classNames={{
                                                wrapper: "shadow-none border border-divider rounded-lg",
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-3"
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
                                                items={risks}
                                                emptyContent="No risks or issues found"
                                            >
                                                {(risk) => (
                                                    <TableRow key={risk.id}>
                                                        {(columnKey) => (
                                                            <TableCell>
                                                                {renderCell(risk, columnKey)}
                                                            </TableCell>
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
                                                showShadow
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

RisksIndex.layout = (page) => <App children={page} />;
export default RisksIndex;
