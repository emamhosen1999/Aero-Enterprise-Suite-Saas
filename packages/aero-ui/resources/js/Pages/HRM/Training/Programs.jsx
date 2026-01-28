import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    BookOpenIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    AcademicCapIcon,
    PlayIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Programs = ({ title, trainers: initialTrainers = [], employees: initialEmployees = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Theme radius helper
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
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
    const [programs, setPrograms] = useState([]);
    const [trainers, setTrainers] = useState(initialTrainers);
    const [employees, setEmployees] = useState(initialEmployees);
    const [filters, setFilters] = useState({ search: '', category: '', status: '', trainer_id: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        active: 0, 
        completed: 0, 
        draft: 0,
        totalParticipants: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false });
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'technical',
        trainer_id: '',
        duration_hours: '',
        max_participants: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        location: '',
        delivery_method: 'in_person',
        prerequisites: '',
        objectives: '',
        materials: '',
        cost_per_participant: '',
        certification: false,
        status: 'draft'
    });

    // Permission checks
    const canCreateProgram = canCreate('hrm.training.programs') || isSuperAdmin();
    const canUpdateProgram = canUpdate('hrm.training.programs') || isSuperAdmin();
    const canDeleteProgram = canDelete('hrm.training.programs') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Programs", 
            value: stats.total, 
            icon: <BookOpenIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active", 
            value: stats.active, 
            icon: <PlayIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Completed", 
            value: stats.completed, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Participants", 
            value: stats.totalParticipants, 
            icon: <AcademicCapIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Training program configuration
    const categories = [
        { key: 'technical', label: 'Technical Skills' },
        { key: 'soft_skills', label: 'Soft Skills' },
        { key: 'leadership', label: 'Leadership' },
        { key: 'compliance', label: 'Compliance' },
        { key: 'safety', label: 'Safety' },
        { key: 'customer_service', label: 'Customer Service' },
        { key: 'sales', label: 'Sales' },
        { key: 'management', label: 'Management' },
        { key: 'other', label: 'Other' },
    ];

    const deliveryMethods = [
        { key: 'in_person', label: 'In-Person' },
        { key: 'online', label: 'Online' },
        { key: 'hybrid', label: 'Hybrid' },
        { key: 'self_paced', label: 'Self-Paced' },
    ];

    const programStatuses = [
        { key: 'draft', label: 'Draft', color: 'default' },
        { key: 'published', label: 'Published', color: 'primary' },
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'completed', label: 'Completed', color: 'warning' },
        { key: 'cancelled', label: 'Cancelled', color: 'danger' },
    ];

    const getStatusColor = (status) => {
        return programStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return programStatuses.find(s => s.key === status)?.label || status;
    };

    const getCategoryLabel = (category) => {
        return categories.find(c => c.key === category)?.label || category;
    };

    const getDeliveryMethodLabel = (method) => {
        return deliveryMethods.find(m => m.key === method)?.label || method;
    };

    // Data fetching
    const fetchPrograms = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.training.programs.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setPrograms(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch training programs'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.training.programs.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch program stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrograms();
        fetchStats();
    }, [fetchPrograms, fetchStats]);

    // Modal handlers
    const openModal = (type, program = null) => {
        setSelectedProgram(program);
        if (program) {
            setFormData({
                name: program.name || '',
                description: program.description || '',
                category: program.category || 'technical',
                trainer_id: program.trainer_id || '',
                duration_hours: program.duration_hours || '',
                max_participants: program.max_participants || '',
                start_date: program.start_date || '',
                end_date: program.end_date || '',
                registration_deadline: program.registration_deadline || '',
                location: program.location || '',
                delivery_method: program.delivery_method || 'in_person',
                prerequisites: program.prerequisites || '',
                objectives: program.objectives || '',
                materials: program.materials || '',
                cost_per_participant: program.cost_per_participant || '',
                certification: program.certification || false,
                status: program.status || 'draft'
            });
        } else {
            setFormData({
                name: '',
                description: '',
                category: 'technical',
                trainer_id: '',
                duration_hours: '',
                max_participants: '',
                start_date: '',
                end_date: '',
                registration_deadline: '',
                location: '',
                delivery_method: 'in_person',
                prerequisites: '',
                objectives: '',
                materials: '',
                cost_per_participant: '',
                certification: false,
                status: 'draft'
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedProgram(null);
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedProgram 
                    ? route('hrm.training.programs.update', selectedProgram.id)
                    : route('hrm.training.programs.store');
                
                const method = selectedProgram ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Training program ${selectedProgram ? 'updated' : 'created'} successfully`]);
                    fetchPrograms();
                    fetchStats();
                    closeModal(selectedProgram ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedProgram ? 'update' : 'create'} training program`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedProgram ? 'Updating' : 'Creating'} training program...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.training.programs.destroy', selectedProgram.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Training program deleted successfully']);
                    fetchPrograms();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete training program']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting training program...',
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
        { uid: 'name', name: 'Program Name' },
        { uid: 'category', name: 'Category' },
        { uid: 'trainer', name: 'Trainer' },
        { uid: 'duration', name: 'Duration' },
        { uid: 'participants', name: 'Participants' },
        { uid: 'dates', name: 'Schedule' },
        { uid: 'delivery', name: 'Delivery' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-small text-default-500 truncate">{item.description.slice(0, 50)}...</p>}
                    </div>
                );
            case 'category':
                return getCategoryLabel(item.category);
            case 'trainer':
                return item.trainer?.name || 'Not assigned';
            case 'duration':
                return `${item.duration_hours || 0}h`;
            case 'participants':
                return `${item.enrolled_count || 0}/${item.max_participants || 0}`;
            case 'dates':
                return (
                    <div>
                        {item.start_date && <p className="text-small">{new Date(item.start_date).toLocaleDateString()}</p>}
                        {item.end_date && <p className="text-tiny text-default-400">to {new Date(item.end_date).toLocaleDateString()}</p>}
                    </div>
                );
            case 'delivery':
                return getDeliveryMethodLabel(item.delivery_method);
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
                        {canUpdateProgram && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteProgram && (
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
    }, [canUpdateProgram, canDeleteProgram]);

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
                                {selectedProgram ? 'Edit Training Program' : 'Create Training Program'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Input
                                    label="Program Name"
                                    placeholder="Enter program name"
                                    value={formData.name}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                                    isRequired
                                    radius={getThemeRadius()}
                                />

                                <Textarea
                                    label="Description"
                                    placeholder="Enter program description"
                                    value={formData.description}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                    rows={3}
                                    radius={getThemeRadius()}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Select
                                        label="Category"
                                        placeholder="Select category"
                                        selectedKeys={formData.category ? [formData.category] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, category: Array.from(keys)[0] || 'technical' }))}
                                        isRequired
                                        radius={getThemeRadius()}
                                    >
                                        {categories.map(category => (
                                            <SelectItem key={category.key}>{category.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Trainer"
                                        placeholder="Select trainer"
                                        selectedKeys={formData.trainer_id ? [formData.trainer_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, trainer_id: Array.from(keys)[0] || '' }))}
                                        radius={getThemeRadius()}
                                    >
                                        {trainers.map(trainer => (
                                            <SelectItem key={trainer.id}>{trainer.name}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Delivery Method"
                                        placeholder="Select method"
                                        selectedKeys={formData.delivery_method ? [formData.delivery_method] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, delivery_method: Array.from(keys)[0] || 'in_person' }))}
                                        isRequired
                                        radius={getThemeRadius()}
                                    >
                                        {deliveryMethods.map(method => (
                                            <SelectItem key={method.key}>{method.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Duration (Hours)"
                                        placeholder="0"
                                        value={formData.duration_hours}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration_hours: value }))}
                                        type="number"
                                        isRequired
                                        radius={getThemeRadius()}
                                    />

                                    <Input
                                        label="Max Participants"
                                        placeholder="0"
                                        value={formData.max_participants}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, max_participants: value }))}
                                        type="number"
                                        radius={getThemeRadius()}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        type="date"
                                        label="Start Date"
                                        value={formData.start_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                                        radius={getThemeRadius()}
                                    />
                                    
                                    <Input
                                        type="date"
                                        label="End Date"
                                        value={formData.end_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, end_date: value }))}
                                        radius={getThemeRadius()}
                                    />

                                    <Input
                                        type="date"
                                        label="Registration Deadline"
                                        value={formData.registration_deadline}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, registration_deadline: value }))}
                                        radius={getThemeRadius()}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Location"
                                        placeholder="Enter location or online platform"
                                        value={formData.location}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                                        radius={getThemeRadius()}
                                    />

                                    <Input
                                        label="Cost per Participant"
                                        placeholder="0.00"
                                        value={formData.cost_per_participant}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, cost_per_participant: value }))}
                                        type="number"
                                        step="0.01"
                                        startContent="$"
                                        radius={getThemeRadius()}
                                    />
                                </div>

                                <Textarea
                                    label="Prerequisites"
                                    placeholder="Enter prerequisites"
                                    value={formData.prerequisites}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, prerequisites: value }))}
                                    rows={2}
                                    radius={getThemeRadius()}
                                />

                                <Textarea
                                    label="Learning Objectives"
                                    placeholder="Enter learning objectives"
                                    value={formData.objectives}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, objectives: value }))}
                                    rows={3}
                                    radius={getThemeRadius()}
                                />

                                <Textarea
                                    label="Materials Required"
                                    placeholder="Enter materials or resources needed"
                                    value={formData.materials}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, materials: value }))}
                                    rows={2}
                                    radius={getThemeRadius()}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.certification}
                                                onChange={(e) => setFormData(prev => ({ ...prev, certification: e.target.checked }))}
                                            />
                                            <span className="text-sm font-medium">Provides Certification</span>
                                        </label>
                                    </div>

                                    <Select
                                        label="Status"
                                        placeholder="Select status"
                                        selectedKeys={formData.status ? [formData.status] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] || 'draft' }))}
                                        radius={getThemeRadius()}
                                    >
                                        {programStatuses.map(status => (
                                            <SelectItem key={status.key}>{status.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedProgram ? 'Update' : 'Create'} Program
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedProgram && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="3xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Training Program Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-default-600">Program Name</label>
                                    <p className="text-default-900 font-medium">{selectedProgram.name}</p>
                                    {selectedProgram.description && (
                                        <p className="text-small text-default-500 mt-1">{selectedProgram.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Category</label>
                                        <p className="text-default-900">{getCategoryLabel(selectedProgram.category)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Duration</label>
                                        <p className="text-default-900">{selectedProgram.duration_hours} hours</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Max Participants</label>
                                        <p className="text-default-900">{selectedProgram.max_participants || 'Unlimited'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Trainer</label>
                                        <p className="text-default-900">{selectedProgram.trainer?.name || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Delivery Method</label>
                                        <p className="text-default-900">{getDeliveryMethodLabel(selectedProgram.delivery_method)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Schedule</label>
                                        <div>
                                            {selectedProgram.start_date && <p className="text-default-900">{new Date(selectedProgram.start_date).toLocaleDateString()}</p>}
                                            {selectedProgram.end_date && <p className="text-small text-default-500">to {new Date(selectedProgram.end_date).toLocaleDateString()}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Registration Deadline</label>
                                        <p className="text-default-900">
                                            {selectedProgram.registration_deadline 
                                                ? new Date(selectedProgram.registration_deadline).toLocaleDateString() 
                                                : 'No deadline'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Location</label>
                                        <p className="text-default-900">{selectedProgram.location || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Cost</label>
                                        <p className="text-default-900">
                                            {selectedProgram.cost_per_participant 
                                                ? `$${parseFloat(selectedProgram.cost_per_participant).toFixed(2)}` 
                                                : 'Free'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Status</label>
                                        <Chip 
                                            color={getStatusColor(selectedProgram.status)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStatusLabel(selectedProgram.status)}
                                        </Chip>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Certification</label>
                                        <Chip 
                                            color={selectedProgram.certification ? 'success' : 'default'} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {selectedProgram.certification ? 'Yes' : 'No'}
                                        </Chip>
                                    </div>
                                </div>

                                {selectedProgram.prerequisites && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Prerequisites</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedProgram.prerequisites}
                                        </p>
                                    </div>
                                )}

                                {selectedProgram.objectives && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Learning Objectives</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedProgram.objectives}
                                        </p>
                                    </div>
                                )}

                                {selectedProgram.materials && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Materials Required</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedProgram.materials}
                                        </p>
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

            {modalStates.delete && selectedProgram && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Training Program</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the training program "<strong>{selectedProgram.name}</strong>"?</p>
                            <p className="text-sm text-default-500">This action cannot be undone and will affect enrolled participants.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Training Programs Management">
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
                                                    <BookOpenIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Training Programs
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee training and development programs
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateProgram && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Program
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
                                            placeholder="Search programs..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Select
                                            placeholder="All Categories"
                                            selectedKeys={filters.category ? [filters.category] : []}
                                            onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || '')}
                                        >
                                            {categories.map(category => (
                                                <SelectItem key={category.key}>{category.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {programStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Trainers"
                                            selectedKeys={filters.trainer_id ? [filters.trainer_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('trainer_id', Array.from(keys)[0] || '')}
                                        >
                                            {trainers.map(trainer => (
                                                <SelectItem key={trainer.id}>{trainer.name}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Training Programs" 
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
                                            items={programs} 
                                            emptyContent={loading ? "Loading..." : "No training programs found"}
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

Programs.layout = (page) => <App children={page} />;
export default Programs;