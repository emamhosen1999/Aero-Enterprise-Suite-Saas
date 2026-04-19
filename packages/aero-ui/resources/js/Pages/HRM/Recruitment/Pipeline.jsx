import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Switch } from "@heroui/react";
import { 
    FunnelIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    ClockIcon,
    ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Pipeline = ({ title, jobOpenings: initialJobOpenings = [], departments: initialDepartments = [] }) => {
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
    const [pipelines, setPipelines] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [jobOpenings, setJobOpenings] = useState(initialJobOpenings);
    const [departments, setDepartments] = useState(initialDepartments);
    const [filters, setFilters] = useState({ 
        search: '', 
        job_opening_id: '', 
        department_id: '', 
        stage: '', 
        status: 'active',
        priority: ''
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_pipelines: 0, 
        active_pipelines: 0, 
        total_candidates: 0, 
        avg_time_to_hire: 0,
        conversion_rate: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false, candidates: false });
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        job_opening_id: '',
        department_id: '',
        description: '',
        stages: [
            { name: 'Application', order: 1, is_required: true },
            { name: 'Phone Screening', order: 2, is_required: true },
            { name: 'Technical Interview', order: 3, is_required: true },
            { name: 'HR Interview', order: 4, is_required: true },
            { name: 'Reference Check', order: 5, is_required: false },
            { name: 'Final Selection', order: 6, is_required: true },
        ],
        is_active: true,
        priority: 'medium',
        auto_progress: false,
        send_notifications: true
    });

    // Permission checks
    const canCreatePipeline = canCreate('hrm.recruitment.pipeline') || isSuperAdmin();
    const canUpdatePipeline = canUpdate('hrm.recruitment.pipeline') || isSuperAdmin();
    const canDeletePipeline = canDelete('hrm.recruitment.pipeline') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Pipelines", 
            value: stats.total_pipelines, 
            icon: <FunnelIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Pipelines", 
            value: stats.active_pipelines, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Total Candidates", 
            value: stats.total_candidates, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Avg Time to Hire", 
            value: `${stats.avg_time_to_hire} days`, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Pipeline configuration
    const pipelineStatuses = [
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'paused', label: 'Paused', color: 'warning' },
        { key: 'completed', label: 'Completed', color: 'primary' },
        { key: 'draft', label: 'Draft', color: 'default' },
    ];

    const priorities = [
        { key: 'high', label: 'High Priority', color: 'danger' },
        { key: 'medium', label: 'Medium Priority', color: 'warning' },
        { key: 'low', label: 'Low Priority', color: 'default' },
    ];

    const defaultStages = [
        'Application Received',
        'Initial Screening',
        'Phone/Video Interview',
        'Technical Assessment',
        'In-person Interview',
        'Reference Check',
        'Background Verification',
        'Offer Extended',
        'Offer Accepted',
        'Onboarding'
    ];

    const getStatusColor = (status) => {
        return pipelineStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return pipelineStatuses.find(s => s.key === status)?.label || status;
    };

    const getPriorityColor = (priority) => {
        return priorities.find(p => p.key === priority)?.color || 'default';
    };

    const getPriorityLabel = (priority) => {
        return priorities.find(p => p.key === priority)?.label || priority;
    };

    // Data fetching
    const fetchPipelines = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.pipeline.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setPipelines(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch pipelines'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.pipeline.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch pipeline stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchCandidates = useCallback(async (pipelineId) => {
        try {
            const response = await axios.get(route('hrm.recruitment.pipeline.candidates', pipelineId));
            if (response.status === 200) {
                setCandidates(response.data.candidates || []);
            }
        } catch (error) {
            console.error('Failed to fetch pipeline candidates:', error);
        }
    }, []);

    useEffect(() => {
        fetchPipelines();
        fetchStats();
    }, [fetchPipelines, fetchStats]);

    // Modal handlers
    const openModal = (type, pipeline = null) => {
        setSelectedPipeline(pipeline);
        if (pipeline) {
            setFormData({
                name: pipeline.name || '',
                job_opening_id: pipeline.job_opening_id || '',
                department_id: pipeline.department_id || '',
                description: pipeline.description || '',
                stages: pipeline.stages || defaultStages.map((stage, index) => ({
                    name: stage,
                    order: index + 1,
                    is_required: index < 4
                })),
                is_active: pipeline.is_active ?? true,
                priority: pipeline.priority || 'medium',
                auto_progress: pipeline.auto_progress ?? false,
                send_notifications: pipeline.send_notifications ?? true
            });
        } else {
            setFormData({
                name: '',
                job_opening_id: '',
                department_id: '',
                description: '',
                stages: defaultStages.map((stage, index) => ({
                    name: stage,
                    order: index + 1,
                    is_required: index < 4
                })),
                is_active: true,
                priority: 'medium',
                auto_progress: false,
                send_notifications: true
            });
        }
        if (type === 'candidates' && pipeline) {
            fetchCandidates(pipeline.id);
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedPipeline(null);
        if (type === 'candidates') {
            setCandidates([]);
        }
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedPipeline 
                    ? route('hrm.recruitment.pipeline.update', selectedPipeline.id)
                    : route('hrm.recruitment.pipeline.store');
                
                const method = selectedPipeline ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Pipeline ${selectedPipeline ? 'updated' : 'created'} successfully`]);
                    fetchPipelines();
                    fetchStats();
                    closeModal(selectedPipeline ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedPipeline ? 'update' : 'create'} pipeline`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedPipeline ? 'Updating' : 'Creating'} pipeline...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.recruitment.pipeline.destroy', selectedPipeline.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Pipeline deleted successfully']);
                    fetchPipelines();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete pipeline']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting pipeline...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Stage management
    const addStage = () => {
        setFormData(prev => ({
            ...prev,
            stages: [...prev.stages, {
                name: '',
                order: prev.stages.length + 1,
                is_required: false
            }]
        }));
    };

    const removeStage = (index) => {
        setFormData(prev => ({
            ...prev,
            stages: prev.stages.filter((_, i) => i !== index)
                .map((stage, i) => ({ ...stage, order: i + 1 }))
        }));
    };

    const updateStage = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            stages: prev.stages.map((stage, i) => 
                i === index ? { ...stage, [field]: value } : stage
            )
        }));
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'name', name: 'Pipeline Name' },
        { uid: 'job_opening', name: 'Job Opening' },
        { uid: 'department', name: 'Department' },
        { uid: 'stages', name: 'Stages' },
        { uid: 'candidates', name: 'Candidates' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                            <p className="text-small text-default-500 max-w-xs truncate">
                                {item.description}
                            </p>
                        )}
                    </div>
                );
            case 'job_opening':
                return item.job_opening?.title || 'N/A';
            case 'department':
                return item.department?.name || 'N/A';
            case 'stages':
                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-small font-medium">{item.stages?.length || 0} stages</span>
                        <div className="flex flex-wrap gap-1">
                            {item.stages?.slice(0, 2).map((stage, index) => (
                                <Chip key={index} size="sm" variant="flat" color="primary">
                                    {stage.name}
                                </Chip>
                            ))}
                            {item.stages?.length > 2 && (
                                <Chip size="sm" variant="flat">
                                    +{item.stages.length - 2}
                                </Chip>
                            )}
                        </div>
                    </div>
                );
            case 'candidates':
                return (
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<UserGroupIcon className="w-4 h-4" />}
                        onPress={() => openModal('candidates', item)}
                    >
                        {item.candidates_count || 0} candidates
                    </Button>
                );
            case 'priority':
                return (
                    <Chip 
                        color={getPriorityColor(item.priority)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getPriorityLabel(item.priority)}
                    </Chip>
                );
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
                        {canUpdatePipeline && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeletePipeline && (
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
    }, [canUpdatePipeline, canDeletePipeline]);

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
                                {selectedPipeline ? 'Edit Pipeline' : 'Create Pipeline'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Pipeline Name"
                                        placeholder="Enter pipeline name"
                                        value={formData.name}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                                        isRequired
                                        radius={themeRadius}
                                    />

                                    <Select
                                        label="Job Opening"
                                        placeholder="Select job opening"
                                        selectedKeys={formData.job_opening_id ? [formData.job_opening_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, job_opening_id: Array.from(keys)[0] || '' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {jobOpenings.map(job => (
                                            <SelectItem key={job.id} value={job.id}>
                                                {job.title} ({job.department?.name})
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Department"
                                        placeholder="Select department"
                                        selectedKeys={formData.department_id ? [formData.department_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, department_id: Array.from(keys)[0] || '' }))}
                                        radius={themeRadius}
                                    >
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Priority"
                                        placeholder="Select priority"
                                        selectedKeys={formData.priority ? [formData.priority] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, priority: Array.from(keys)[0] || 'medium' }))}
                                        radius={themeRadius}
                                    >
                                        {priorities.map(priority => (
                                            <SelectItem key={priority.key}>{priority.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <Textarea
                                    label="Description"
                                    placeholder="Enter pipeline description"
                                    value={formData.description}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                    rows={3}
                                    radius={themeRadius}
                                />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-semibold">Pipeline Stages</h4>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            startContent={<PlusIcon className="w-4 h-4" />}
                                            onPress={addStage}
                                        >
                                            Add Stage
                                        </Button>
                                    </div>

                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {formData.stages.map((stage, index) => (
                                            <div key={index} className="flex gap-3 items-end p-3 border border-divider rounded-lg">
                                                <div className="flex-1">
                                                    <Input
                                                        label={`Stage ${index + 1}`}
                                                        placeholder="Enter stage name"
                                                        value={stage.name}
                                                        onValueChange={(value) => updateStage(index, 'name', value)}
                                                        size="sm"
                                                        radius={themeRadius}
                                                    />
                                                </div>
                                                <Switch
                                                    isSelected={stage.is_required}
                                                    onValueChange={(value) => updateStage(index, 'is_required', value)}
                                                    size="sm"
                                                >
                                                    Required
                                                </Switch>
                                                {index > 0 && (
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        onPress={() => removeStage(index)}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Switch
                                        isSelected={formData.is_active}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                                    >
                                        Active Pipeline
                                    </Switch>
                                    
                                    <Switch
                                        isSelected={formData.auto_progress}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, auto_progress: value }))}
                                    >
                                        Auto Progress
                                    </Switch>
                                    
                                    <Switch
                                        isSelected={formData.send_notifications}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, send_notifications: value }))}
                                    >
                                        Send Notifications
                                    </Switch>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedPipeline ? 'Update' : 'Create'} Pipeline
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedPipeline && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Pipeline Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Pipeline Name</label>
                                        <p className="text-default-900 font-medium">{selectedPipeline.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Job Opening</label>
                                        <p className="text-default-900">{selectedPipeline.job_opening?.title || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Department</label>
                                        <p className="text-default-900">{selectedPipeline.department?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Priority</label>
                                        <Chip 
                                            color={getPriorityColor(selectedPipeline.priority)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getPriorityLabel(selectedPipeline.priority)}
                                        </Chip>
                                    </div>
                                </div>

                                {selectedPipeline.description && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Description</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedPipeline.description}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-default-600 mb-3 block">
                                        Pipeline Stages ({selectedPipeline.stages?.length || 0})
                                    </label>
                                    <div className="space-y-2">
                                        {selectedPipeline.stages?.map((stage, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-medium">{stage.name}</span>
                                                </div>
                                                {stage.is_required && (
                                                    <Chip size="sm" color="warning" variant="flat">Required</Chip>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Status</label>
                                        <Chip 
                                            color={getStatusColor(selectedPipeline.status)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStatusLabel(selectedPipeline.status)}
                                        </Chip>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Auto Progress</label>
                                        <p className="text-default-900">{selectedPipeline.auto_progress ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Notifications</label>
                                        <p className="text-default-900">{selectedPipeline.send_notifications ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.candidates && selectedPipeline && (
                <Modal 
                    isOpen={modalStates.candidates} 
                    onOpenChange={() => closeModal('candidates')}
                    size="4xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                Pipeline Candidates - {selectedPipeline.name}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                {candidates.length > 0 ? (
                                    <div className="grid gap-4">
                                        {candidates.map(candidate => (
                                            <div key={candidate.id} className="border border-divider rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold">{candidate.name}</h4>
                                                        <p className="text-sm text-default-600">{candidate.email}</p>
                                                        <p className="text-sm text-default-500">Applied: {candidate.created_at}</p>
                                                    </div>
                                                    <Chip 
                                                        color={candidate.current_stage?.is_required ? 'primary' : 'default'}
                                                        size="sm"
                                                    >
                                                        {candidate.current_stage?.name || 'Application'}
                                                    </Chip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <UserGroupIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                        <p className="text-default-500">No candidates in this pipeline yet</p>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('candidates')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedPipeline && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Pipeline</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the pipeline "{selectedPipeline?.name}"?</p>
                            <p className="text-sm text-default-500">This will affect all candidates in this pipeline. This action cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Recruitment Pipeline Management">
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
                                                    <FunnelIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Candidate Pipelines
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage recruitment pipelines and candidate flow
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreatePipeline && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Pipeline
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
                                            placeholder="Search pipelines..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Job Openings"
                                            selectedKeys={filters.job_opening_id ? [filters.job_opening_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('job_opening_id', Array.from(keys)[0] || '')}
                                        >
                                            {jobOpenings.map(job => (
                                                <SelectItem key={job.id}>{job.title}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id ? [filters.department_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || '')}
                                        >
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Priorities"
                                            selectedKeys={filters.priority ? [filters.priority] : []}
                                            onSelectionChange={(keys) => handleFilterChange('priority', Array.from(keys)[0] || '')}
                                        >
                                            {priorities.map(priority => (
                                                <SelectItem key={priority.key}>{priority.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Recruitment Pipelines" 
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
                                            items={pipelines} 
                                            emptyContent={loading ? "Loading..." : "No pipelines found"}
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

Pipeline.layout = (page) => <App children={page} />;
export default Pipeline;