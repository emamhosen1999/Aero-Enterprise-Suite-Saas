import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Switch, Tabs, Tab } from "@heroui/react";
import { 
    ChartBarIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    DocumentCheckIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const OvertimeRules = ({ title, departments = [], overtimeRules = [], employees = [] }) => {
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
    const [rules, setRules] = useState(overtimeRules);
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        overtime_type: 'all',
        status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_rules: 0, 
        active_rules: 0, 
        total_overtime_hours: 0, 
        total_overtime_cost: 0,
        avg_multiplier: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false, view: false });
    const [selectedRule, setSelectedRule] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        department_ids: [],
        is_global: true,
        status: 'active',
        
        // Overtime calculation
        overtime_type: 'daily', // daily, weekly, monthly
        threshold_hours: '8', // Hours before overtime kicks in
        calculation_method: 'exceeding', // exceeding, cumulative
        multiplier_rate: '1.5',
        
        // Advanced settings
        max_overtime_hours_day: '',
        max_overtime_hours_week: '',
        max_overtime_hours_month: '',
        weekend_multiplier: '2.0',
        holiday_multiplier: '2.5',
        night_shift_multiplier: '1.25',
        
        // Time constraints
        night_shift_start: '22:00',
        night_shift_end: '06:00',
        requires_approval: true,
        auto_approval_threshold: '',
        
        // Eligibility
        eligible_employee_types: ['full_time'], // full_time, part_time, contract
        min_service_months: '',
        exclude_probation: true,
        
        // Restrictions
        consecutive_overtime_limit: '3',
        mandatory_rest_hours: '12',
        blackout_periods: [],
        exception_users: []
    });

    // Permission checks
    const canCreateRules = canCreate('hrm.overtime.rules');
    const canEditRules = canUpdate('hrm.overtime.rules');
    const canDeleteRules = canDelete('hrm.overtime.rules');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Active Rules", 
            value: stats.active_rules, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Total OT Hours", 
            value: `${stats.total_overtime_hours}h`, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "OT Cost", 
            value: `$${stats.total_overtime_cost?.toLocaleString() || 0}`, 
            icon: <BanknotesIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Avg Multiplier", 
            value: `${stats.avg_multiplier}x`, 
            icon: <TrendingUpIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Rule configuration
    const overtimeTypes = [
        { key: 'daily', label: 'Daily Overtime', description: 'Based on daily work hours' },
        { key: 'weekly', label: 'Weekly Overtime', description: 'Based on weekly cumulative hours' },
        { key: 'monthly', label: 'Monthly Overtime', description: 'Based on monthly cumulative hours' },
        { key: 'project', label: 'Project-based', description: 'Based on project requirements' },
    ];

    const calculationMethods = [
        { key: 'exceeding', label: 'Exceeding Threshold', description: 'Only hours exceeding threshold' },
        { key: 'cumulative', label: 'Cumulative', description: 'All hours when threshold exceeded' },
    ];

    const employeeTypes = [
        { key: 'full_time', label: 'Full-time Employees' },
        { key: 'part_time', label: 'Part-time Employees' },
        { key: 'contract', label: 'Contract Workers' },
        { key: 'intern', label: 'Interns' },
    ];

    const ruleStatuses = [
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'inactive', label: 'Inactive', color: 'danger' },
        { key: 'suspended', label: 'Suspended', color: 'warning' },
    ];

    const getStatusColor = (status) => {
        return ruleStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return ruleStatuses.find(s => s.key === status)?.label || status;
    };

    const getOvertimeTypeLabel = (type) => {
        return overtimeTypes.find(t => t.key === type)?.label || type;
    };

    // Data fetching
    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.overtime.rules.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setRules(response.data.rules || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch overtime rules'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.overtime.rules.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch overtime stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
        fetchStats();
    }, [fetchRules, fetchStats]);

    // CRUD operations
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedRule 
                    ? route('hrm.overtime.rules.update', selectedRule.id)
                    : route('hrm.overtime.rules.store');
                
                const response = await axios({
                    method: selectedRule ? 'PUT' : 'POST',
                    url,
                    data: formData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Rule ${selectedRule ? 'updated' : 'created'} successfully`]);
                    fetchRules();
                    fetchStats();
                    closeModal(selectedRule ? 'edit' : 'add');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedRule ? 'update' : 'create'} rule`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedRule ? 'Updating' : 'Creating'} rule...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedRule) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.overtime.rules.destroy', selectedRule.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Rule deleted successfully']);
                    fetchRules();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete rule']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting rule...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, rule = null) => {
        setSelectedRule(rule);
        if (rule && (type === 'edit' || type === 'view')) {
            setFormData({
                name: rule.name || '',
                description: rule.description || '',
                department_ids: rule.department_ids || [],
                is_global: rule.is_global || false,
                status: rule.status || 'active',
                
                overtime_type: rule.overtime_type || 'daily',
                threshold_hours: rule.threshold_hours || '8',
                calculation_method: rule.calculation_method || 'exceeding',
                multiplier_rate: rule.multiplier_rate || '1.5',
                
                max_overtime_hours_day: rule.max_overtime_hours_day || '',
                max_overtime_hours_week: rule.max_overtime_hours_week || '',
                max_overtime_hours_month: rule.max_overtime_hours_month || '',
                weekend_multiplier: rule.weekend_multiplier || '2.0',
                holiday_multiplier: rule.holiday_multiplier || '2.5',
                night_shift_multiplier: rule.night_shift_multiplier || '1.25',
                
                night_shift_start: rule.night_shift_start || '22:00',
                night_shift_end: rule.night_shift_end || '06:00',
                requires_approval: rule.requires_approval !== false,
                auto_approval_threshold: rule.auto_approval_threshold || '',
                
                eligible_employee_types: rule.eligible_employee_types || ['full_time'],
                min_service_months: rule.min_service_months || '',
                exclude_probation: rule.exclude_probation !== false,
                
                consecutive_overtime_limit: rule.consecutive_overtime_limit || '3',
                mandatory_rest_hours: rule.mandatory_rest_hours || '12',
                blackout_periods: rule.blackout_periods || [],
                exception_users: rule.exception_users || []
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedRule(null);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            department_ids: [],
            is_global: true,
            status: 'active',
            
            overtime_type: 'daily',
            threshold_hours: '8',
            calculation_method: 'exceeding',
            multiplier_rate: '1.5',
            
            max_overtime_hours_day: '',
            max_overtime_hours_week: '',
            max_overtime_hours_month: '',
            weekend_multiplier: '2.0',
            holiday_multiplier: '2.5',
            night_shift_multiplier: '1.25',
            
            night_shift_start: '22:00',
            night_shift_end: '06:00',
            requires_approval: true,
            auto_approval_threshold: '',
            
            eligible_employee_types: ['full_time'],
            min_service_months: '',
            exclude_probation: true,
            
            consecutive_overtime_limit: '3',
            mandatory_rest_hours: '12',
            blackout_periods: [],
            exception_users: []
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
        { uid: 'name', name: 'Rule Name' },
        { uid: 'overtime_type', name: 'Type' },
        { uid: 'threshold', name: 'Threshold' },
        { uid: 'multiplier', name: 'Multiplier' },
        { uid: 'scope', name: 'Scope' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((rule, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-default-500 truncate max-w-40">
                            {rule.description}
                        </p>
                    </div>
                );
            case 'overtime_type':
                return (
                    <Chip color="primary" size="sm" variant="flat">
                        {getOvertimeTypeLabel(rule.overtime_type)}
                    </Chip>
                );
            case 'threshold':
                return (
                    <div className="text-sm">
                        <p><strong>{rule.threshold_hours}h</strong> {rule.overtime_type}</p>
                        <p className="text-xs text-default-500">{rule.calculation_method}</p>
                    </div>
                );
            case 'multiplier':
                return (
                    <div className="text-sm">
                        <p className="font-semibold text-primary">{rule.multiplier_rate}x</p>
                        <div className="flex gap-1 text-xs">
                            {rule.weekend_multiplier && rule.weekend_multiplier !== '1.0' && (
                                <span className="text-warning">W:{rule.weekend_multiplier}x</span>
                            )}
                            {rule.holiday_multiplier && rule.holiday_multiplier !== '1.0' && (
                                <span className="text-danger">H:{rule.holiday_multiplier}x</span>
                            )}
                        </div>
                    </div>
                );
            case 'scope':
                return (
                    <div>
                        {rule.is_global ? (
                            <Chip color="primary" size="sm" variant="flat">Global</Chip>
                        ) : (
                            <Chip color="secondary" size="sm" variant="flat">
                                {rule.departments?.length || 0} Dept(s)
                            </Chip>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(rule.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(rule.status)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', rule)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditRules && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => openModal('edit', rule)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteRules && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => openModal('delete', rule)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return rule[columnKey] || '-';
        }
    }, [canEditRules, canDeleteRules]);

    return (
        <>
            <Head title={title} />
            
            {/* Add/Edit Rule Modal */}
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
                                {selectedRule ? 'Edit Overtime Rule' : 'Add Overtime Rule'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Rule Configuration">
                                <Tab key="basic" title="Basic Settings">
                                    <div className="space-y-4">
                                        <Input
                                            label="Rule Name"
                                            placeholder="Enter rule name"
                                            value={formData.name}
                                            onValueChange={(value) => handleFormChange('name', value)}
                                            isRequired
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Description"
                                            placeholder="Enter rule description"
                                            value={formData.description}
                                            onValueChange={(value) => handleFormChange('description', value)}
                                            radius={themeRadius}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Overtime Type"
                                                selectedKeys={[formData.overtime_type]}
                                                onSelectionChange={(keys) => handleFormChange('overtime_type', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {overtimeTypes.map(type => (
                                                    <SelectItem key={type.key}>{type.label}</SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Status"
                                                selectedKeys={[formData.status]}
                                                onSelectionChange={(keys) => handleFormChange('status', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {ruleStatuses.map(status => (
                                                    <SelectItem key={status.key}>{status.label}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Switch
                                                isSelected={formData.is_global}
                                                onValueChange={(checked) => handleFormChange('is_global', checked)}
                                            >
                                                Apply to all departments (Global Rule)
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

                                <Tab key="calculation" title="Calculation Rules">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Threshold Hours"
                                                type="number"
                                                step="0.5"
                                                placeholder="8"
                                                value={formData.threshold_hours}
                                                onValueChange={(value) => handleFormChange('threshold_hours', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Multiplier Rate"
                                                type="number"
                                                step="0.25"
                                                placeholder="1.5"
                                                value={formData.multiplier_rate}
                                                onValueChange={(value) => handleFormChange('multiplier_rate', value)}
                                                endContent="x"
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <Select
                                            label="Calculation Method"
                                            selectedKeys={[formData.calculation_method]}
                                            onSelectionChange={(keys) => handleFormChange('calculation_method', Array.from(keys)[0])}
                                            radius={themeRadius}
                                        >
                                            {calculationMethods.map(method => (
                                                <SelectItem key={method.key}>{method.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Weekend Multiplier"
                                                type="number"
                                                step="0.25"
                                                value={formData.weekend_multiplier}
                                                onValueChange={(value) => handleFormChange('weekend_multiplier', value)}
                                                endContent="x"
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Holiday Multiplier"
                                                type="number"
                                                step="0.25"
                                                value={formData.holiday_multiplier}
                                                onValueChange={(value) => handleFormChange('holiday_multiplier', value)}
                                                endContent="x"
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Night Shift Multiplier"
                                                type="number"
                                                step="0.25"
                                                value={formData.night_shift_multiplier}
                                                onValueChange={(value) => handleFormChange('night_shift_multiplier', value)}
                                                endContent="x"
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Night Shift Start Time"
                                                type="time"
                                                value={formData.night_shift_start}
                                                onValueChange={(value) => handleFormChange('night_shift_start', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Night Shift End Time"
                                                type="time"
                                                value={formData.night_shift_end}
                                                onValueChange={(value) => handleFormChange('night_shift_end', value)}
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="limits" title="Limits & Restrictions">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Max OT Hours/Day"
                                                type="number"
                                                placeholder="No limit"
                                                value={formData.max_overtime_hours_day}
                                                onValueChange={(value) => handleFormChange('max_overtime_hours_day', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Max OT Hours/Week"
                                                type="number"
                                                placeholder="No limit"
                                                value={formData.max_overtime_hours_week}
                                                onValueChange={(value) => handleFormChange('max_overtime_hours_week', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Max OT Hours/Month"
                                                type="number"
                                                placeholder="No limit"
                                                value={formData.max_overtime_hours_month}
                                                onValueChange={(value) => handleFormChange('max_overtime_hours_month', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Consecutive OT Days Limit"
                                                type="number"
                                                value={formData.consecutive_overtime_limit}
                                                onValueChange={(value) => handleFormChange('consecutive_overtime_limit', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Mandatory Rest Hours"
                                                type="number"
                                                value={formData.mandatory_rest_hours}
                                                onValueChange={(value) => handleFormChange('mandatory_rest_hours', value)}
                                                endContent="hrs"
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="approval" title="Approval & Eligibility">
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <Switch
                                                isSelected={formData.requires_approval}
                                                onValueChange={(checked) => handleFormChange('requires_approval', checked)}
                                            >
                                                Requires Manager Approval
                                            </Switch>

                                            {formData.requires_approval && (
                                                <Input
                                                    label="Auto Approve Threshold (Hours)"
                                                    type="number"
                                                    placeholder="Auto approve if less than"
                                                    value={formData.auto_approval_threshold}
                                                    onValueChange={(value) => handleFormChange('auto_approval_threshold', value)}
                                                    radius={themeRadius}
                                                />
                                            )}
                                        </div>

                                        <Select
                                            label="Eligible Employee Types"
                                            placeholder="Select employee types"
                                            selectionMode="multiple"
                                            selectedKeys={formData.eligible_employee_types}
                                            onSelectionChange={(keys) => handleFormChange('eligible_employee_types', Array.from(keys))}
                                            radius={themeRadius}
                                        >
                                            {employeeTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Min Service Period (Months)"
                                                type="number"
                                                placeholder="No minimum"
                                                value={formData.min_service_months}
                                                onValueChange={(value) => handleFormChange('min_service_months', value)}
                                                radius={themeRadius}
                                            />

                                            <div className="flex items-center">
                                                <Switch
                                                    isSelected={formData.exclude_probation}
                                                    onValueChange={(checked) => handleFormChange('exclude_probation', checked)}
                                                >
                                                    Exclude Probation Employees
                                                </Switch>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedRule ? 'Update Rule' : 'Create Rule'}
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
                            <h2 className="text-lg font-semibold text-danger">Delete Overtime Rule</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the rule <strong>"{selectedRule?.name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and may affect overtime calculations.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Rule</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Overtime Rules Management">
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
                                                    <ChartBarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Overtime Rules
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Configure overtime calculation rules and policies
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateRules && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Rule
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
                                            placeholder="Search rules..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Types"
                                            selectedKeys={filters.overtime_type !== 'all' ? [filters.overtime_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('overtime_type', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            {overtimeTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>

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
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            {ruleStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Overtime Rules" 
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
                                            items={rules} 
                                            emptyContent={loading ? "Loading..." : "No rules found"}
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

OvertimeRules.layout = (page) => <App children={page} />;
export default OvertimeRules;