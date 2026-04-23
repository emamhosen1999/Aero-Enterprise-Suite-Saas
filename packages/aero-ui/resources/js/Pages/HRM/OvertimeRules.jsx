import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Tabs, Tab, Switch } from "@heroui/react";
import { 
    ClockIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    CheckCircleIcon,
    XMarkIcon,
    CreditCardIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const OvertimeRules = ({ title, departments = [], employees = [] }) => {
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
    const [rules, setRules] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        rule_type: 'all',
        status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_rules: 0, 
        active_rules: 0, 
        daily_overtime: 0, 
        weekly_overtime: 0,
        fixed_rate_rules: 0,
        percentage_based_rules: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false, view: false });
    const [selectedRule, setSelectedRule] = useState(null);
    const [formData, setFormData] = useState({
        rule_name: '',
        rule_type: 'daily_overtime', // daily_overtime, weekly_overtime, holiday_overtime, weekend_overtime
        department_id: '',
        applies_to: 'department', // department, employee, all
        employee_ids: [],
        
        // Overtime thresholds
        daily_hours_threshold: '8.0',
        weekly_hours_threshold: '40.0',
        monthly_hours_threshold: '160.0',
        
        // Rate calculations
        rate_calculation_method: 'percentage', // percentage, fixed_rate, multiple_rates
        overtime_rate_percentage: '150', // 150% = 1.5x normal rate
        fixed_overtime_rate: '',
        
        // Multiple rate tiers
        rate_tiers: [
            { hours_from: 0, hours_to: 2, rate_percentage: 150 },
            { hours_from: 2, hours_to: 4, rate_percentage: 175 },
            { hours_from: 4, hours_to: null, rate_percentage: 200 }
        ],
        
        // Time-based rules
        applies_on_weekdays: true,
        applies_on_weekends: true,
        applies_on_holidays: true,
        weekend_multiplier: '200', // 2x rate on weekends
        holiday_multiplier: '250', // 2.5x rate on holidays
        
        // Advanced settings
        minimum_overtime_duration: '15', // minutes
        overtime_rounding_rules: 'round_up', // round_up, round_down, round_nearest
        rounding_interval: '15', // round to nearest 15 minutes
        
        // Approval requirements
        requires_pre_approval: false,
        auto_approve_limit: '2.0', // hours
        approval_required_over: '4.0', // hours
        approval_notifications: true,
        
        // Cap limits
        has_daily_cap: false,
        daily_overtime_cap: '4.0', // max 4 hours OT per day
        has_weekly_cap: false,
        weekly_overtime_cap: '20.0', // max 20 hours OT per week
        has_monthly_cap: false,
        monthly_overtime_cap: '80.0', // max 80 hours OT per month
        
        // Exclusions
        exclude_break_time: true,
        exclude_lunch_time: true,
        break_duration_minutes: '15',
        lunch_duration_minutes: '60',
        
        // Documentation requirements
        requires_reason: false,
        requires_manager_comments: false,
        requires_project_code: false,
        
        // Effective period
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        is_active: true,
        priority: 'medium', // high, medium, low
        
        description: '',
        notes: ''
    });

    // Permission checks
    const canCreateRules = canCreate('hrm.attendance.overtime_rules');
    const canEditRules = canUpdate('hrm.attendance.overtime_rules');
    const canDeleteRules = canDelete('hrm.attendance.overtime_rules');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Rules", 
            value: stats.total_rules, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Rules", 
            value: stats.active_rules, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Daily OT Rules", 
            value: stats.daily_overtime, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Weekly OT Rules", 
            value: stats.weekly_overtime, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Rule configuration
    const ruleTypes = [
        { key: 'daily_overtime', label: 'Daily Overtime', description: 'Overtime after daily hour threshold' },
        { key: 'weekly_overtime', label: 'Weekly Overtime', description: 'Overtime after weekly hour threshold' },
        { key: 'holiday_overtime', label: 'Holiday Overtime', description: 'Special rates for holiday work' },
        { key: 'weekend_overtime', label: 'Weekend Overtime', description: 'Special rates for weekend work' },
    ];

    const rateCalculationMethods = [
        { key: 'percentage', label: 'Percentage Based', description: 'Rate as percentage of base salary' },
        { key: 'fixed_rate', label: 'Fixed Rate', description: 'Fixed hourly rate for overtime' },
        { key: 'multiple_rates', label: 'Tiered Rates', description: 'Different rates for different hour ranges' },
    ];

    const roundingRules = [
        { key: 'round_up', label: 'Round Up', description: 'Always round up to next interval' },
        { key: 'round_down', label: 'Round Down', description: 'Always round down to previous interval' },
        { key: 'round_nearest', label: 'Round to Nearest', description: 'Round to nearest interval' },
    ];

    const getRuleTypeColor = (type) => {
        const colors = {
            daily_overtime: 'primary',
            weekly_overtime: 'secondary',
            holiday_overtime: 'success',
            weekend_overtime: 'warning'
        };
        return colors[type] || 'default';
    };

    const getRuleTypeLabel = (type) => {
        return ruleTypes.find(r => r.key === type)?.label || type;
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'success' : 'default';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercentage = (percentage) => {
        return `${percentage}%`;
    };

    // Data fetching
    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.attendance.overtime_rules.paginate'), {
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
            const response = await axios.get(route('hrm.attendance.overtime_rules.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch overtime rule stats:', error);
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
                    ? route('hrm.attendance.overtime_rules.update', selectedRule.id)
                    : route('hrm.attendance.overtime_rules.store');
                
                const response = await axios({
                    method: selectedRule ? 'PUT' : 'POST',
                    url,
                    data: formData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Overtime rule ${selectedRule ? 'updated' : 'created'} successfully`]);
                    fetchRules();
                    fetchStats();
                    closeModal(selectedRule ? 'edit' : 'add');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedRule ? 'update' : 'create'} overtime rule`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedRule ? 'Updating' : 'Creating'} overtime rule...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedRule) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.attendance.overtime_rules.destroy', selectedRule.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Overtime rule deleted successfully']);
                    fetchRules();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete overtime rule']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting overtime rule...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, rule = null) => {
        setSelectedRule(rule);
        if (rule && (type === 'edit' || type === 'view')) {
            setFormData({
                rule_name: rule.rule_name || '',
                rule_type: rule.rule_type || 'daily_overtime',
                department_id: rule.department_id || '',
                applies_to: rule.applies_to || 'department',
                employee_ids: rule.employee_ids || [],
                
                daily_hours_threshold: rule.daily_hours_threshold || '8.0',
                weekly_hours_threshold: rule.weekly_hours_threshold || '40.0',
                monthly_hours_threshold: rule.monthly_hours_threshold || '160.0',
                
                rate_calculation_method: rule.rate_calculation_method || 'percentage',
                overtime_rate_percentage: rule.overtime_rate_percentage || '150',
                fixed_overtime_rate: rule.fixed_overtime_rate || '',
                
                rate_tiers: rule.rate_tiers || [
                    { hours_from: 0, hours_to: 2, rate_percentage: 150 },
                    { hours_from: 2, hours_to: 4, rate_percentage: 175 },
                    { hours_from: 4, hours_to: null, rate_percentage: 200 }
                ],
                
                applies_on_weekdays: rule.applies_on_weekdays !== false,
                applies_on_weekends: rule.applies_on_weekends !== false,
                applies_on_holidays: rule.applies_on_holidays !== false,
                weekend_multiplier: rule.weekend_multiplier || '200',
                holiday_multiplier: rule.holiday_multiplier || '250',
                
                minimum_overtime_duration: rule.minimum_overtime_duration || '15',
                overtime_rounding_rules: rule.overtime_rounding_rules || 'round_up',
                rounding_interval: rule.rounding_interval || '15',
                
                requires_pre_approval: rule.requires_pre_approval === true,
                auto_approve_limit: rule.auto_approve_limit || '2.0',
                approval_required_over: rule.approval_required_over || '4.0',
                approval_notifications: rule.approval_notifications !== false,
                
                has_daily_cap: rule.has_daily_cap === true,
                daily_overtime_cap: rule.daily_overtime_cap || '4.0',
                has_weekly_cap: rule.has_weekly_cap === true,
                weekly_overtime_cap: rule.weekly_overtime_cap || '20.0',
                has_monthly_cap: rule.has_monthly_cap === true,
                monthly_overtime_cap: rule.monthly_overtime_cap || '80.0',
                
                exclude_break_time: rule.exclude_break_time !== false,
                exclude_lunch_time: rule.exclude_lunch_time !== false,
                break_duration_minutes: rule.break_duration_minutes || '15',
                lunch_duration_minutes: rule.lunch_duration_minutes || '60',
                
                requires_reason: rule.requires_reason === true,
                requires_manager_comments: rule.requires_manager_comments === true,
                requires_project_code: rule.requires_project_code === true,
                
                effective_date: rule.effective_date || new Date().toISOString().split('T')[0],
                expiry_date: rule.expiry_date || '',
                is_active: rule.is_active !== false,
                priority: rule.priority || 'medium',
                
                description: rule.description || '',
                notes: rule.notes || ''
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
            rule_name: '',
            rule_type: 'daily_overtime',
            department_id: '',
            applies_to: 'department',
            employee_ids: [],
            
            daily_hours_threshold: '8.0',
            weekly_hours_threshold: '40.0',
            monthly_hours_threshold: '160.0',
            
            rate_calculation_method: 'percentage',
            overtime_rate_percentage: '150',
            fixed_overtime_rate: '',
            
            rate_tiers: [
                { hours_from: 0, hours_to: 2, rate_percentage: 150 },
                { hours_from: 2, hours_to: 4, rate_percentage: 175 },
                { hours_from: 4, hours_to: null, rate_percentage: 200 }
            ],
            
            applies_on_weekdays: true,
            applies_on_weekends: true,
            applies_on_holidays: true,
            weekend_multiplier: '200',
            holiday_multiplier: '250',
            
            minimum_overtime_duration: '15',
            overtime_rounding_rules: 'round_up',
            rounding_interval: '15',
            
            requires_pre_approval: false,
            auto_approve_limit: '2.0',
            approval_required_over: '4.0',
            approval_notifications: true,
            
            has_daily_cap: false,
            daily_overtime_cap: '4.0',
            has_weekly_cap: false,
            weekly_overtime_cap: '20.0',
            has_monthly_cap: false,
            monthly_overtime_cap: '80.0',
            
            exclude_break_time: true,
            exclude_lunch_time: true,
            break_duration_minutes: '15',
            lunch_duration_minutes: '60',
            
            requires_reason: false,
            requires_manager_comments: false,
            requires_project_code: false,
            
            effective_date: new Date().toISOString().split('T')[0],
            expiry_date: '',
            is_active: true,
            priority: 'medium',
            
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

    // Rate tier handlers
    const addRateTier = () => {
        const newTier = {
            hours_from: 0,
            hours_to: null,
            rate_percentage: 150
        };
        setFormData(prev => ({
            ...prev,
            rate_tiers: [...prev.rate_tiers, newTier]
        }));
    };

    const updateRateTier = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            rate_tiers: prev.rate_tiers.map((tier, i) => 
                i === index ? { ...tier, [field]: value } : tier
            )
        }));
    };

    const removeRateTier = (index) => {
        setFormData(prev => ({
            ...prev,
            rate_tiers: prev.rate_tiers.filter((_, i) => i !== index)
        }));
    };

    // Table columns
    const columns = [
        { uid: 'rule_name', name: 'Rule Name' },
        { uid: 'type', name: 'Type' },
        { uid: 'scope', name: 'Scope' },
        { uid: 'thresholds', name: 'Thresholds' },
        { uid: 'rates', name: 'Rates' },
        { uid: 'caps', name: 'Caps' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((rule, columnKey) => {
        switch (columnKey) {
            case 'rule_name':
                return (
                    <div>
                        <p className="font-medium">{rule.rule_name}</p>
                        <p className="text-xs text-default-500">{rule.description}</p>
                    </div>
                );
            case 'type':
                return (
                    <Chip 
                        color={getRuleTypeColor(rule.rule_type)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getRuleTypeLabel(rule.rule_type)}
                    </Chip>
                );
            case 'scope':
                return (
                    <div className="text-sm">
                        {rule.applies_to === 'department' && rule.department ? (
                            <span>{rule.department.name}</span>
                        ) : rule.applies_to === 'employee' ? (
                            <span>{rule.employee_count || 0} employees</span>
                        ) : (
                            <Chip size="sm" color="primary" variant="flat">All Users</Chip>
                        )}
                    </div>
                );
            case 'thresholds':
                return (
                    <div className="text-sm space-y-1">
                        <div>Daily: {rule.daily_hours_threshold}h</div>
                        <div>Weekly: {rule.weekly_hours_threshold}h</div>
                    </div>
                );
            case 'rates':
                return (
                    <div className="text-sm">
                        {rule.rate_calculation_method === 'percentage' && (
                            <Chip size="sm" color="success" variant="flat">
                                {formatPercentage(rule.overtime_rate_percentage)}
                            </Chip>
                        )}
                        {rule.rate_calculation_method === 'fixed_rate' && (
                            <Chip size="sm" color="primary" variant="flat">
                                {formatCurrency(rule.fixed_overtime_rate)}
                            </Chip>
                        )}
                        {rule.rate_calculation_method === 'multiple_rates' && (
                            <Chip size="sm" color="warning" variant="flat">
                                Tiered
                            </Chip>
                        )}
                    </div>
                );
            case 'caps':
                return (
                    <div className="text-sm">
                        {rule.has_daily_cap && (
                            <div>Daily: {rule.daily_overtime_cap}h</div>
                        )}
                        {rule.has_weekly_cap && (
                            <div>Weekly: {rule.weekly_overtime_cap}h</div>
                        )}
                        {!rule.has_daily_cap && !rule.has_weekly_cap && (
                            <span className="text-default-500">No limits</span>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(rule.is_active)} 
                        size="sm" 
                        variant="flat"
                    >
                        {rule.is_active ? 'Active' : 'Inactive'}
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
                                {selectedRule ? 'Edit Overtime Rule' : 'Create Overtime Rule'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Overtime Rule Configuration">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <Input
                                            label="Rule Name"
                                            placeholder="Daily Overtime - Standard Rate"
                                            value={formData.rule_name}
                                            onValueChange={(value) => handleFormChange('rule_name', value)}
                                            isRequired
                                            radius={themeRadius}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Rule Type"
                                                selectedKeys={[formData.rule_type]}
                                                onSelectionChange={(keys) => handleFormChange('rule_type', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {ruleTypes.map(type => (
                                                    <SelectItem key={type.key} description={type.description}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Applies To"
                                                selectedKeys={[formData.applies_to]}
                                                onSelectionChange={(keys) => handleFormChange('applies_to', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                <SelectItem key="all">All Users</SelectItem>
                                                <SelectItem key="department">Specific Department</SelectItem>
                                                <SelectItem key="employee">Specific Employees</SelectItem>
                                            </Select>
                                        </div>

                                        {formData.applies_to === 'department' && (
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

                                        <Textarea
                                            label="Description"
                                            placeholder="Describe when this overtime rule applies and how rates are calculated..."
                                            value={formData.description}
                                            onValueChange={(value) => handleFormChange('description', value)}
                                            radius={themeRadius}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Daily Threshold (hours)"
                                                type="number"
                                                step="0.5"
                                                min="1"
                                                max="24"
                                                value={formData.daily_hours_threshold}
                                                onValueChange={(value) => handleFormChange('daily_hours_threshold', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Weekly Threshold (hours)"
                                                type="number"
                                                step="0.5"
                                                min="1"
                                                max="168"
                                                value={formData.weekly_hours_threshold}
                                                onValueChange={(value) => handleFormChange('weekly_hours_threshold', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Monthly Threshold (hours)"
                                                type="number"
                                                step="0.5"
                                                min="1"
                                                max="744"
                                                value={formData.monthly_hours_threshold}
                                                onValueChange={(value) => handleFormChange('monthly_hours_threshold', value)}
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="rates" title="Rate Calculation">
                                    <div className="space-y-4">
                                        <Select
                                            label="Rate Calculation Method"
                                            selectedKeys={[formData.rate_calculation_method]}
                                            onSelectionChange={(keys) => handleFormChange('rate_calculation_method', Array.from(keys)[0])}
                                            radius={themeRadius}
                                        >
                                            {rateCalculationMethods.map(method => (
                                                <SelectItem key={method.key} description={method.description}>
                                                    {method.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        {formData.rate_calculation_method === 'percentage' && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input
                                                    label="Overtime Rate (%)"
                                                    type="number"
                                                    min="100"
                                                    max="500"
                                                    value={formData.overtime_rate_percentage}
                                                    onValueChange={(value) => handleFormChange('overtime_rate_percentage', value)}
                                                    radius={themeRadius}
                                                    description="150% = 1.5x normal rate"
                                                />

                                                <Input
                                                    label="Weekend Multiplier (%)"
                                                    type="number"
                                                    min="100"
                                                    max="500"
                                                    value={formData.weekend_multiplier}
                                                    onValueChange={(value) => handleFormChange('weekend_multiplier', value)}
                                                    radius={themeRadius}
                                                />

                                                <Input
                                                    label="Holiday Multiplier (%)"
                                                    type="number"
                                                    min="100"
                                                    max="500"
                                                    value={formData.holiday_multiplier}
                                                    onValueChange={(value) => handleFormChange('holiday_multiplier', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>
                                        )}

                                        {formData.rate_calculation_method === 'fixed_rate' && (
                                            <Input
                                                label="Fixed Overtime Rate (per hour)"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.fixed_overtime_rate}
                                                onValueChange={(value) => handleFormChange('fixed_overtime_rate', value)}
                                                radius={themeRadius}
                                                startContent={<CurrencyDollarIcon className="w-4 h-4" />}
                                            />
                                        )}

                                        {formData.rate_calculation_method === 'multiple_rates' && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-semibold">Rate Tiers</h5>
                                                    <Button
                                                        size="sm"
                                                        color="primary"
                                                        onPress={addRateTier}
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                    >
                                                        Add Tier
                                                    </Button>
                                                </div>

                                                {formData.rate_tiers.map((tier, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 border border-divider rounded-lg">
                                                        <Input
                                                            label="From Hours"
                                                            type="number"
                                                            min="0"
                                                            step="0.5"
                                                            value={String(tier.hours_from)}
                                                            onValueChange={(value) => updateRateTier(index, 'hours_from', parseFloat(value) || 0)}
                                                            size="sm"
                                                            radius={themeRadius}
                                                        />
                                                        <Input
                                                            label="To Hours"
                                                            type="number"
                                                            min="0"
                                                            step="0.5"
                                                            value={tier.hours_to ? String(tier.hours_to) : ''}
                                                            onValueChange={(value) => updateRateTier(index, 'hours_to', value ? parseFloat(value) : null)}
                                                            placeholder="No limit"
                                                            size="sm"
                                                            radius={themeRadius}
                                                        />
                                                        <Input
                                                            label="Rate (%)"
                                                            type="number"
                                                            min="100"
                                                            max="500"
                                                            value={String(tier.rate_percentage)}
                                                            onValueChange={(value) => updateRateTier(index, 'rate_percentage', parseFloat(value) || 150)}
                                                            size="sm"
                                                            radius={themeRadius}
                                                        />
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            color="danger"
                                                            variant="light"
                                                            onPress={() => removeRateTier(index)}
                                                            isDisabled={formData.rate_tiers.length <= 1}
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Day Type Applications</h5>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span>Apply on Weekdays</span>
                                                    <Switch
                                                        isSelected={formData.applies_on_weekdays}
                                                        onValueChange={(value) => handleFormChange('applies_on_weekdays', value)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Apply on Weekends</span>
                                                    <Switch
                                                        isSelected={formData.applies_on_weekends}
                                                        onValueChange={(value) => handleFormChange('applies_on_weekends', value)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Apply on Holidays</span>
                                                    <Switch
                                                        isSelected={formData.applies_on_holidays}
                                                        onValueChange={(value) => handleFormChange('applies_on_holidays', value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="caps" title="Caps & Limits">
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Daily Caps</h5>
                                            <div className="flex items-center justify-between">
                                                <span>Enable Daily Overtime Cap</span>
                                                <Switch
                                                    isSelected={formData.has_daily_cap}
                                                    onValueChange={(value) => handleFormChange('has_daily_cap', value)}
                                                />
                                            </div>
                                            {formData.has_daily_cap && (
                                                <Input
                                                    label="Daily Overtime Cap (hours)"
                                                    type="number"
                                                    min="0.5"
                                                    max="16"
                                                    step="0.5"
                                                    value={formData.daily_overtime_cap}
                                                    onValueChange={(value) => handleFormChange('daily_overtime_cap', value)}
                                                    radius={themeRadius}
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Weekly Caps</h5>
                                            <div className="flex items-center justify-between">
                                                <span>Enable Weekly Overtime Cap</span>
                                                <Switch
                                                    isSelected={formData.has_weekly_cap}
                                                    onValueChange={(value) => handleFormChange('has_weekly_cap', value)}
                                                />
                                            </div>
                                            {formData.has_weekly_cap && (
                                                <Input
                                                    label="Weekly Overtime Cap (hours)"
                                                    type="number"
                                                    min="1"
                                                    max="80"
                                                    step="0.5"
                                                    value={formData.weekly_overtime_cap}
                                                    onValueChange={(value) => handleFormChange('weekly_overtime_cap', value)}
                                                    radius={themeRadius}
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Monthly Caps</h5>
                                            <div className="flex items-center justify-between">
                                                <span>Enable Monthly Overtime Cap</span>
                                                <Switch
                                                    isSelected={formData.has_monthly_cap}
                                                    onValueChange={(value) => handleFormChange('has_monthly_cap', value)}
                                                />
                                            </div>
                                            {formData.has_monthly_cap && (
                                                <Input
                                                    label="Monthly Overtime Cap (hours)"
                                                    type="number"
                                                    min="1"
                                                    max="320"
                                                    step="0.5"
                                                    value={formData.monthly_overtime_cap}
                                                    onValueChange={(value) => handleFormChange('monthly_overtime_cap', value)}
                                                    radius={themeRadius}
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Time Calculation</h5>
                                            <Input
                                                label="Minimum Overtime Duration (minutes)"
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={formData.minimum_overtime_duration}
                                                onValueChange={(value) => handleFormChange('minimum_overtime_duration', value)}
                                                radius={themeRadius}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Select
                                                    label="Rounding Rules"
                                                    selectedKeys={[formData.overtime_rounding_rules]}
                                                    onSelectionChange={(keys) => handleFormChange('overtime_rounding_rules', Array.from(keys)[0])}
                                                    radius={themeRadius}
                                                >
                                                    {roundingRules.map(rule => (
                                                        <SelectItem key={rule.key} description={rule.description}>
                                                            {rule.label}
                                                        </SelectItem>
                                                    ))}
                                                </Select>

                                                <Input
                                                    label="Rounding Interval (minutes)"
                                                    type="number"
                                                    min="1"
                                                    max="60"
                                                    value={formData.rounding_interval}
                                                    onValueChange={(value) => handleFormChange('rounding_interval', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span>Exclude Break Time</span>
                                                    <Switch
                                                        isSelected={formData.exclude_break_time}
                                                        onValueChange={(value) => handleFormChange('exclude_break_time', value)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Exclude Lunch Time</span>
                                                    <Switch
                                                        isSelected={formData.exclude_lunch_time}
                                                        onValueChange={(value) => handleFormChange('exclude_lunch_time', value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="approval" title="Approval & Documentation">
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Approval Requirements</h5>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span>Require Pre-approval</span>
                                                    <p className="text-xs text-default-500">Manager approval required before overtime</p>
                                                </div>
                                                <Switch
                                                    isSelected={formData.requires_pre_approval}
                                                    onValueChange={(value) => handleFormChange('requires_pre_approval', value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Auto-approve up to (hours)"
                                                    type="number"
                                                    min="0"
                                                    max="8"
                                                    step="0.5"
                                                    value={formData.auto_approve_limit}
                                                    onValueChange={(value) => handleFormChange('auto_approve_limit', value)}
                                                    radius={themeRadius}
                                                />

                                                <Input
                                                    label="Approval required over (hours)"
                                                    type="number"
                                                    min="1"
                                                    max="12"
                                                    step="0.5"
                                                    value={formData.approval_required_over}
                                                    onValueChange={(value) => handleFormChange('approval_required_over', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Send Approval Notifications</span>
                                                <Switch
                                                    isSelected={formData.approval_notifications}
                                                    onValueChange={(value) => handleFormChange('approval_notifications', value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Documentation Requirements</h5>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span>Require Reason for Overtime</span>
                                                    <Switch
                                                        isSelected={formData.requires_reason}
                                                        onValueChange={(value) => handleFormChange('requires_reason', value)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Require Manager Comments</span>
                                                    <Switch
                                                        isSelected={formData.requires_manager_comments}
                                                        onValueChange={(value) => handleFormChange('requires_manager_comments', value)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Require Project/Cost Code</span>
                                                    <Switch
                                                        isSelected={formData.requires_project_code}
                                                        onValueChange={(value) => handleFormChange('requires_project_code', value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-semibold">Effective Period</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Effective Date"
                                                    type="date"
                                                    value={formData.effective_date}
                                                    onValueChange={(value) => handleFormChange('effective_date', value)}
                                                    radius={themeRadius}
                                                />

                                                <Input
                                                    label="Expiry Date (Optional)"
                                                    type="date"
                                                    value={formData.expiry_date}
                                                    onValueChange={(value) => handleFormChange('expiry_date', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>

                                            <Select
                                                label="Priority Level"
                                                selectedKeys={[formData.priority]}
                                                onSelectionChange={(keys) => handleFormChange('priority', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                <SelectItem key="high">High Priority</SelectItem>
                                                <SelectItem key="medium">Medium Priority</SelectItem>
                                                <SelectItem key="low">Low Priority</SelectItem>
                                            </Select>

                                            <Textarea
                                                label="Additional Notes"
                                                placeholder="Any additional implementation notes or special considerations..."
                                                value={formData.notes}
                                                onValueChange={(value) => handleFormChange('notes', value)}
                                                radius={themeRadius}
                                            />
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
                            <p>Are you sure you want to delete the overtime rule <strong>"{selectedRule?.rule_name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will affect payroll calculations.</p>
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
                                                    <ClockIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Overtime Rules
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Configure overtime calculation rules, rates, and limits
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
                                                        Create Rule
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
                                            placeholder="Search overtime rules..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Types"
                                            selectedKeys={filters.rule_type !== 'all' ? [filters.rule_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('rule_type', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            {ruleTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>

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
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="inactive">Inactive</SelectItem>
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
                                            emptyContent={loading ? "Loading..." : "No overtime rules found"}
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