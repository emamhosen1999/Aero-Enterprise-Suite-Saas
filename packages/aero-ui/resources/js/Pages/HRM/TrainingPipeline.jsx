import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Progress, Tabs, Tab, Avatar } from "@heroui/react";
import { 
    ChartBarIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    AcademicCapIcon,
    BookOpenIcon,
    CheckBadgeIcon,
    ClockIcon,
    UserGroupIcon,
    ChartPieIcon,
    TrophyIcon,
    ExclamationTriangleIcon,
    CalendarDaysIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const TrainingPipeline = ({ title, departments = [], trainers = [], programs = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete } = useHRMAC();
    
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
    const [activeTab, setActiveTab] = useState('overview');
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        status: 'all',
        priority: 'all',
        completion_status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_pipelines: 0, 
        active_pipelines: 0, 
        completed_pipelines: 0, 
        in_progress: 0,
        overdue_trainings: 0,
        completion_rate: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false, view: false, assign: false });
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [formData, setFormData] = useState({
        pipeline_name: '',
        department_id: '',
        target_audience: 'department', // department, role, individual, all_employees
        target_role_ids: [],
        target_employee_ids: [],
        
        // Training sequence
        training_programs: [], // Array of program IDs with order
        is_sequential: true, // Must complete in order
        allow_parallel_completion: false,
        
        // Timeline
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        duration_weeks: '4',
        auto_assign_new_hires: false,
        
        // Requirements
        mandatory: true,
        requires_manager_approval: false,
        prerequisite_skills: [],
        
        // Completion criteria
        min_pass_score: '80',
        max_attempts_per_module: '3',
        requires_practical_assessment: false,
        requires_certification: true,
        
        // Progress tracking
        send_progress_updates: true,
        progress_update_frequency: 'weekly', // daily, weekly, bi_weekly, monthly
        escalate_overdue_days: '7',
        manager_notification_days: '3',
        
        // Advanced settings
        priority: 'medium', // high, medium, low
        cost_per_participant: '',
        budget_code: '',
        training_provider: 'internal', // internal, external, mixed
        
        // Customization
        welcome_message: '',
        completion_message: '',
        certificate_template: 'default',
        has_custom_branding: false,
        
        description: '',
        notes: ''
    });

    // Permission checks
    const canCreatePipelines = canCreate('hrm.training.pipelines');
    const canEditPipelines = canUpdate('hrm.training.pipelines');
    const canDeletePipelines = canDelete('hrm.training.pipelines');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Pipelines", 
            value: stats.total_pipelines, 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Pipelines", 
            value: stats.active_pipelines, 
            icon: <BookOpenIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "In Progress", 
            value: stats.in_progress, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Completion Rate", 
            value: `${stats.completion_rate}%`, 
            icon: <TrophyIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Configuration
    const targetAudiences = [
        { key: 'department', label: 'Department', description: 'All employees in specific departments' },
        { key: 'role', label: 'Job Role', description: 'Employees with specific job roles' },
        { key: 'individual', label: 'Individual', description: 'Specific selected employees' },
        { key: 'all_employees', label: 'All Employees', description: 'Company-wide training' },
    ];

    const priorities = [
        { key: 'high', label: 'High Priority', color: 'danger' },
        { key: 'medium', label: 'Medium Priority', color: 'warning' },
        { key: 'low', label: 'Low Priority', color: 'default' },
    ];

    const updateFrequencies = [
        { key: 'daily', label: 'Daily' },
        { key: 'weekly', label: 'Weekly' },
        { key: 'bi_weekly', label: 'Bi-weekly' },
        { key: 'monthly', label: 'Monthly' },
    ];

    const trainingProviders = [
        { key: 'internal', label: 'Internal Trainers' },
        { key: 'external', label: 'External Providers' },
        { key: 'mixed', label: 'Mixed (Internal + External)' },
    ];

    const getStatusColor = (status) => {
        const colors = {
            active: 'success',
            paused: 'warning',
            completed: 'primary',
            cancelled: 'danger',
            draft: 'default'
        };
        return colors[status] || 'default';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'danger',
            medium: 'warning',
            low: 'default'
        };
        return colors[priority] || 'default';
    };

    const getCompletionColor = (percentage) => {
        if (percentage >= 80) return 'success';
        if (percentage >= 50) return 'warning';
        return 'danger';
    };

    // Data fetching
    const fetchPipelines = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.training.pipelines.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setPipelines(response.data.pipelines || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch training pipelines'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.training.pipelines.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch training pipeline stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPipelines();
        fetchStats();
    }, [fetchPipelines, fetchStats]);

    // CRUD operations
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedPipeline 
                    ? route('hrm.training.pipelines.update', selectedPipeline.id)
                    : route('hrm.training.pipelines.store');
                
                const response = await axios({
                    method: selectedPipeline ? 'PUT' : 'POST',
                    url,
                    data: formData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Training pipeline ${selectedPipeline ? 'updated' : 'created'} successfully`]);
                    fetchPipelines();
                    fetchStats();
                    closeModal(selectedPipeline ? 'edit' : 'add');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedPipeline ? 'update' : 'create'} training pipeline`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedPipeline ? 'Updating' : 'Creating'} training pipeline...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedPipeline) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.training.pipelines.destroy', selectedPipeline.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Training pipeline deleted successfully']);
                    fetchPipelines();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete training pipeline']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting training pipeline...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, pipeline = null) => {
        setSelectedPipeline(pipeline);
        if (pipeline && (type === 'edit' || type === 'view')) {
            setFormData({
                pipeline_name: pipeline.pipeline_name || '',
                department_id: pipeline.department_id || '',
                target_audience: pipeline.target_audience || 'department',
                target_role_ids: pipeline.target_role_ids || [],
                target_employee_ids: pipeline.target_employee_ids || [],
                
                training_programs: pipeline.training_programs || [],
                is_sequential: pipeline.is_sequential !== false,
                allow_parallel_completion: pipeline.allow_parallel_completion === true,
                
                start_date: pipeline.start_date || new Date().toISOString().split('T')[0],
                end_date: pipeline.end_date || '',
                duration_weeks: pipeline.duration_weeks || '4',
                auto_assign_new_hires: pipeline.auto_assign_new_hires === true,
                
                mandatory: pipeline.mandatory !== false,
                requires_manager_approval: pipeline.requires_manager_approval === true,
                prerequisite_skills: pipeline.prerequisite_skills || [],
                
                min_pass_score: pipeline.min_pass_score || '80',
                max_attempts_per_module: pipeline.max_attempts_per_module || '3',
                requires_practical_assessment: pipeline.requires_practical_assessment === true,
                requires_certification: pipeline.requires_certification !== false,
                
                send_progress_updates: pipeline.send_progress_updates !== false,
                progress_update_frequency: pipeline.progress_update_frequency || 'weekly',
                escalate_overdue_days: pipeline.escalate_overdue_days || '7',
                manager_notification_days: pipeline.manager_notification_days || '3',
                
                priority: pipeline.priority || 'medium',
                cost_per_participant: pipeline.cost_per_participant || '',
                budget_code: pipeline.budget_code || '',
                training_provider: pipeline.training_provider || 'internal',
                
                welcome_message: pipeline.welcome_message || '',
                completion_message: pipeline.completion_message || '',
                certificate_template: pipeline.certificate_template || 'default',
                has_custom_branding: pipeline.has_custom_branding === true,
                
                description: pipeline.description || '',
                notes: pipeline.notes || ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedPipeline(null);
    };

    const resetForm = () => {
        setFormData({
            pipeline_name: '',
            department_id: '',
            target_audience: 'department',
            target_role_ids: [],
            target_employee_ids: [],
            
            training_programs: [],
            is_sequential: true,
            allow_parallel_completion: false,
            
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            duration_weeks: '4',
            auto_assign_new_hires: false,
            
            mandatory: true,
            requires_manager_approval: false,
            prerequisite_skills: [],
            
            min_pass_score: '80',
            max_attempts_per_module: '3',
            requires_practical_assessment: false,
            requires_certification: true,
            
            send_progress_updates: true,
            progress_update_frequency: 'weekly',
            escalate_overdue_days: '7',
            manager_notification_days: '3',
            
            priority: 'medium',
            cost_per_participant: '',
            budget_code: '',
            training_provider: 'internal',
            
            welcome_message: '',
            completion_message: '',
            certificate_template: 'default',
            has_custom_branding: false,
            
            description: '',
            notes: ''
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Form handlers
    const handleFormChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Training program handlers
    const addTrainingProgram = (programId) => {
        if (formData.training_programs.includes(programId)) return;
        
        setFormData(prev => ({
            ...prev,
            training_programs: [...prev.training_programs, programId]
        }));
    };

    const removeTrainingProgram = (programId) => {
        setFormData(prev => ({
            ...prev,
            training_programs: prev.training_programs.filter(id => id !== programId)
        }));
    };

    const reorderTrainingPrograms = (fromIndex, toIndex) => {
        const newPrograms = [...formData.training_programs];
        const [moved] = newPrograms.splice(fromIndex, 1);
        newPrograms.splice(toIndex, 0, moved);
        
        setFormData(prev => ({
            ...prev,
            training_programs: newPrograms
        }));
    };

    // Table columns
    const columns = [
        { uid: 'pipeline_name', name: 'Pipeline Name' },
        { uid: 'target', name: 'Target Audience' },
        { uid: 'programs', name: 'Programs' },
        { uid: 'progress', name: 'Progress' },
        { uid: 'timeline', name: 'Timeline' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((pipeline, columnKey) => {
        switch (columnKey) {
            case 'pipeline_name':
                return (
                    <div>
                        <p className="font-medium">{pipeline.pipeline_name}</p>
                        <p className="text-xs text-default-500">{pipeline.description}</p>
                    </div>
                );
            case 'target':
                return (
                    <div className="text-sm">
                        <Chip size="sm" variant="flat" color="primary">
                            {pipeline.target_audience?.replace('_', ' ').toUpperCase()}
                        </Chip>
                        {pipeline.target_audience === 'department' && pipeline.department && (
                            <p className="text-xs text-default-500 mt-1">{pipeline.department.name}</p>
                        )}
                        {pipeline.target_audience === 'individual' && (
                            <p className="text-xs text-default-500 mt-1">{pipeline.target_count || 0} employees</p>
                        )}
                    </div>
                );
            case 'programs':
                return (
                    <div className="text-sm">
                        <p className="font-medium">{pipeline.program_count || 0} programs</p>
                        {pipeline.is_sequential && (
                            <Chip size="sm" variant="flat" color="warning">Sequential</Chip>
                        )}
                    </div>
                );
            case 'progress':
                return (
                    <div className="w-full max-w-md">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Completion</span>
                            <span>{pipeline.completion_percentage || 0}%</span>
                        </div>
                        <Progress
                            value={pipeline.completion_percentage || 0}
                            color={getCompletionColor(pipeline.completion_percentage || 0)}
                            size="sm"
                        />
                        <p className="text-xs text-default-500 mt-1">
                            {pipeline.completed_participants || 0} / {pipeline.total_participants || 0} completed
                        </p>
                    </div>
                );
            case 'timeline':
                return (
                    <div className="text-sm">
                        <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span>{pipeline.duration_weeks}w</span>
                        </div>
                        <p className="text-xs text-default-500">
                            {pipeline.start_date} - {pipeline.end_date || 'Ongoing'}
                        </p>
                        {pipeline.days_overdue > 0 && (
                            <Chip size="sm" color="danger" variant="flat">
                                {pipeline.days_overdue}d overdue
                            </Chip>
                        )}
                    </div>
                );
            case 'priority':
                return (
                    <Chip 
                        color={getPriorityColor(pipeline.priority)} 
                        size="sm" 
                        variant="flat"
                    >
                        {pipeline.priority?.toUpperCase()}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(pipeline.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {pipeline.status?.toUpperCase()}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', pipeline)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditPipelines && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => openModal('edit', pipeline)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeletePipelines && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => openModal('delete', pipeline)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return pipeline[columnKey] || '-';
        }
    }, [canEditPipelines, canDeletePipelines]);

    return (
        <>
            <Head title={title} />
            
            {/* Add/Edit Pipeline Modal */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="5xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedPipeline ? 'Edit Training Pipeline' : 'Create Training Pipeline'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Training Pipeline Configuration">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <Input
                                            label="Pipeline Name"
                                            placeholder="New Employee Onboarding Training"
                                            value={formData.pipeline_name}
                                            onValueChange={(value) => handleFormChange('pipeline_name', value)}
                                            isRequired
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Description"
                                            placeholder="Comprehensive training program for new employees covering company policies, procedures, and job-specific skills..."
                                            value={formData.description}
                                            onValueChange={(value) => handleFormChange('description', value)}
                                            radius={themeRadius}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Target Audience"
                                                selectedKeys={[formData.target_audience]}
                                                onSelectionChange={(keys) => handleFormChange('target_audience', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {targetAudiences.map(audience => (
                                                    <SelectItem key={audience.key} description={audience.description}>
                                                        {audience.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            {formData.target_audience === 'department' && (
                                                <Select
                                                    label="Department"
                                                    placeholder="Select department"
                                                    selectedKeys={formData.department_id ? [formData.department_id] : []}
                                                    onSelectionChange={(keys) => handleFormChange('department_id', Array.from(keys)[0] || '')}
                                                    radius={themeRadius}
                                                >
                                                    {departments.map(dept => (
                                                        <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                                    ))}
                                                </Select>
                                            )}

                                            <Select
                                                label="Priority"
                                                selectedKeys={[formData.priority]}
                                                onSelectionChange={(keys) => handleFormChange('priority', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {priorities.map(priority => (
                                                    <SelectItem key={priority.key}>
                                                        {priority.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Training Provider"
                                                selectedKeys={[formData.training_provider]}
                                                onSelectionChange={(keys) => handleFormChange('training_provider', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {trainingProviders.map(provider => (
                                                    <SelectItem key={provider.key}>
                                                        {provider.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Start Date"
                                                type="date"
                                                value={formData.start_date}
                                                onValueChange={(value) => handleFormChange('start_date', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="End Date (Optional)"
                                                type="date"
                                                value={formData.end_date}
                                                onValueChange={(value) => handleFormChange('end_date', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Duration (weeks)"
                                                type="number"
                                                min="1"
                                                max="52"
                                                value={formData.duration_weeks}
                                                onValueChange={(value) => handleFormChange('duration_weeks', value)}
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="programs" title="Training Programs">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-semibold">Training Program Sequence</h5>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_sequential}
                                                        onChange={(e) => handleFormChange('is_sequential', e.target.checked)}
                                                    />
                                                    <span className="text-sm">Sequential Order</span>
                                                </label>
                                            </div>
                                        </div>

                                        <Select
                                            label="Add Training Program"
                                            placeholder="Select a program to add"
                                            onSelectionChange={(keys) => {
                                                const programId = Array.from(keys)[0];
                                                if (programId) {
                                                    addTrainingProgram(programId);
                                                }
                                            }}
                                            radius={themeRadius}
                                        >
                                            {programs.filter(p => !formData.training_programs.includes(p.id)).map(program => (
                                                <SelectItem key={program.id}>
                                                    {program.title}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <div className="space-y-2">
                                            <h6 className="font-medium">Selected Programs ({formData.training_programs.length})</h6>
                                            {formData.training_programs.length === 0 ? (
                                                <p className="text-sm text-default-500">No programs selected</p>
                                            ) : (
                                                formData.training_programs.map((programId, index) => {
                                                    const program = programs.find(p => p.id === programId);
                                                    return (
                                                        <div key={programId} className="flex items-center justify-between p-3 border border-divider rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                                                                    {index + 1}
                                                                </span>
                                                                <div>
                                                                    <p className="font-medium">{program?.title || 'Unknown Program'}</p>
                                                                    <p className="text-xs text-default-500">{program?.duration || 'N/A'} • {program?.difficulty_level || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {index > 0 && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="flat"
                                                                        onPress={() => reorderTrainingPrograms(index, index - 1)}
                                                                    >
                                                                        ↑
                                                                    </Button>
                                                                )}
                                                                {index < formData.training_programs.length - 1 && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="flat"
                                                                        onPress={() => reorderTrainingPrograms(index, index + 1)}
                                                                    >
                                                                        ↓
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="flat"
                                                                    onPress={() => removeTrainingProgram(programId)}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h6 className="font-medium">Completion Requirements</h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Minimum Pass Score (%)"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={formData.min_pass_score}
                                                    onValueChange={(value) => handleFormChange('min_pass_score', value)}
                                                    radius={themeRadius}
                                                />

                                                <Input
                                                    label="Max Attempts Per Module"
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={formData.max_attempts_per_module}
                                                    onValueChange={(value) => handleFormChange('max_attempts_per_module', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.mandatory}
                                                        onChange={(e) => handleFormChange('mandatory', e.target.checked)}
                                                    />
                                                    <span className="text-sm">Mandatory Training</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.requires_practical_assessment}
                                                        onChange={(e) => handleFormChange('requires_practical_assessment', e.target.checked)}
                                                    />
                                                    <span className="text-sm">Requires Practical Assessment</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.requires_certification}
                                                        onChange={(e) => handleFormChange('requires_certification', e.target.checked)}
                                                    />
                                                    <span className="text-sm">Issues Certificate on Completion</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="tracking" title="Progress Tracking">
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <h6 className="font-medium">Progress Updates</h6>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.send_progress_updates}
                                                    onChange={(e) => handleFormChange('send_progress_updates', e.target.checked)}
                                                />
                                                <span className="text-sm">Send Progress Updates</span>
                                            </label>

                                            {formData.send_progress_updates && (
                                                <Select
                                                    label="Update Frequency"
                                                    selectedKeys={[formData.progress_update_frequency]}
                                                    onSelectionChange={(keys) => handleFormChange('progress_update_frequency', Array.from(keys)[0])}
                                                    radius={themeRadius}
                                                >
                                                    {updateFrequencies.map(freq => (
                                                        <SelectItem key={freq.key}>
                                                            {freq.label}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h6 className="font-medium">Escalation Settings</h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Escalate Overdue After (days)"
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={formData.escalate_overdue_days}
                                                    onValueChange={(value) => handleFormChange('escalate_overdue_days', value)}
                                                    radius={themeRadius}
                                                />

                                                <Input
                                                    label="Manager Notification (days before due)"
                                                    type="number"
                                                    min="1"
                                                    max="14"
                                                    value={formData.manager_notification_days}
                                                    onValueChange={(value) => handleFormChange('manager_notification_days', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h6 className="font-medium">Automation</h6>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.auto_assign_new_hires}
                                                    onChange={(e) => handleFormChange('auto_assign_new_hires', e.target.checked)}
                                                />
                                                <span className="text-sm">Auto-assign to New Hires</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.requires_manager_approval}
                                                    onChange={(e) => handleFormChange('requires_manager_approval', e.target.checked)}
                                                />
                                                <span className="text-sm">Require Manager Approval to Start</span>
                                            </label>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="customization" title="Customization">
                                    <div className="space-y-4">
                                        <Textarea
                                            label="Welcome Message"
                                            placeholder="Welcome to our comprehensive training program! This pipeline will guide you through..."
                                            value={formData.welcome_message}
                                            onValueChange={(value) => handleFormChange('welcome_message', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Completion Message"
                                            placeholder="Congratulations! You have successfully completed the training pipeline..."
                                            value={formData.completion_message}
                                            onValueChange={(value) => handleFormChange('completion_message', value)}
                                            radius={themeRadius}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Cost Per Participant"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.cost_per_participant}
                                                onValueChange={(value) => handleFormChange('cost_per_participant', value)}
                                                radius={themeRadius}
                                                startContent="$"
                                            />

                                            <Input
                                                label="Budget Code"
                                                placeholder="TRAINING-2024-Q1"
                                                value={formData.budget_code}
                                                onValueChange={(value) => handleFormChange('budget_code', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.has_custom_branding}
                                                    onChange={(e) => handleFormChange('has_custom_branding', e.target.checked)}
                                                />
                                                <span className="text-sm">Use Custom Branding</span>
                                            </label>
                                        </div>

                                        <Textarea
                                            label="Additional Notes"
                                            placeholder="Any additional notes or special instructions for this training pipeline..."
                                            value={formData.notes}
                                            onValueChange={(value) => handleFormChange('notes', value)}
                                            radius={themeRadius}
                                        />
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedPipeline ? 'Update Pipeline' : 'Create Pipeline'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {modalStates.delete && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Training Pipeline</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the training pipeline <strong>"{selectedPipeline?.pipeline_name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will affect all participants in this pipeline.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Pipeline</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Training Pipeline Management">
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
                                                    <AcademicCapIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Training Pipeline
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Structured learning paths and training sequences
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreatePipelines && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
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
                                            placeholder="Search training pipelines..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments.map(department => (
                                                <SelectItem key={department.id}>{department.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Priorities"
                                            selectedKeys={filters.priority !== 'all' ? [filters.priority] : []}
                                            onSelectionChange={(keys) => handleFilterChange('priority', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Priorities</SelectItem>
                                            {priorities.map(priority => (
                                                <SelectItem key={priority.key}>{priority.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="paused">Paused</SelectItem>
                                            <SelectItem key="completed">Completed</SelectItem>
                                            <SelectItem key="draft">Draft</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Training Pipelines" 
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
                                            emptyContent={loading ? "Loading..." : "No training pipelines found"}
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

TrainingPipeline.layout = (page) => <App children={page} />;
export default TrainingPipeline;