import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { 
    AcademicCapIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import TrainingSessionsTable from '@/Tables/HRM/TrainingSessionsTable.jsx';
import TrainingForm from '@/Forms/HRM/TrainingForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const TrainingIndex = ({ title, categories: initialCategories, trainers: initialTrainers, employees: initialEmployees }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
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

    // Data state
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [trainings, setTrainings] = useState([]);
    const [categories, setCategories] = useState(initialCategories || []);
    const [trainers, setTrainers] = useState(initialTrainers || []);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [stats, setStats] = useState({ total: 0, scheduled: 0, in_progress: 0, completed: 0 });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, training: null });
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    // Permissions using HRMAC with proper path
    const canCreateTraining = canCreate('hrm.training') || isSuperAdmin();
    const canEditTraining = canUpdate('hrm.training') || isSuperAdmin();
    const canDeleteTraining = canDelete('hrm.training') || isSuperAdmin();
    const canEnrollTraining = canUpdate('hrm.training') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Total Sessions", value: stats.total, icon: <AcademicCapIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Scheduled", value: stats.scheduled, icon: <CalendarDaysIcon className="w-6 h-6" />, color: "text-info", iconBg: "bg-info/20" },
        { title: "In Progress", value: stats.in_progress, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Completed", value: stats.completed, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    // Fetch trainings
    const fetchTrainings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.training.index'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                },
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.trainings || response.data;
                setTrainings(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch trainings:', error);
            showToast.error('Failed to fetch training sessions');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.training.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            // If stats endpoint doesn't exist, calculate from trainings
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Fetch employees if not provided
    const fetchEmployees = useCallback(async () => {
        if (employees.length > 0) return;
        try {
            const response = await axios.get(route('hrm.employees.list'));
            if (response.status === 200) setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, [employees.length]);

    useEffect(() => {
        fetchTrainings();
        fetchStats();
        fetchEmployees();
    }, [fetchTrainings, fetchStats, fetchEmployees]);

    // Modal handlers
    const openModal = (type, training = null) => setModalState({ type, training });
    const closeModal = () => setModalState({ type: null, training: null });

    // CRUD handlers
    const handleEdit = (training) => openModal('edit', training);
    
    const handleDelete = async (training) => {
        if (!confirm(`Are you sure you want to delete "${training.title}"?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.training.destroy', training.id));
                resolve(['Training session deleted successfully']);
                fetchTrainings();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete training session']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Deleting training session...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Enrollment handlers
    const handleEnroll = (training) => {
        setSelectedTraining(training);
        setSelectedEmployees(training.enrollments?.map(e => String(e.employee_id)) || []);
        setEnrollModalOpen(true);
    };

    const submitEnrollments = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.training.enrollments.store', selectedTraining.id), {
                    employee_ids: selectedEmployees
                });
                resolve(['Enrollments updated successfully']);
                setEnrollModalOpen(false);
                setSelectedEmployees([]);
                setSelectedTraining(null);
                fetchTrainings();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to update enrollments']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Updating enrollments...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleView = (training) => openModal('view', training);
    
    const handleSuccess = () => {
        fetchTrainings();
        fetchStats();
        closeModal();
    };

    // Add/Update optimized handlers for TrainingForm
    const addTrainingOptimized = (newTraining) => {
        setTrainings(prev => [newTraining, ...prev]);
    };

    const updateTrainingOptimized = (updatedTraining) => {
        setTrainings(prev => prev.map(t => t.id === updatedTraining.id ? updatedTraining : t));
    };

    // Pagination handler
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Filter handler
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    return (
        <>
            <Head title={title || "Training Management"} />
            
            {/* Add/Edit Modal */}
            {(modalState.type === 'add' || modalState.type === 'edit') && (
                <TrainingForm
                    open={true}
                    closeModal={closeModal}
                    currentTraining={modalState.training}
                    categories={categories}
                    trainers={trainers}
                    employees={employees}
                    addTrainingOptimized={addTrainingOptimized}
                    updateTrainingOptimized={updateTrainingOptimized}
                    fetchTrainingStats={fetchStats}
                />
            )}

            {/* Enrollment Modal */}
            <Modal isOpen={enrollModalOpen} onOpenChange={setEnrollModalOpen} size="lg">
                <ModalContent>
                    <ModalHeader>Manage Enrollments</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-500 mb-4">
                            Select employees to enroll in <strong>{selectedTraining?.title}</strong>
                            {selectedTraining?.max_participants && (
                                <span className="ml-1">(Max: {selectedTraining.max_participants})</span>
                            )}
                        </p>
                        <Select
                            label="Select Employees"
                            placeholder="Choose employees to enroll"
                            selectionMode="multiple"
                            selectedKeys={new Set(selectedEmployees)}
                            onSelectionChange={(keys) => setSelectedEmployees(Array.from(keys))}
                            radius={themeRadius}
                        >
                            {employees.map(emp => (
                                <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                    {emp.name}
                                </SelectItem>
                            ))}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setEnrollModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={submitEnrollments}>
                            Save Enrollments
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Training Management"
                subtitle="Manage training sessions and employee development"
                icon={<AcademicCapIcon />}
                isLoading={loading && statsLoading}
                ariaLabel="Training Management"
                actions={
                    <div className="flex gap-2">
                        <Button 
                            isIconOnly 
                            variant="flat" 
                            onPress={() => { fetchTrainings(); fetchStats(); }}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                        {canCreateTraining && (
                            <Button 
                                color="primary" 
                                variant="shadow" 
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => openModal('add')}
                            >
                                Add Training
                            </Button>
                        )}
                    </div>
                }
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            label="Search" 
                            placeholder="Search training sessions..." 
                            value={filters.search} 
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
                            variant="bordered" 
                            size="sm" 
                            radius={themeRadius}
                            className="flex-1"
                            isClearable
                            onClear={() => handleFilterChange('search', '')}
                        />
                        <Select 
                            label="Status" 
                            placeholder="All Statuses" 
                            variant="bordered" 
                            size="sm" 
                            radius={themeRadius} 
                            selectionMode="multiple"
                            selectedKeys={new Set(filters.status)}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                            className="w-full sm:w-48"
                        >
                            <SelectItem key="scheduled">Scheduled</SelectItem>
                            <SelectItem key="in_progress">In Progress</SelectItem>
                            <SelectItem key="completed">Completed</SelectItem>
                            <SelectItem key="cancelled">Cancelled</SelectItem>
                        </Select>
                    </div>
                }
                pagination={
                    pagination.lastPage > 1 && (
                        <div className="flex justify-center">
                            <Pagination
                                total={pagination.lastPage}
                                page={pagination.currentPage}
                                onChange={handlePageChange}
                                showControls
                                radius={themeRadius}
                            />
                        </div>
                    )
                }
            >
                <TrainingSessionsTable
                    trainings={trainings}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onEnroll={handleEnroll}
                    canEdit={canEditTraining}
                    canDelete={canDeleteTraining}
                    canEnroll={canEnrollTraining}
                />
            </StandardPageLayout>
        </>
    );
};

TrainingIndex.layout = (page) => <App children={page} />;
export default TrainingIndex;
