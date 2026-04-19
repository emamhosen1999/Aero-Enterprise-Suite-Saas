import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Switch, Progress, Avatar } from "@heroui/react";
import { 
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    CalendarDaysIcon,
    AcademicCapIcon,
    DocumentCheckIcon,
    UsersIcon,
    ChartBarIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Enrollment = ({ title, programs: initialPrograms = [], employees: initialEmployees = [], departments: initialDepartments = [] }) => {
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
    const [enrollments, setEnrollments] = useState([]);
    const [programs, setPrograms] = useState(initialPrograms);
    const [employees, setEmployees] = useState(initialEmployees);
    const [departments, setDepartments] = useState(initialDepartments);
    const [filters, setFilters] = useState({ 
        search: '', 
        program_id: '', 
        department_id: '', 
        status: '', 
        enrollment_date: '',
        completion_status: ''
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_enrollments: 0, 
        active_enrollments: 0, 
        completed_enrollments: 0, 
        completion_rate: 0,
        average_score: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false, bulk: false });
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [bulkEnrollmentData, setBulkEnrollmentData] = useState({
        program_id: '',
        employee_ids: [],
        enrollment_date: new Date().toISOString().split('T')[0],
        deadline: '',
        mandatory: false,
        send_notification: true
    });
    const [formData, setFormData] = useState({
        program_id: '',
        employee_id: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        deadline: '',
        status: 'enrolled',
        mandatory: false,
        priority: 'medium',
        notes: '',
        send_notification: true
    });

    // Permission checks
    const canCreateEnrollment = canCreate('hrm.training.enrollment') || isSuperAdmin();
    const canUpdateEnrollment = canUpdate('hrm.training.enrollment') || isSuperAdmin();
    const canDeleteEnrollment = canDelete('hrm.training.enrollment') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Enrollments", 
            value: stats.total_enrollments, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Enrollments", 
            value: stats.active_enrollments, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Completed", 
            value: stats.completed_enrollments, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Completion Rate", 
            value: `${stats.completion_rate}%`, 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Enrollment configuration
    const enrollmentStatuses = [
        { key: 'enrolled', label: 'Enrolled', color: 'primary' },
        { key: 'in_progress', label: 'In Progress', color: 'warning' },
        { key: 'completed', label: 'Completed', color: 'success' },
        { key: 'dropped', label: 'Dropped', color: 'danger' },
        { key: 'on_hold', label: 'On Hold', color: 'default' },
    ];

    const priorities = [
        { key: 'high', label: 'High Priority', color: 'danger' },
        { key: 'medium', label: 'Medium Priority', color: 'warning' },
        { key: 'low', label: 'Low Priority', color: 'default' },
    ];

    const getStatusColor = (status) => {
        return enrollmentStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return enrollmentStatuses.find(s => s.key === status)?.label || status;
    };

    const getPriorityColor = (priority) => {
        return priorities.find(p => p.key === priority)?.color || 'default';
    };

    const getPriorityLabel = (priority) => {
        return priorities.find(p => p.key === priority)?.label || priority;
    };

    const getProgressPercentage = (enrollment) => {
        if (enrollment.status === 'completed') return 100;
        if (enrollment.status === 'in_progress') {
            return enrollment.progress_percentage || 0;
        }
        if (enrollment.status === 'enrolled') return 10;
        return 0;
    };

    // Data fetching
    const fetchEnrollments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.training.enrollment.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setEnrollments(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch enrollments'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.training.enrollment.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch enrollment stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEnrollments();
        fetchStats();
    }, [fetchEnrollments, fetchStats]);

    // Modal handlers
    const openModal = (type, enrollment = null) => {
        setSelectedEnrollment(enrollment);
        if (enrollment) {
            setFormData({
                program_id: enrollment.program_id || '',
                employee_id: enrollment.employee_id || '',
                enrollment_date: enrollment.enrollment_date || new Date().toISOString().split('T')[0],
                deadline: enrollment.deadline || '',
                status: enrollment.status || 'enrolled',
                mandatory: enrollment.mandatory || false,
                priority: enrollment.priority || 'medium',
                notes: enrollment.notes || '',
                send_notification: true
            });
        } else {
            setFormData({
                program_id: '',
                employee_id: '',
                enrollment_date: new Date().toISOString().split('T')[0],
                deadline: '',
                status: 'enrolled',
                mandatory: false,
                priority: 'medium',
                notes: '',
                send_notification: true
            });
        }
        if (type === 'bulk') {
            setBulkEnrollmentData({
                program_id: '',
                employee_ids: [],
                enrollment_date: new Date().toISOString().split('T')[0],
                deadline: '',
                mandatory: false,
                send_notification: true
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedEnrollment(null);
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedEnrollment 
                    ? route('hrm.training.enrollment.update', selectedEnrollment.id)
                    : route('hrm.training.enrollment.store');
                
                const method = selectedEnrollment ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Enrollment ${selectedEnrollment ? 'updated' : 'created'} successfully`]);
                    fetchEnrollments();
                    fetchStats();
                    closeModal(selectedEnrollment ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedEnrollment ? 'update' : 'create'} enrollment`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedEnrollment ? 'Updating' : 'Creating'} enrollment...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Bulk enrollment submission
    const handleBulkSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.training.enrollment.bulk'), bulkEnrollmentData);
                
                if (response.status === 200) {
                    resolve([response.data.message || 'Bulk enrollment completed successfully']);
                    fetchEnrollments();
                    fetchStats();
                    closeModal('bulk');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to create bulk enrollments']);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating bulk enrollments...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.training.enrollment.destroy', selectedEnrollment.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Enrollment deleted successfully']);
                    fetchEnrollments();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete enrollment']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting enrollment...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Multi-select handler for bulk enrollment
    const handleBulkEmployeeSelection = (selectedKeys) => {
        setBulkEnrollmentData(prev => ({ 
            ...prev, 
            employee_ids: Array.from(selectedKeys).map(key => parseInt(key))
        }));
    };

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'program', name: 'Program' },
        { uid: 'enrollment_date', name: 'Enrolled On' },
        { uid: 'deadline', name: 'Deadline' },
        { uid: 'progress', name: 'Progress' },
        { uid: 'status', name: 'Status' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={item.employee?.profile_image_url}
                            name={item.employee?.name}
                            size="sm"
                            fallback={<UsersIcon className="w-4 h-4" />}
                        />
                        <div>
                            <p className="font-medium">{item.employee?.name || 'N/A'}</p>
                            <p className="text-small text-default-500">{item.employee?.department?.name || 'N/A'}</p>
                        </div>
                    </div>
                );
            case 'program':
                return (
                    <div>
                        <p className="font-medium">{item.program?.title || 'N/A'}</p>
                        <p className="text-small text-default-500">{item.program?.duration || ''}</p>
                    </div>
                );
            case 'enrollment_date':
                return new Date(item.enrollment_date).toLocaleDateString();
            case 'deadline':
                if (!item.deadline) return 'No deadline';
                const deadline = new Date(item.deadline);
                const today = new Date();
                const isOverdue = deadline < today && item.status !== 'completed';
                return (
                    <span className={isOverdue ? 'text-danger' : ''}>
                        {deadline.toLocaleDateString()}
                        {isOverdue && ' (Overdue)'}
                    </span>
                );
            case 'progress':
                const progressPercentage = getProgressPercentage(item);
                return (
                    <div className="flex items-center gap-2">
                        <Progress
                            size="sm"
                            radius="lg"
                            classNames={{
                                track: "drop-shadow-md border border-default",
                                indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
                                label: "tracking-wider font-medium text-default-600",
                                value: "text-foreground/60",
                            }}
                            value={progressPercentage}
                            showValueLabel={true}
                            className="max-w-md"
                        />
                    </div>
                );
            case 'status':
                return (
                    <div className="flex items-center gap-2">
                        <Chip 
                            color={getStatusColor(item.status)} 
                            size="sm" 
                            variant="flat"
                        >
                            {getStatusLabel(item.status)}
                        </Chip>
                        {item.mandatory && (
                            <Chip size="sm" variant="flat" color="warning">
                                Mandatory
                            </Chip>
                        )}
                    </div>
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
                        {canUpdateEnrollment && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteEnrollment && (
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
    }, [canUpdateEnrollment, canDeleteEnrollment]);

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
                                {selectedEnrollment ? 'Edit Enrollment' : 'Add Enrollment'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Training Program"
                                        placeholder="Select program"
                                        selectedKeys={formData.program_id ? [formData.program_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, program_id: Array.from(keys)[0] || '' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {programs.map(program => (
                                            <SelectItem key={program.id} value={program.id}>
                                                {program.title} - {program.duration}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Employee"
                                        placeholder="Select employee"
                                        selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, employee_id: Array.from(keys)[0] || '' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {employees.map(employee => (
                                            <SelectItem key={employee.id} value={employee.id}>
                                                {employee.name} ({employee.department?.name || 'No Dept'})
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Enrollment Date"
                                        placeholder="Select date"
                                        value={formData.enrollment_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, enrollment_date: value }))}
                                        type="date"
                                        isRequired
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Deadline (Optional)"
                                        placeholder="Select deadline"
                                        value={formData.deadline}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, deadline: value }))}
                                        type="date"
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Status"
                                        placeholder="Select status"
                                        selectedKeys={formData.status ? [formData.status] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] || 'enrolled' }))}
                                        radius={themeRadius}
                                    >
                                        {enrollmentStatuses.map(status => (
                                            <SelectItem key={status.key}>{status.label}</SelectItem>
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

                                <Input
                                    label="Notes"
                                    placeholder="Enter any notes"
                                    value={formData.notes}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                                    radius={themeRadius}
                                />

                                <div className="flex gap-4">
                                    <Switch
                                        isSelected={formData.mandatory}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, mandatory: value }))}
                                    >
                                        Mandatory Training
                                    </Switch>
                                    
                                    <Switch
                                        isSelected={formData.send_notification}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, send_notification: value }))}
                                    >
                                        Send Notification
                                    </Switch>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedEnrollment ? 'Update' : 'Create'} Enrollment
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.bulk && (
                <Modal 
                    isOpen={modalStates.bulk} 
                    onOpenChange={() => closeModal('bulk')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Bulk Enrollment</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Select
                                    label="Training Program"
                                    placeholder="Select program for bulk enrollment"
                                    selectedKeys={bulkEnrollmentData.program_id ? [bulkEnrollmentData.program_id] : []}
                                    onSelectionChange={(keys) => setBulkEnrollmentData(prev => ({ ...prev, program_id: Array.from(keys)[0] || '' }))}
                                    isRequired
                                    radius={themeRadius}
                                >
                                    {programs.map(program => (
                                        <SelectItem key={program.id} value={program.id}>
                                            {program.title} - {program.duration}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Employees"
                                    placeholder="Select employees"
                                    selectedKeys={new Set(bulkEnrollmentData.employee_ids.map(id => String(id)))}
                                    onSelectionChange={handleBulkEmployeeSelection}
                                    selectionMode="multiple"
                                    isRequired
                                    radius={themeRadius}
                                >
                                    {employees.map(employee => (
                                        <SelectItem key={employee.id} value={employee.id}>
                                            {employee.name} ({employee.department?.name || 'No Dept'})
                                        </SelectItem>
                                    ))}
                                </Select>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Enrollment Date"
                                        placeholder="Select date"
                                        value={bulkEnrollmentData.enrollment_date}
                                        onValueChange={(value) => setBulkEnrollmentData(prev => ({ ...prev, enrollment_date: value }))}
                                        type="date"
                                        isRequired
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Deadline (Optional)"
                                        placeholder="Select deadline"
                                        value={bulkEnrollmentData.deadline}
                                        onValueChange={(value) => setBulkEnrollmentData(prev => ({ ...prev, deadline: value }))}
                                        type="date"
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <Switch
                                        isSelected={bulkEnrollmentData.mandatory}
                                        onValueChange={(value) => setBulkEnrollmentData(prev => ({ ...prev, mandatory: value }))}
                                    >
                                        Mandatory Training
                                    </Switch>
                                    
                                    <Switch
                                        isSelected={bulkEnrollmentData.send_notification}
                                        onValueChange={(value) => setBulkEnrollmentData(prev => ({ ...prev, send_notification: value }))}
                                    >
                                        Send Notifications
                                    </Switch>
                                </div>

                                <div className="p-4 bg-default-100 rounded-lg">
                                    <p className="text-sm text-default-600">
                                        <strong>{bulkEnrollmentData.employee_ids.length}</strong> employees will be enrolled 
                                        in the selected program.
                                    </p>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('bulk')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleBulkSubmit}>
                                Create Bulk Enrollment
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedEnrollment && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Enrollment Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        src={selectedEnrollment.employee?.profile_image_url}
                                        name={selectedEnrollment.employee?.name}
                                        size="lg"
                                        fallback={<UsersIcon className="w-8 h-8" />}
                                    />
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedEnrollment.employee?.name}</h3>
                                        <p className="text-default-600">{selectedEnrollment.employee?.department?.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Training Program</label>
                                        <p className="text-default-900 font-medium">{selectedEnrollment.program?.title}</p>
                                        <p className="text-sm text-default-500">{selectedEnrollment.program?.duration}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Status</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Chip 
                                                color={getStatusColor(selectedEnrollment.status)} 
                                                variant="flat"
                                            >
                                                {getStatusLabel(selectedEnrollment.status)}
                                            </Chip>
                                            {selectedEnrollment.mandatory && (
                                                <Chip color="warning" variant="flat">Mandatory</Chip>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Enrolled On</label>
                                        <p className="text-default-900">
                                            {new Date(selectedEnrollment.enrollment_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Deadline</label>
                                        <p className="text-default-900">
                                            {selectedEnrollment.deadline 
                                                ? new Date(selectedEnrollment.deadline).toLocaleDateString()
                                                : 'No deadline set'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600 mb-2 block">Progress</label>
                                    <Progress
                                        size="md"
                                        radius="lg"
                                        classNames={{
                                            track: "drop-shadow-md border border-default",
                                            indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
                                            label: "tracking-wider font-medium text-default-600",
                                            value: "text-foreground/60",
                                        }}
                                        value={getProgressPercentage(selectedEnrollment)}
                                        showValueLabel={true}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600">Priority</label>
                                    <Chip 
                                        color={getPriorityColor(selectedEnrollment.priority)} 
                                        variant="flat"
                                        className="mt-1"
                                    >
                                        {getPriorityLabel(selectedEnrollment.priority)}
                                    </Chip>
                                </div>

                                {selectedEnrollment.notes && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Notes</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedEnrollment.notes}
                                        </p>
                                    </div>
                                )}

                                {selectedEnrollment.completion_date && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Completed On</label>
                                        <p className="text-default-900">
                                            {new Date(selectedEnrollment.completion_date).toLocaleDateString()}
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

            {modalStates.delete && selectedEnrollment && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Enrollment</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete this enrollment?</p>
                            <p className="text-sm text-default-500">
                                Employee: <strong>{selectedEnrollment?.employee?.name}</strong><br />
                                Program: <strong>{selectedEnrollment?.program?.title}</strong>
                            </p>
                            <p className="text-sm text-default-500">This action cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Training Enrollment Management">
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
                                                        Training Enrollment
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee training enrollments and progress
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateEnrollment && (
                                                    <>
                                                        <Button color="secondary" variant="flat"
                                                            startContent={<UserGroupIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('bulk')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Bulk Enroll
                                                        </Button>
                                                        <Button color="primary" variant="shadow"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('add')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Add Enrollment
                                                        </Button>
                                                    </>
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
                                            placeholder="Search enrollments..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Programs"
                                            selectedKeys={filters.program_id ? [filters.program_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('program_id', Array.from(keys)[0] || '')}
                                        >
                                            {programs.map(program => (
                                                <SelectItem key={program.id}>{program.title}</SelectItem>
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
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {enrollmentStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Training Enrollments" 
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
                                            items={enrollments} 
                                            emptyContent={loading ? "Loading..." : "No enrollments found"}
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

Enrollment.layout = (page) => <App children={page} />;
export default Enrollment;