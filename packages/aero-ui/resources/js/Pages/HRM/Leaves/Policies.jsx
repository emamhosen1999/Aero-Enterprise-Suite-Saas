import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Switch, Tabs, Tab, Checkbox } from "@heroui/react";
import { 
    DocumentTextIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    DocumentCheckIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const LeavePolicies = ({ title, departments = [], leaveTypes = [], policies = [] }) => {
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
    const [policyList, setPolicyList] = useState(policies);
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        leave_type_id: 'all',
        status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_policies: 0, 
        active_policies: 0, 
        draft_policies: 0, 
        expired_policies: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false, view: false });
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        leave_type_id: '',
        department_ids: [],
        is_global: true,
        status: 'active',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        
        // Policy rules
        max_days_per_year: '',
        max_consecutive_days: '',
        min_notice_period: '',
        max_advance_booking: '',
        is_transferable: false,
        transfer_percentage: '50',
        is_encashable: false,
        encashment_percentage: '50',
        
        // Eligibility
        min_service_months: '',
        probation_applicable: false,
        gender_specific: 'all',
        
        // Approval workflow
        requires_approval: true,
        approval_levels: 1,
        auto_approve_threshold: '',
        
        // Restrictions
        weekend_applicable: true,
        holiday_applicable: true,
        blackout_periods: [],
        sandwich_leave_policy: 'allowed'
    });

    // Permission checks
    const canCreatePolicies = canCreate('hrm.leaves.policies');
    const canEditPolicies = canUpdate('hrm.leaves.policies');
    const canDeletePolicies = canDelete('hrm.leaves.policies');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Policies", 
            value: stats.total_policies, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Policies", 
            value: stats.active_policies, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Draft Policies", 
            value: stats.draft_policies, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Expired Policies", 
            value: stats.expired_policies, 
            icon: <XCircleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Policy configuration
    const policyStatuses = [
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'draft', label: 'Draft', color: 'warning' },
        { key: 'inactive', label: 'Inactive', color: 'danger' },
        { key: 'expired', label: 'Expired', color: 'default' },
    ];

    const genderOptions = [
        { key: 'all', label: 'All Employees' },
        { key: 'male', label: 'Male Only' },
        { key: 'female', label: 'Female Only' },
    ];

    const sandwichLeaveOptions = [
        { key: 'allowed', label: 'Allowed' },
        { key: 'not_allowed', label: 'Not Allowed' },
        { key: 'auto_deduct', label: 'Auto Deduct Intervening Days' },
    ];

    const getStatusColor = (status) => {
        return policyStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return policyStatuses.find(s => s.key === status)?.label || status;
    };

    // Data fetching
    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.leaves.policies.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setPolicyList(response.data.policies || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch leave policies'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.leaves.policies.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch policy stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicies();
        fetchStats();
    }, [fetchPolicies, fetchStats]);

    // CRUD operations
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedPolicy 
                    ? route('hrm.leaves.policies.update', selectedPolicy.id)
                    : route('hrm.leaves.policies.store');
                
                const response = await axios({
                    method: selectedPolicy ? 'PUT' : 'POST',
                    url,
                    data: formData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Policy ${selectedPolicy ? 'updated' : 'created'} successfully`]);
                    fetchPolicies();
                    fetchStats();
                    closeModal(selectedPolicy ? 'edit' : 'add');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedPolicy ? 'update' : 'create'} policy`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedPolicy ? 'Updating' : 'Creating'} policy...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedPolicy) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.leaves.policies.destroy', selectedPolicy.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Policy deleted successfully']);
                    fetchPolicies();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete policy']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting policy...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, policy = null) => {
        setSelectedPolicy(policy);
        if (policy && (type === 'edit' || type === 'view')) {
            setFormData({
                name: policy.name || '',
                description: policy.description || '',
                leave_type_id: policy.leave_type_id || '',
                department_ids: policy.department_ids || [],
                is_global: policy.is_global || false,
                status: policy.status || 'active',
                effective_from: policy.effective_from || new Date().toISOString().split('T')[0],
                effective_to: policy.effective_to || '',
                
                max_days_per_year: policy.max_days_per_year || '',
                max_consecutive_days: policy.max_consecutive_days || '',
                min_notice_period: policy.min_notice_period || '',
                max_advance_booking: policy.max_advance_booking || '',
                is_transferable: policy.is_transferable || false,
                transfer_percentage: policy.transfer_percentage || '50',
                is_encashable: policy.is_encashable || false,
                encashment_percentage: policy.encashment_percentage || '50',
                
                min_service_months: policy.min_service_months || '',
                probation_applicable: policy.probation_applicable || false,
                gender_specific: policy.gender_specific || 'all',
                
                requires_approval: policy.requires_approval !== false,
                approval_levels: policy.approval_levels || 1,
                auto_approve_threshold: policy.auto_approve_threshold || '',
                
                weekend_applicable: policy.weekend_applicable !== false,
                holiday_applicable: policy.holiday_applicable !== false,
                blackout_periods: policy.blackout_periods || [],
                sandwich_leave_policy: policy.sandwich_leave_policy || 'allowed'
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedPolicy(null);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            leave_type_id: '',
            department_ids: [],
            is_global: true,
            status: 'active',
            effective_from: new Date().toISOString().split('T')[0],
            effective_to: '',
            
            max_days_per_year: '',
            max_consecutive_days: '',
            min_notice_period: '',
            max_advance_booking: '',
            is_transferable: false,
            transfer_percentage: '50',
            is_encashable: false,
            encashment_percentage: '50',
            
            min_service_months: '',
            probation_applicable: false,
            gender_specific: 'all',
            
            requires_approval: true,
            approval_levels: 1,
            auto_approve_threshold: '',
            
            weekend_applicable: true,
            holiday_applicable: true,
            blackout_periods: [],
            sandwich_leave_policy: 'allowed'
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

    // Table columns
    const columns = [
        { uid: 'name', name: 'Policy Name' },
        { uid: 'leave_type', name: 'Leave Type' },
        { uid: 'scope', name: 'Scope' },
        { uid: 'duration', name: 'Duration' },
        { uid: 'effective_period', name: 'Effective Period' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((policy, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-xs text-default-500 truncate max-w-40">
                            {policy.description}
                        </p>
                    </div>
                );
            case 'leave_type':
                return policy.leave_type?.name || 'N/A';
            case 'scope':
                return (
                    <div>
                        {policy.is_global ? (
                            <Chip color="primary" size="sm" variant="flat">Global</Chip>
                        ) : (
                            <Chip color="secondary" size="sm" variant="flat">
                                {policy.departments?.length || 0} Dept(s)
                            </Chip>
                        )}
                    </div>
                );
            case 'duration':
                return (
                    <div className="text-sm">
                        <p><strong>Max:</strong> {policy.max_days_per_year || 'N/A'} days/year</p>
                        <p><strong>Consecutive:</strong> {policy.max_consecutive_days || 'N/A'} days</p>
                    </div>
                );
            case 'effective_period':
                return (
                    <div className="text-sm">
                        <p><strong>From:</strong> {policy.effective_from ? new Date(policy.effective_from).toLocaleDateString() : 'N/A'}</p>
                        {policy.effective_to && (
                            <p><strong>To:</strong> {new Date(policy.effective_to).toLocaleDateString()}</p>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(policy.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(policy.status)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', policy)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditPolicies && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => openModal('edit', policy)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeletePolicies && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => openModal('delete', policy)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return policy[columnKey] || '-';
        }
    }, [canEditPolicies, canDeletePolicies]);

    return (
        <>
            <Head title={title} />
            
            {/* Add/Edit Policy Modal */}
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
                                {selectedPolicy ? 'Edit Leave Policy' : 'Add Leave Policy'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Policy Configuration">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Policy Name"
                                                placeholder="Enter policy name"
                                                value={formData.name}
                                                onValueChange={(value) => handleFormChange('name', value)}
                                                isRequired
                                                radius={themeRadius}
                                            />

                                            <Select
                                                label="Leave Type"
                                                placeholder="Select leave type"
                                                selectedKeys={formData.leave_type_id ? [formData.leave_type_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('leave_type_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={themeRadius}
                                            >
                                                {leaveTypes.map(type => (
                                                    <SelectItem key={type.id}>{type.name}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <Textarea
                                            label="Description"
                                            placeholder="Enter policy description"
                                            value={formData.description}
                                            onValueChange={(value) => handleFormChange('description', value)}
                                            radius={themeRadius}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Status"
                                                selectedKeys={[formData.status]}
                                                onSelectionChange={(keys) => handleFormChange('status', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {policyStatuses.map(status => (
                                                    <SelectItem key={status.key}>{status.label}</SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Gender Specific"
                                                selectedKeys={[formData.gender_specific]}
                                                onSelectionChange={(keys) => handleFormChange('gender_specific', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {genderOptions.map(option => (
                                                    <SelectItem key={option.key}>{option.label}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Effective From"
                                                type="date"
                                                value={formData.effective_from}
                                                onValueChange={(value) => handleFormChange('effective_from', value)}
                                                isRequired
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Effective To (Optional)"
                                                type="date"
                                                value={formData.effective_to}
                                                onValueChange={(value) => handleFormChange('effective_to', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Switch
                                                isSelected={formData.is_global}
                                                onValueChange={(checked) => handleFormChange('is_global', checked)}
                                            >
                                                Apply to all departments (Global Policy)
                                            </Switch>

                                            {!formData.is_global && (
                                                <Select
                                                    label="Departments"
                                                    placeholder="Select departments"
                                                    selectionMode="multiple"
                                                    selectedKeys={formData.department_ids}
                                                    onSelectionChange={(keys) => handleFormChange('department_ids', Array.from(keys))}
                                                    radius={themeRadius}
                                                >
                                                    {departments.map(dept => (
                                                        <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="rules" title="Policy Rules">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Max Days Per Year"
                                                type="number"
                                                placeholder="Enter max days"
                                                value={formData.max_days_per_year}
                                                onValueChange={(value) => handleFormChange('max_days_per_year', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Max Consecutive Days"
                                                type="number"
                                                placeholder="Enter max consecutive days"
                                                value={formData.max_consecutive_days}
                                                onValueChange={(value) => handleFormChange('max_consecutive_days', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Min Notice Period (Days)"
                                                type="number"
                                                placeholder="Enter minimum notice period"
                                                value={formData.min_notice_period}
                                                onValueChange={(value) => handleFormChange('min_notice_period', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Max Advance Booking (Days)"
                                                type="number"
                                                placeholder="Enter max advance booking"
                                                value={formData.max_advance_booking}
                                                onValueChange={(value) => handleFormChange('max_advance_booking', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Switch
                                                    isSelected={formData.is_transferable}
                                                    onValueChange={(checked) => handleFormChange('is_transferable', checked)}
                                                >
                                                    Transferable to Next Year
                                                </Switch>
                                                {formData.is_transferable && (
                                                    <Input
                                                        label="Transfer Percentage"
                                                        type="number"
                                                        value={formData.transfer_percentage}
                                                        onValueChange={(value) => handleFormChange('transfer_percentage', value)}
                                                        className="max-w-32"
                                                        endContent="%"
                                                        radius={themeRadius}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Switch
                                                    isSelected={formData.is_encashable}
                                                    onValueChange={(checked) => handleFormChange('is_encashable', checked)}
                                                >
                                                    Encashable Leave
                                                </Switch>
                                                {formData.is_encashable && (
                                                    <Input
                                                        label="Encashment Percentage"
                                                        type="number"
                                                        value={formData.encashment_percentage}
                                                        onValueChange={(value) => handleFormChange('encashment_percentage', value)}
                                                        className="max-w-32"
                                                        endContent="%"
                                                        radius={themeRadius}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <Select
                                            label="Sandwich Leave Policy"
                                            selectedKeys={[formData.sandwich_leave_policy]}
                                            onSelectionChange={(keys) => handleFormChange('sandwich_leave_policy', Array.from(keys)[0])}
                                            radius={themeRadius}
                                        >
                                            {sandwichLeaveOptions.map(option => (
                                                <SelectItem key={option.key}>{option.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <div className="flex gap-4">
                                            <Switch
                                                isSelected={formData.weekend_applicable}
                                                onValueChange={(checked) => handleFormChange('weekend_applicable', checked)}
                                            >
                                                Applicable on Weekends
                                            </Switch>

                                            <Switch
                                                isSelected={formData.holiday_applicable}
                                                onValueChange={(checked) => handleFormChange('holiday_applicable', checked)}
                                            >
                                                Applicable on Holidays
                                            </Switch>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="eligibility" title="Eligibility">
                                    <div className="space-y-4">
                                        <Input
                                            label="Minimum Service Period (Months)"
                                            type="number"
                                            placeholder="Enter minimum service months"
                                            value={formData.min_service_months}
                                            onValueChange={(value) => handleFormChange('min_service_months', value)}
                                            radius={themeRadius}
                                        />

                                        <Switch
                                            isSelected={formData.probation_applicable}
                                            onValueChange={(checked) => handleFormChange('probation_applicable', checked)}
                                        >
                                            Applicable during Probation Period
                                        </Switch>
                                    </div>
                                </Tab>

                                <Tab key="approval" title="Approval">
                                    <div className="space-y-4">
                                        <Switch
                                            isSelected={formData.requires_approval}
                                            onValueChange={(checked) => handleFormChange('requires_approval', checked)}
                                        >
                                            Requires Manager Approval
                                        </Switch>

                                        {formData.requires_approval && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Approval Levels"
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={formData.approval_levels}
                                                    onValueChange={(value) => handleFormChange('approval_levels', value)}
                                                    radius={themeRadius}
                                                />

                                                <Input
                                                    label="Auto Approve Threshold (Days)"
                                                    type="number"
                                                    placeholder="Auto approve if less than"
                                                    value={formData.auto_approve_threshold}
                                                    onValueChange={(value) => handleFormChange('auto_approve_threshold', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedPolicy ? 'Update Policy' : 'Create Policy'}
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
                            <h2 className="text-lg font-semibold text-danger">Delete Leave Policy</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the policy <strong>"{selectedPolicy?.name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and may affect employee leave balances.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Policy</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Leave Policies Management">
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
                                                        Leave Policies
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Configure and manage leave policies for different types of leave
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreatePolicies && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Policy
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
                                            placeholder="Search policies..."
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
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Leave Types"
                                            selectedKeys={filters.leave_type_id !== 'all' ? [filters.leave_type_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('leave_type_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Leave Types</SelectItem>
                                            {leaveTypes.map(type => (
                                                <SelectItem key={type.id}>{type.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            {policyStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Leave Policies" 
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
                                            items={policyList} 
                                            emptyContent={loading ? "Loading..." : "No policies found"}
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

LeavePolicies.layout = (page) => <App children={page} />;
export default LeavePolicies;