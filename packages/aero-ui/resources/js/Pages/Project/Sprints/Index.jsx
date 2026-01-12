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
    Progress,
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
    RocketLaunchIcon,
    PlayIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    StopIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import dayjs from 'dayjs';

const SprintsIndex = ({ title, project, sprints: initialSprints, stats: initialStats, activeSprint, filters: initialFilters }) => {
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
    const [sprints, setSprints] = useState(initialSprints?.data || []);
    const [stats, setStats] = useState(initialStats || {});
    const [currentActiveSprint, setCurrentActiveSprint] = useState(activeSprint);
    const [pagination, setPagination] = useState({
        currentPage: initialSprints?.current_page || 1,
        lastPage: initialSprints?.last_page || 1,
        perPage: 10,
        total: initialSprints?.total || 0,
    });

    // Filters
    const [filters, setFilters] = useState({
        status: initialFilters?.status || 'all',
    });

    // Modal states
    const [modalStates, setModalStates] = useState({
        create: false,
        edit: false,
        delete: false,
        start: false,
        complete: false,
    });
    const [currentSprint, setCurrentSprint] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        goal: '',
        start_date: dayjs().format('YYYY-MM-DD'),
        end_date: dayjs().add(14, 'day').format('YYYY-MM-DD'),
        capacity_points: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);

    // Permissions
    const canManageSprints = canUpdate('project.sprints') || isSuperAdmin();
    const canCreateSprints = canCreate('project.sprints') || isSuperAdmin();
    const canDeleteSprints = canDelete('project.sprints') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Sprints",
            value: stats.total || 0,
            icon: <RocketLaunchIcon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All sprints"
        },
        {
            title: "Active",
            value: stats.active || 0,
            icon: <PlayIcon className="w-5 h-5" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Currently running"
        },
        {
            title: "Completed",
            value: stats.completed || 0,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Finished sprints"
        },
        {
            title: "Avg. Velocity",
            value: Math.round(stats.average_velocity || 0),
            icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Points per sprint"
        },
    ], [stats]);

    // Status options
    const statusOptions = [
        { key: 'planned', label: 'Planned', color: 'default' },
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'completed', label: 'Completed', color: 'primary' },
        { key: 'cancelled', label: 'Cancelled', color: 'danger' },
    ];

    // Fetch sprints data
    const fetchSprints = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('project.sprints.index', { project: project.id }), {
                params: {
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    status: filters.status !== 'all' ? filters.status : undefined,
                },
            });

            if (response.status === 200) {
                setSprints(response.data.sprints.data || []);
                setStats(response.data.stats || {});
                setCurrentActiveSprint(response.data.activeSprint);
                setPagination(prev => ({
                    ...prev,
                    currentPage: response.data.sprints.current_page,
                    lastPage: response.data.sprints.last_page,
                    total: response.data.sprints.total,
                }));
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch sprints'
            });
        } finally {
            setLoading(false);
        }
    }, [project.id, pagination.currentPage, pagination.perPage, filters]);

    useEffect(() => {
        fetchSprints();
    }, [fetchSprints]);

    // Handle filter changes
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Modal handlers
    const openModal = useCallback((modalType, sprint = null) => {
        if (sprint) {
            setCurrentSprint(sprint);
            setFormData({
                name: sprint.name,
                goal: sprint.goal || '',
                start_date: sprint.start_date ? dayjs(sprint.start_date).format('YYYY-MM-DD') : '',
                end_date: sprint.end_date ? dayjs(sprint.end_date).format('YYYY-MM-DD') : '',
                capacity_points: sprint.capacity_points || '',
            });
        } else {
            setCurrentSprint(null);
            setFormData({
                name: '',
                goal: '',
                start_date: dayjs().format('YYYY-MM-DD'),
                end_date: dayjs().add(14, 'day').format('YYYY-MM-DD'),
                capacity_points: '',
            });
        }
        setFormErrors({});
        setModalStates(prev => ({ ...prev, [modalType]: true }));
    }, []);

    const closeModal = useCallback((modalType) => {
        setModalStates(prev => ({ ...prev, [modalType]: false }));
        setCurrentSprint(null);
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
                    route('project.sprints.store', { project: project.id }),
                    formData
                );
                if (response.status === 200 || response.status === 201) {
                    closeModal('create');
                    fetchSprints();
                    resolve([response.data.message || 'Sprint created successfully']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject([error.response?.data?.message || 'Failed to create sprint']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating sprint...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [formData, project.id, closeModal, fetchSprints]);

    const handleUpdate = useCallback(async () => {
        if (!currentSprint) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(
                    route('project.sprints.update', { project: project.id, sprint: currentSprint.id }),
                    formData
                );
                if (response.status === 200) {
                    closeModal('edit');
                    fetchSprints();
                    resolve([response.data.message || 'Sprint updated successfully']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject([error.response?.data?.message || 'Failed to update sprint']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating sprint...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [currentSprint, formData, project.id, closeModal, fetchSprints]);

    const handleDelete = useCallback(async () => {
        if (!currentSprint) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(
                    route('project.sprints.destroy', { project: project.id, sprint: currentSprint.id })
                );
                if (response.status === 200) {
                    closeModal('delete');
                    fetchSprints();
                    resolve([response.data.message || 'Sprint deleted successfully']);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete sprint']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting sprint...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [currentSprint, project.id, closeModal, fetchSprints]);

    const handleStartSprint = useCallback(async () => {
        if (!currentSprint) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('project.sprints.start', { project: project.id, sprint: currentSprint.id })
                );
                if (response.status === 200) {
                    closeModal('start');
                    fetchSprints();
                    resolve([response.data.message || 'Sprint started successfully']);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to start sprint']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Starting sprint...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [currentSprint, project.id, closeModal, fetchSprints]);

    const handleCompleteSprint = useCallback(async () => {
        if (!currentSprint) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('project.sprints.complete', { project: project.id, sprint: currentSprint.id })
                );
                if (response.status === 200) {
                    closeModal('complete');
                    fetchSprints();
                    resolve([response.data.message || 'Sprint completed successfully']);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to complete sprint']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Completing sprint...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [currentSprint, project.id, closeModal, fetchSprints]);

    // Navigate to sprint board
    const goToSprintBoard = useCallback((sprint) => {
        router.visit(route('project.sprints.show', { project: project.id, sprint: sprint.id }));
    }, [project.id]);

    // Render sprint card
    const renderSprintCard = useCallback((sprint) => {
        const statusOption = statusOptions.find(s => s.key === sprint.status);
        const startDate = dayjs(sprint.start_date);
        const endDate = dayjs(sprint.end_date);
        const today = dayjs();
        const totalDays = endDate.diff(startDate, 'day');
        const daysElapsed = today.diff(startDate, 'day');
        const timeProgress = sprint.status === 'active' ? Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100)) : 0;
        const taskProgress = sprint.progress_percentage || 0;

        return (
            <Card
                key={sprint.id}
                className="transition-all duration-200 hover:shadow-lg cursor-pointer"
                isPressable
                onPress={() => goToSprintBoard(sprint)}
            >
                <CardBody className="p-4">
                    <div className="flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-lg">{sprint.name}</h4>
                                    <Chip size="sm" variant="flat" color={statusOption?.color || 'default'}>
                                        {statusOption?.label || sprint.status}
                                    </Chip>
                                    {sprint.id === currentActiveSprint?.id && (
                                        <Chip size="sm" variant="dot" color="success">Current</Chip>
                                    )}
                                </div>
                                {sprint.goal && (
                                    <p className="text-sm text-default-500 line-clamp-2">{sprint.goal}</p>
                                )}
                            </div>
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light" onClick={(e) => e.stopPropagation()}>
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Sprint Actions">
                                    <DropdownItem
                                        key="view"
                                        startContent={<ChartBarIcon className="w-4 h-4" />}
                                        onPress={() => goToSprintBoard(sprint)}
                                    >
                                        View Board
                                    </DropdownItem>
                                    {sprint.status === 'planned' && canManageSprints && (
                                        <DropdownItem
                                            key="start"
                                            startContent={<PlayIcon className="w-4 h-4" />}
                                            onPress={() => {
                                                setCurrentSprint(sprint);
                                                openModal('start', sprint);
                                            }}
                                        >
                                            Start Sprint
                                        </DropdownItem>
                                    )}
                                    {sprint.status === 'active' && canManageSprints && (
                                        <DropdownItem
                                            key="complete"
                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                            onPress={() => {
                                                setCurrentSprint(sprint);
                                                openModal('complete', sprint);
                                            }}
                                        >
                                            Complete Sprint
                                        </DropdownItem>
                                    )}
                                    {canManageSprints && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => openModal('edit', sprint)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {canDeleteSprints && sprint.status !== 'active' && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => openModal('delete', sprint)}
                                        >
                                            Delete
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-4 text-sm text-default-500">
                            <div className="flex items-center gap-1">
                                <CalendarDaysIcon className="w-4 h-4" />
                                <span>{startDate.format('MMM D')} - {endDate.format('MMM D, YYYY')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{sprint.tasks_count || 0} tasks</span>
                            </div>
                        </div>

                        {/* Progress */}
                        {sprint.status === 'active' && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-default-500">Task Progress</span>
                                    <span className="font-medium">{Math.round(taskProgress)}%</span>
                                </div>
                                <Progress
                                    value={taskProgress}
                                    color={taskProgress >= 80 ? 'success' : taskProgress >= 40 ? 'warning' : 'primary'}
                                    size="sm"
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-default-500">Time Elapsed</span>
                                    <span className="font-medium">{Math.round(timeProgress)}%</span>
                                </div>
                                <Progress
                                    value={timeProgress}
                                    color={timeProgress > taskProgress ? 'danger' : 'success'}
                                    size="sm"
                                />
                            </div>
                        )}

                        {/* Velocity (for completed sprints) */}
                        {sprint.status === 'completed' && sprint.velocity !== null && (
                            <div className="flex items-center gap-2 text-sm">
                                <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
                                <span className="text-default-500">Velocity:</span>
                                <span className="font-semibold">{sprint.velocity} points</span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        );
    }, [statusOptions, currentActiveSprint, canManageSprints, canDeleteSprints, openModal, goToSprintBoard]);

    // Form Modal
    const renderFormModal = (isEdit = false) => (
        <Modal
            isOpen={isEdit ? modalStates.edit : modalStates.create}
            onOpenChange={() => closeModal(isEdit ? 'edit' : 'create')}
            size="lg"
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
                        {isEdit ? 'Edit Sprint' : 'Create New Sprint'}
                    </h2>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <Input
                            label="Sprint Name"
                            placeholder="e.g., Sprint 1 - User Authentication"
                            value={formData.name}
                            onValueChange={(value) => handleFormChange('name', value)}
                            isInvalid={!!formErrors.name}
                            errorMessage={formErrors.name}
                            isRequired
                            radius={themeRadius}
                        />

                        <Textarea
                            label="Sprint Goal"
                            placeholder="What do you want to achieve in this sprint?"
                            value={formData.goal}
                            onValueChange={(value) => handleFormChange('goal', value)}
                            isInvalid={!!formErrors.goal}
                            errorMessage={formErrors.goal}
                            minRows={2}
                            radius={themeRadius}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="date"
                                label="Start Date"
                                value={formData.start_date}
                                onChange={(e) => handleFormChange('start_date', e.target.value)}
                                isInvalid={!!formErrors.start_date}
                                errorMessage={formErrors.start_date}
                                isRequired
                                radius={themeRadius}
                            />

                            <Input
                                type="date"
                                label="End Date"
                                value={formData.end_date}
                                onChange={(e) => handleFormChange('end_date', e.target.value)}
                                isInvalid={!!formErrors.end_date}
                                errorMessage={formErrors.end_date}
                                isRequired
                                radius={themeRadius}
                            />
                        </div>

                        <Input
                            type="number"
                            label="Capacity (Story Points)"
                            placeholder="e.g., 30"
                            value={formData.capacity_points}
                            onValueChange={(value) => handleFormChange('capacity_points', value)}
                            isInvalid={!!formErrors.capacity_points}
                            errorMessage={formErrors.capacity_points}
                            min={0}
                            radius={themeRadius}
                        />
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
            <Head title={title || `Sprints - ${project?.project_name}`} />

            {/* Create Modal */}
            {modalStates.create && renderFormModal(false)}

            {/* Edit Modal */}
            {modalStates.edit && renderFormModal(true)}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')} size="sm">
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete this sprint?</p>
                        <p className="font-medium mt-2">{currentSprint?.name}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                        <Button color="danger" onPress={handleDelete} isLoading={formLoading}>Delete</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Start Sprint Modal */}
            <Modal isOpen={modalStates.start} onOpenChange={() => closeModal('start')} size="sm">
                <ModalContent>
                    <ModalHeader>Start Sprint</ModalHeader>
                    <ModalBody>
                        <p>Are you ready to start this sprint? This will make it the active sprint.</p>
                        <p className="font-medium mt-2">{currentSprint?.name}</p>
                        {currentActiveSprint && currentActiveSprint.id !== currentSprint?.id && (
                            <p className="text-warning text-sm mt-2">
                                Note: Starting this sprint will end the current active sprint.
                            </p>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => closeModal('start')}>Cancel</Button>
                        <Button color="success" onPress={handleStartSprint} isLoading={formLoading}>
                            Start Sprint
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Complete Sprint Modal */}
            <Modal isOpen={modalStates.complete} onOpenChange={() => closeModal('complete')} size="sm">
                <ModalContent>
                    <ModalHeader>Complete Sprint</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to complete this sprint?</p>
                        <p className="font-medium mt-2">{currentSprint?.name}</p>
                        <p className="text-sm text-default-500 mt-2">
                            Incomplete tasks will be moved back to the backlog.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => closeModal('complete')}>Cancel</Button>
                        <Button color="primary" onPress={handleCompleteSprint} isLoading={formLoading}>
                            Complete Sprint
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Sprint Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
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
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <RocketLaunchIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Sprints
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        {project?.project_name} - Sprint Planning
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateSprints && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('create')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        New Sprint
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
                                        <Select
                                            placeholder="Filter by status"
                                            selectedKeys={[filters.status]}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            className="w-full sm:w-48"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Statuses</SelectItem>
                                            {statusOptions.map(opt => (
                                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Sprint Cards Grid */}
                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <Card key={i}>
                                                    <CardBody className="p-4 space-y-3">
                                                        <Skeleton className="h-6 w-3/4 rounded" />
                                                        <Skeleton className="h-4 w-full rounded" />
                                                        <Skeleton className="h-4 w-1/2 rounded" />
                                                        <Skeleton className="h-2 w-full rounded" />
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : sprints.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {sprints.map(sprint => renderSprintCard(sprint))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <RocketLaunchIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                            <h3 className="text-lg font-semibold text-default-600 mb-2">No Sprints Found</h3>
                                            <p className="text-default-400 mb-4">Get started by creating your first sprint</p>
                                            {canCreateSprints && (
                                                <Button
                                                    color="primary"
                                                    startContent={<PlusIcon className="w-4 h-4" />}
                                                    onPress={() => openModal('create')}
                                                >
                                                    Create Sprint
                                                </Button>
                                            )}
                                        </div>
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

SprintsIndex.layout = (page) => <App children={page} />;
export default SprintsIndex;
