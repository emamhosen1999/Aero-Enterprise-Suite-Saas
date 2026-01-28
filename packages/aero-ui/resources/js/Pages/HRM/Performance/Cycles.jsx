import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    DocumentTextIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    DocumentCheckIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const AppraisalCycles = ({ title, employees: initialEmployees = [], templates: initialTemplates = [] }) => {
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
    const [cycles, setCycles] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees);
    const [templates, setTemplates] = useState(initialTemplates);
    const [filters, setFilters] = useState({ search: '', status: '', period: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        active: 0, 
        completed: 0, 
        draft: 0,
        totalParticipants: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false, launch: false });
    const [selectedCycle, setSelectedCycle] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        template_id: '',
        status: 'draft',
        self_evaluation: true,
        manager_evaluation: true,
        peer_evaluation: false,
        subordinate_evaluation: false,
        instructions: ''
    });

    // Permission checks
    const canCreateCycle = canCreate('hrm.performance.cycles') || isSuperAdmin();
    const canUpdateCycle = canUpdate('hrm.performance.cycles') || isSuperAdmin();
    const canDeleteCycle = canDelete('hrm.performance.cycles') || isSuperAdmin();
    const canLaunchCycle = canUpdate('hrm.performance.cycles') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Cycles", 
            value: stats.total, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active", 
            value: stats.active, 
            icon: <ClockIcon className="w-6 h-6" />, 
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
            title: "Participants", 
            value: stats.totalParticipants, 
            icon: <DocumentCheckIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Cycle statuses
    const cycleStatuses = [
        { key: 'draft', label: 'Draft', color: 'default' },
        { key: 'active', label: 'Active', color: 'warning' },
        { key: 'completed', label: 'Completed', color: 'success' },
        { key: 'cancelled', label: 'Cancelled', color: 'danger' },
    ];

    const getStatusColor = (status) => {
        return cycleStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return cycleStatuses.find(s => s.key === status)?.label || status;
    };

    // Data fetching
    const fetchCycles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.cycles.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setCycles(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch appraisal cycles'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.performance.cycles.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch cycle stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCycles();
        fetchStats();
    }, [fetchCycles, fetchStats]);

    // Modal handlers
    const openModal = (type, cycle = null) => {
        setSelectedCycle(cycle);
        if (cycle) {
            setFormData({
                name: cycle.name || '',
                description: cycle.description || '',
                start_date: cycle.start_date || '',
                end_date: cycle.end_date || '',
                template_id: cycle.template_id || '',
                status: cycle.status || 'draft',
                self_evaluation: cycle.self_evaluation !== undefined ? cycle.self_evaluation : true,
                manager_evaluation: cycle.manager_evaluation !== undefined ? cycle.manager_evaluation : true,
                peer_evaluation: cycle.peer_evaluation !== undefined ? cycle.peer_evaluation : false,
                subordinate_evaluation: cycle.subordinate_evaluation !== undefined ? cycle.subordinate_evaluation : false,
                instructions: cycle.instructions || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                template_id: '',
                status: 'draft',
                self_evaluation: true,
                manager_evaluation: true,
                peer_evaluation: false,
                subordinate_evaluation: false,
                instructions: ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedCycle(null);
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedCycle 
                    ? route('hrm.performance.cycles.update', selectedCycle.id)
                    : route('hrm.performance.cycles.store');
                
                const method = selectedCycle ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Appraisal cycle ${selectedCycle ? 'updated' : 'created'} successfully`]);
                    fetchCycles();
                    fetchStats();
                    closeModal(selectedCycle ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedCycle ? 'update' : 'create'} appraisal cycle`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedCycle ? 'Updating' : 'Creating'} appraisal cycle...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Launch cycle handler
    const handleLaunch = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('hrm.performance.cycles.launch', selectedCycle.id)
                );
                if (response.status === 200) {
                    resolve([response.data.message || 'Appraisal cycle launched successfully']);
                    fetchCycles();
                    fetchStats();
                    closeModal('launch');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to launch appraisal cycle']);
            }
        });

        showToast.promise(promise, {
            loading: 'Launching appraisal cycle...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.performance.cycles.destroy', selectedCycle.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Appraisal cycle deleted successfully']);
                    fetchCycles();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete appraisal cycle']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting appraisal cycle...',
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
        { uid: 'name', name: 'Cycle Name' },
        { uid: 'period', name: 'Period' },
        { uid: 'participants', name: 'Participants' },
        { uid: 'completion', name: 'Completion' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-small text-default-500">{item.description}</p>}
                    </div>
                );
            case 'period':
                return (
                    <div>
                        <p className="text-sm">{new Date(item.start_date).toLocaleDateString()}</p>
                        <p className="text-small text-default-500">to {new Date(item.end_date).toLocaleDateString()}</p>
                    </div>
                );
            case 'participants':
                return item.total_participants || 0;
            case 'completion':
                const completionRate = item.total_participants > 0 
                    ? Math.round((item.completed_evaluations / item.total_participants) * 100) 
                    : 0;
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-small">{completionRate}%</span>
                        <span className="text-tiny text-default-400">
                            ({item.completed_evaluations || 0}/{item.total_participants || 0})
                        </span>
                    </div>
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
                        {item.status === 'draft' && canLaunchCycle && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                color="primary"
                                onPress={() => openModal('launch', item)}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canUpdateCycle && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteCycle && (
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
    }, [canUpdateCycle, canDeleteCycle, canLaunchCycle]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedCycle ? 'Edit Appraisal Cycle' : 'Create Appraisal Cycle'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Input
                                    label="Cycle Name"
                                    placeholder="Enter cycle name"
                                    value={formData.name}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                                    isRequired
                                    radius={getThemeRadius()}
                                />

                                <Textarea
                                    label="Description"
                                    placeholder="Enter cycle description"
                                    value={formData.description}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                    rows={2}
                                    radius={getThemeRadius()}
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="date"
                                        label="Start Date"
                                        value={formData.start_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                                        isRequired
                                        radius={getThemeRadius()}
                                    />
                                    
                                    <Input
                                        type="date"
                                        label="End Date"
                                        value={formData.end_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, end_date: value }))}
                                        isRequired
                                        radius={getThemeRadius()}
                                    />
                                </div>

                                <Select
                                    label="Evaluation Template"
                                    placeholder="Select template"
                                    selectedKeys={formData.template_id ? [formData.template_id] : []}
                                    onSelectionChange={(keys) => setFormData(prev => ({ ...prev, template_id: Array.from(keys)[0] || '' }))}
                                    radius={getThemeRadius()}
                                >
                                    {templates.map(template => (
                                        <SelectItem key={template.id}>{template.name}</SelectItem>
                                    ))}
                                </Select>

                                <div>
                                    <label className="text-sm font-medium text-default-600 mb-3 block">
                                        Evaluation Types
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.self_evaluation}
                                                onChange={(e) => setFormData(prev => ({ ...prev, self_evaluation: e.target.checked }))}
                                            />
                                            <span className="text-sm">Self Evaluation</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.manager_evaluation}
                                                onChange={(e) => setFormData(prev => ({ ...prev, manager_evaluation: e.target.checked }))}
                                            />
                                            <span className="text-sm">Manager Evaluation</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.peer_evaluation}
                                                onChange={(e) => setFormData(prev => ({ ...prev, peer_evaluation: e.target.checked }))}
                                            />
                                            <span className="text-sm">Peer Evaluation</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.subordinate_evaluation}
                                                onChange={(e) => setFormData(prev => ({ ...prev, subordinate_evaluation: e.target.checked }))}
                                            />
                                            <span className="text-sm">Subordinate Evaluation</span>
                                        </label>
                                    </div>
                                </div>

                                <Textarea
                                    label="Instructions"
                                    placeholder="Enter instructions for participants..."
                                    value={formData.instructions}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, instructions: value }))}
                                    rows={4}
                                    radius={getThemeRadius()}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedCycle ? 'Update' : 'Create'} Cycle
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedCycle && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Appraisal Cycle Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-default-600">Cycle Name</label>
                                    <p className="text-default-900 font-medium">{selectedCycle.name}</p>
                                    {selectedCycle.description && (
                                        <p className="text-small text-default-500 mt-1">{selectedCycle.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Period</label>
                                        <p className="text-default-900">
                                            {new Date(selectedCycle.start_date).toLocaleDateString()} - 
                                            {new Date(selectedCycle.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Status</label>
                                        <Chip 
                                            color={getStatusColor(selectedCycle.status)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStatusLabel(selectedCycle.status)}
                                        </Chip>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600">Evaluation Types</label>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {selectedCycle.self_evaluation && <Chip size="sm" variant="flat" color="primary">Self</Chip>}
                                        {selectedCycle.manager_evaluation && <Chip size="sm" variant="flat" color="success">Manager</Chip>}
                                        {selectedCycle.peer_evaluation && <Chip size="sm" variant="flat" color="warning">Peer</Chip>}
                                        {selectedCycle.subordinate_evaluation && <Chip size="sm" variant="flat" color="secondary">Subordinate</Chip>}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600">Progress</label>
                                    <p className="text-default-900 mt-1">
                                        {selectedCycle.completed_evaluations || 0} of {selectedCycle.total_participants || 0} evaluations completed
                                    </p>
                                </div>

                                {selectedCycle.instructions && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Instructions</label>
                                        <p className="text-default-900 mt-1 text-sm bg-default-100 p-3 rounded">
                                            {selectedCycle.instructions}
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

            {modalStates.launch && selectedCycle && (
                <Modal isOpen={modalStates.launch} onOpenChange={() => closeModal('launch')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-primary">Launch Appraisal Cycle</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you ready to launch the appraisal cycle "<strong>{selectedCycle.name}</strong>"?</p>
                            <p className="text-sm text-default-500">
                                This will notify all participants and make the cycle active. You won't be able to edit 
                                the cycle settings once it's launched.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('launch')}>Cancel</Button>
                            <Button color="primary" onPress={handleLaunch}>Launch Cycle</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedCycle && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Appraisal Cycle</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the appraisal cycle "<strong>{selectedCycle.name}</strong>"?</p>
                            <p className="text-sm text-default-500">This action cannot be undone and will remove all associated evaluation data.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Appraisal Cycles Management">
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
                                                    <DocumentTextIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Appraisal Cycles
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage performance evaluation cycles
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateCycle && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Cycle
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
                                            placeholder="Search cycles..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {cycleStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Appraisal Cycles" 
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
                                            items={cycles} 
                                            emptyContent={loading ? "Loading..." : "No appraisal cycles found"}
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

AppraisalCycles.layout = (page) => <App children={page} />;
export default AppraisalCycles;