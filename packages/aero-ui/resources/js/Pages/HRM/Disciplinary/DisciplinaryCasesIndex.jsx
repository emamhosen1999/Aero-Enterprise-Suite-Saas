import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    CheckCircleIcon,
    ClockIcon,
    DocumentMagnifyingGlassIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import DisciplinaryCasesTable from '@/Tables/HRM/DisciplinaryCasesTable.jsx';
import DisciplinaryCaseForm from '@/Forms/HRM/DisciplinaryCaseForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const DisciplinaryCasesIndex = ({ title, actionTypes: initialActionTypes, employees: initialEmployees }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

    // Data state
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [cases, setCases] = useState([]);
    const [actionTypes, setActionTypes] = useState(initialActionTypes || []);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [stats, setStats] = useState({ total: 0, pending: 0, investigating: 0, closed: 0 });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, disciplinaryCase: null });
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const [actionDetails, setActionDetails] = useState('');

    // Permissions
    const canCreateCase = canCreate('hrm.disciplinary') || isSuperAdmin();
    const canEditCase = canUpdate('hrm.disciplinary') || isSuperAdmin();
    const canDeleteCase = canDelete('hrm.disciplinary') || isSuperAdmin();
    const canManageCase = canUpdate('hrm.disciplinary') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Total Cases", value: stats.total, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Investigating", value: stats.investigating, icon: <DocumentMagnifyingGlassIcon className="w-6 h-6" />, color: "text-info", iconBg: "bg-info/20" },
        { title: "Closed", value: stats.closed, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    // Fetch cases
    const fetchCases = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.disciplinary.cases.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                }
            });
            if (response.status === 200) {
                setCases(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            showToast.error('Failed to fetch cases');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.disciplinary.cases.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Fetch action types if not provided
    const fetchActionTypes = useCallback(async () => {
        if (actionTypes.length > 0) return;
        try {
            const response = await axios.get(route('hrm.disciplinary.action-types.list'));
            if (response.status === 200) setActionTypes(response.data);
        } catch (error) {
            console.error('Failed to fetch action types:', error);
        }
    }, [actionTypes.length]);

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
        fetchCases();
        fetchStats();
        fetchActionTypes();
        fetchEmployees();
    }, [fetchCases, fetchStats, fetchActionTypes, fetchEmployees]);

    // Modal handlers
    const openModal = (type, disciplinaryCase = null) => setModalState({ type, disciplinaryCase });
    const closeModal = () => setModalState({ type: null, disciplinaryCase: null });

    // CRUD handlers
    const handleEdit = (caseItem) => openModal('edit', caseItem);
    
    const handleDelete = async (caseItem) => {
        if (!confirm(`Are you sure you want to delete this disciplinary case?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.disciplinary.cases.destroy', caseItem.id));
                resolve(['Disciplinary case deleted successfully']);
                fetchCases();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete case']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Deleting case...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Workflow handlers
    const handleStartInvestigation = async (caseItem) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.disciplinary.cases.start-investigation', caseItem.id));
                resolve(['Investigation started']);
                fetchCases();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to start investigation']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Starting investigation...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleTakeAction = (caseItem) => {
        setSelectedCase(caseItem);
        setActionModalOpen(true);
    };

    const submitAction = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.disciplinary.cases.take-action', selectedCase.id), {
                    action_details: actionDetails
                });
                resolve(['Action recorded successfully']);
                setActionModalOpen(false);
                setActionDetails('');
                setSelectedCase(null);
                fetchCases();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to record action']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Recording action...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleClose = async (caseItem) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.disciplinary.cases.close', caseItem.id));
                resolve(['Case closed successfully']);
                fetchCases();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to close case']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Closing case...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleView = (caseItem) => openModal('view', caseItem);
    
    const handleSuccess = () => {
        fetchCases();
        fetchStats();
        closeModal();
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

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            <Button 
                isIconOnly 
                variant="flat" 
                onPress={() => { fetchCases(); fetchStats(); }}
            >
                <ArrowPathIcon className="w-4 h-4" />
            </Button>
            {canCreateCase && (
                <Button 
                    color="primary" 
                    variant="shadow" 
                    startContent={<PlusIcon className="w-4 h-4" />} 
                    onPress={() => openModal('add')}
                >
                    New Case
                </Button>
            )}
        </>
    ), [canCreateCase, fetchCases, fetchStats]);

    // Filter section
    const filterSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input 
                label="Search" 
                placeholder="Search cases..." 
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
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="investigating">Investigating</SelectItem>
                <SelectItem key="action_taken">Action Taken</SelectItem>
                <SelectItem key="closed">Closed</SelectItem>
                <SelectItem key="dismissed">Dismissed</SelectItem>
            </Select>
        </div>
    ), [filters, themeRadius]);

    // Pagination section
    const paginationSection = pagination.lastPage > 1 ? (
        <div className="flex justify-center">
            <Pagination
                total={pagination.lastPage}
                page={pagination.currentPage}
                onChange={handlePageChange}
                showControls
                radius={themeRadius}
            />
        </div>
    ) : null;

    return (
        <>
            <Head title={title || "Disciplinary Cases"} />
            
            {/* Add/Edit Modal */}
            {(modalState.type === 'add' || modalState.type === 'edit') && (
                <DisciplinaryCaseForm
                    disciplinaryCase={modalState.disciplinaryCase}
                    actionTypes={actionTypes}
                    employees={employees}
                    open={true}
                    closeModal={closeModal}
                    onSuccess={handleSuccess}
                    editMode={modalState.type === 'edit'}
                />
            )}

            {/* Take Action Modal */}
            <Modal isOpen={actionModalOpen} onOpenChange={setActionModalOpen} size="lg">
                <ModalContent>
                    <ModalHeader>Record Disciplinary Action</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-500 mb-4">
                            Record the action taken for case <strong>{selectedCase?.case_number}</strong>
                        </p>
                        <Textarea
                            label="Action Details"
                            placeholder="Describe the disciplinary action taken..."
                            value={actionDetails}
                            onValueChange={setActionDetails}
                            radius={themeRadius}
                            minRows={4}
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setActionModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={submitAction} isDisabled={!actionDetails.trim()}>
                            Record Action
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Disciplinary Cases"
                subtitle="Manage disciplinary cases, investigations, and warnings"
                icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                isLoading={loading && statsLoading}
                ariaLabel="Disciplinary Cases Management"
                actions={actionButtons}
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={filterSection}
                pagination={paginationSection}
            >
                <DisciplinaryCasesTable
                    cases={cases}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStartInvestigation={handleStartInvestigation}
                    onTakeAction={handleTakeAction}
                    onClose={handleClose}
                    onView={handleView}
                    canEdit={canEditCase}
                    canDelete={canDeleteCase}
                    canManage={canManageCase}
                />
            </StandardPageLayout>
        </>
    );
};

export default DisciplinaryCasesIndex;
