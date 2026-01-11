import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
    Button, 
    Input, 
    Select, 
    SelectItem, 
    Pagination, 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Tabs,
    Tab,
    Chip
} from "@heroui/react";
import { 
    ShieldExclamationIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentCheckIcon,
    CheckCircleIcon,
    PlusIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    FireIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import SafetyIncidentsTable from '@/Tables/HRM/SafetyIncidentsTable.jsx';
import SafetyIncidentForm from '@/Forms/HRM/SafetyIncidentForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const SafetyIndex = ({ title, employees: initialEmployees, locations: initialLocations }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin, hasAccess } = useHRMAC();

    // Data state
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [incidents, setIncidents] = useState([]);
    const [inspections, setInspections] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [locations, setLocations] = useState(initialLocations || []);
    const [activeTab, setActiveTab] = useState('incidents');
    const [stats, setStats] = useState({ 
        total_incidents: 0, 
        open_incidents: 0, 
        days_without_incident: 0,
        pending_inspections: 0 
    });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', severity: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, incident: null });

    // Permissions using HRMAC
    const canCreateIncident = canCreate('hrm.compliance.safety') || isSuperAdmin();
    const canEditIncident = canUpdate('hrm.compliance.safety') || isSuperAdmin();
    const canDeleteIncident = canDelete('hrm.compliance.safety') || isSuperAdmin();
    const canManageSafety = hasAccess('hrm.compliance.safety') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Total Incidents", value: stats.total_incidents, icon: <ShieldExclamationIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "Open Cases", value: stats.open_incidents, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Days Without Incident", value: stats.days_without_incident, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Pending Inspections", value: stats.pending_inspections, icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />, color: "text-info", iconBg: "bg-info/20" },
    ], [stats]);

    // Fetch data based on active tab
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'inspections' 
                ? 'hrm.safety.inspections.index' 
                : 'hrm.safety.incidents.index';
            
            const response = await axios.get(route(endpoint), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    severity: filters.severity || undefined,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                },
                headers: { 'Accept': 'application/json' }
            });
            if (response.status === 200) {
                const data = response.data.incidents || response.data.inspections || response.data;
                if (activeTab === 'inspections') {
                    setInspections(data.data || []);
                } else {
                    setIncidents(data.data || []);
                }
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    lastPage: data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showToast.error('Failed to fetch safety data');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage, activeTab]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.safety.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
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
        fetchData();
        fetchStats();
        fetchEmployees();
    }, [fetchData, fetchStats, fetchEmployees]);

    // Handle tab change
    const handleTabChange = (key) => {
        setActiveTab(key);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        setFilters({ search: '', severity: '', status: [] });
    };

    // CRUD handlers
    const handleView = (incident) => {
        setModalState({ type: 'view', incident });
    };
    
    const handleEdit = (incident) => {
        setModalState({ type: 'edit', incident });
    };
    
    const handleDelete = async (incident) => {
        const itemType = activeTab === 'inspections' ? 'inspection' : 'incident';
        if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;
        
        const endpoint = activeTab === 'inspections' 
            ? route('hrm.safety.inspections.destroy', incident.id)
            : route('hrm.safety.incidents.destroy', incident.id);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(endpoint);
                resolve([`${itemType} deleted successfully`]);
                fetchData();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || `Failed to delete ${itemType}`]);
            }
        });
        
        showToast.promise(promise, {
            loading: `Deleting ${itemType}...`,
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleResolve = async (incident) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.safety.incidents.resolve', incident.id));
                resolve(['Incident marked as resolved']);
                fetchData();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to resolve incident']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Resolving incident...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Form submit handler
    const handleFormSubmit = async (formData) => {
        const isEdit = modalState.type === 'edit';
        const isInspection = activeTab === 'inspections';
        
        let url, method;
        if (isInspection) {
            url = isEdit 
                ? route('hrm.safety.inspections.update', modalState.incident.id) 
                : route('hrm.safety.inspections.store');
        } else {
            url = isEdit 
                ? route('hrm.safety.incidents.update', modalState.incident.id) 
                : route('hrm.safety.incidents.store');
        }
        method = isEdit ? 'put' : 'post';
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios[method](url, formData);
                resolve([`${isInspection ? 'Inspection' : 'Incident'} ${isEdit ? 'updated' : 'created'} successfully`]);
                setModalState({ type: null, incident: null });
                fetchData();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'}`]);
            }
        });
        
        showToast.promise(promise, {
            loading: `${isEdit ? 'Updating' : 'Creating'}...`,
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
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

    const closeModal = () => setModalState({ type: null, incident: null });

    const permissions = {
        canCreate: canCreateIncident,
        canEdit: canEditIncident,
        canDelete: canDeleteIncident,
        canResolve: canManageSafety
    };

    const data = activeTab === 'inspections' ? inspections : incidents;

    const severityOptions = [
        { key: 'low', label: 'Low', color: 'success' },
        { key: 'medium', label: 'Medium', color: 'warning' },
        { key: 'high', label: 'High', color: 'danger' },
        { key: 'critical', label: 'Critical', color: 'danger' }
    ];

    return (
        <>
            <Head title={title || "Workplace Safety"} />
            
            {/* Create/Edit Modal */}
            <Modal 
                isOpen={modalState.type === 'create' || modalState.type === 'edit'} 
                onOpenChange={closeModal} 
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        {modalState.type === 'edit' 
                            ? `Edit ${activeTab === 'inspections' ? 'Inspection' : 'Incident'}` 
                            : `Report ${activeTab === 'inspections' ? 'Inspection' : 'Incident'}`}
                    </ModalHeader>
                    <ModalBody>
                        <SafetyIncidentForm
                            incident={modalState.incident}
                            employees={employees}
                            locations={locations}
                            mode={activeTab === 'inspections' ? 'inspection' : 'incident'}
                            onSubmit={handleFormSubmit}
                            onCancel={closeModal}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* View Modal */}
            <Modal 
                isOpen={modalState.type === 'view'} 
                onOpenChange={closeModal} 
                size="xl"
            >
                <ModalContent>
                    <ModalHeader>{modalState.incident?.title}</ModalHeader>
                    <ModalBody>
                        {modalState.incident && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Chip 
                                        color={
                                            modalState.incident.severity === 'critical' || modalState.incident.severity === 'high' ? 'danger' :
                                            modalState.incident.severity === 'medium' ? 'warning' : 'success'
                                        }
                                        size="sm"
                                    >
                                        {modalState.incident.severity} Severity
                                    </Chip>
                                    <Chip 
                                        color={
                                            modalState.incident.status === 'resolved' ? 'success' :
                                            modalState.incident.status === 'investigating' ? 'warning' : 'default'
                                        }
                                        size="sm"
                                        variant="flat"
                                    >
                                        {modalState.incident.status}
                                    </Chip>
                                    {modalState.incident.type && (
                                        <Chip variant="flat" size="sm">{modalState.incident.type}</Chip>
                                    )}
                                </div>
                                
                                <p className="text-default-600">{modalState.incident.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-default-500">Location</span>
                                        <p className="font-medium">{modalState.incident.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Date/Time</span>
                                        <p className="font-medium">
                                            {modalState.incident.incident_date 
                                                ? new Date(modalState.incident.incident_date).toLocaleString() 
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Reported By</span>
                                        <p className="font-medium">{modalState.incident.reporter?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Assigned To</span>
                                        <p className="font-medium">{modalState.incident.assignee?.name || 'Unassigned'}</p>
                                    </div>
                                </div>

                                {modalState.incident.injured_employees?.length > 0 && (
                                    <div>
                                        <span className="text-default-500 text-sm">Injured Employees</span>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            {modalState.incident.injured_employees.map((emp, idx) => (
                                                <Chip key={idx} size="sm" color="danger" variant="flat">
                                                    {emp.name}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {modalState.incident.corrective_actions && (
                                    <div>
                                        <span className="text-default-500 text-sm">Corrective Actions</span>
                                        <p className="mt-1">{modalState.incident.corrective_actions}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={closeModal}>Close</Button>
                        {permissions.canResolve && modalState.incident?.status !== 'resolved' && (
                            <Button color="success" onPress={() => handleResolve(modalState.incident)}>
                                Mark as Resolved
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Workplace Safety"
                subtitle="Track safety incidents, inspections, and compliance"
                icon={<ShieldExclamationIcon />}
                isLoading={loading && statsLoading}
                ariaLabel="Safety Management"
                actions={
                    <div className="flex gap-2">
                        <Button 
                            isIconOnly 
                            variant="flat" 
                            onPress={() => { fetchData(); fetchStats(); }}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                        {canCreateIncident && (
                            <Button 
                                color="primary" 
                                variant="shadow" 
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => setModalState({ type: 'create', incident: null })}
                            >
                                {activeTab === 'inspections' ? 'New Inspection' : 'Report Incident'}
                            </Button>
                        )}
                    </div>
                }
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={
                    <div className="space-y-4">
                        <Tabs 
                            selectedKey={activeTab} 
                            onSelectionChange={handleTabChange}
                            variant="underlined"
                            color="primary"
                        >
                            <Tab 
                                key="incidents" 
                                title={
                                    <div className="flex items-center gap-2">
                                        <FireIcon className="w-4 h-4" />
                                        <span>Incidents</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="inspections" 
                                title={
                                    <div className="flex items-center gap-2">
                                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                                        <span>Inspections</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="training" 
                                title={
                                    <div className="flex items-center gap-2">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        <span>Safety Training</span>
                                    </div>
                                }
                            />
                        </Tabs>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input 
                                label="Search" 
                                placeholder="Search..."
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
                            {activeTab === 'incidents' && (
                                <Select 
                                    label="Severity" 
                                    placeholder="All Severities" 
                                    variant="bordered" 
                                    size="sm" 
                                    radius={themeRadius}
                                    selectedKeys={filters.severity ? [filters.severity] : []}
                                    onSelectionChange={(keys) => handleFilterChange('severity', Array.from(keys)[0] || '')}
                                    className="w-full sm:w-40"
                                >
                                    {severityOptions.map(s => (
                                        <SelectItem key={s.key}>{s.label}</SelectItem>
                                    ))}
                                </Select>
                            )}
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
                                <SelectItem key="open">Open</SelectItem>
                                <SelectItem key="investigating">Investigating</SelectItem>
                                <SelectItem key="resolved">Resolved</SelectItem>
                                <SelectItem key="closed">Closed</SelectItem>
                            </Select>
                        </div>
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
                <SafetyIncidentsTable
                    data={data}
                    loading={loading}
                    mode={activeTab}
                    permissions={permissions}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onResolve={handleResolve}
                />
            </StandardPageLayout>
        </>
    );
};

export default SafetyIndex;
