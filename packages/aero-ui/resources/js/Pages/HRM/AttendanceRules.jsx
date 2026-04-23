import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar, Tabs, Tab, Switch } from "@heroui/react";
import { 
    ClockIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    MapPinIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const AttendanceRules = ({ title, departments = [], employees = [] }) => {
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
    const [activeTab, setActiveTab] = useState('device_restrictions');
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
        device_restrictions: 0, 
        location_restrictions: 0,
        ip_restrictions: 0,
        violations_today: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false, view: false });
    const [selectedRule, setSelectedRule] = useState(null);
    const [formData, setFormData] = useState({
        rule_name: '',
        rule_type: 'device_restriction', // device_restriction, ip_restriction, location_restriction
        department_id: '',
        applies_to: 'department', // department, employee, all
        employee_ids: [],
        
        // Device restrictions
        allowed_device_types: [],
        max_devices_per_user: '3',
        require_device_registration: true,
        allow_mobile_devices: true,
        allow_desktop_devices: true,
        allow_tablet_devices: true,
        
        // IP restrictions
        allowed_ip_addresses: '',
        blocked_ip_addresses: '',
        ip_whitelist_mode: true, // true = whitelist, false = blacklist
        allow_vpn_connections: false,
        
        // Location restrictions
        allowed_locations: '',
        geo_fencing_enabled: false,
        geo_fence_radius: '100', // meters
        gps_accuracy_required: '50', // meters
        allow_location_spoofing_detection: true,
        
        // Time-based restrictions
        time_restrictions_enabled: false,
        allowed_time_slots: [],
        timezone: 'UTC',
        
        // Violation handling
        violation_action: 'log', // log, block, alert
        max_violations_per_day: '5',
        violation_cooldown_minutes: '15',
        send_violation_alerts: true,
        alert_recipients: '',
        
        // Advanced settings
        is_active: true,
        priority: 'medium', // high, medium, low
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        description: '',
        notes: ''
    });

    // Permission checks
    const canCreateRules = canCreate('hrm.attendance.rules');
    const canEditRules = canUpdate('hrm.attendance.rules');
    const canDeleteRules = canDelete('hrm.attendance.rules');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Rules", 
            value: stats.total_rules, 
            icon: <ShieldCheckIcon className="w-6 h-6" />, 
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
            title: "Device Rules", 
            value: stats.device_restrictions, 
            icon: <DevicePhoneMobileIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Violations Today", 
            value: stats.violations_today, 
            icon: <ExclamationTriangleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Rule configuration
    const ruleTypes = [
        { key: 'device_restriction', label: 'Device Restrictions', description: 'Control which devices can be used for attendance' },
        { key: 'ip_restriction', label: 'IP Address Restrictions', description: 'Restrict attendance to specific IP addresses' },
        { key: 'location_restriction', label: 'Location & Geo-fencing', description: 'GPS location and geo-fence based restrictions' },
        { key: 'time_restriction', label: 'Time-based Rules', description: 'Restrict attendance to specific time slots' },
    ];

    const deviceTypes = [
        { key: 'mobile', label: 'Mobile Devices' },
        { key: 'desktop', label: 'Desktop Computers' },
        { key: 'tablet', label: 'Tablets' },
        { key: 'biometric', label: 'Biometric Devices' },
    ];

    const violationActions = [
        { key: 'log', label: 'Log Only', description: 'Record violation but allow attendance' },
        { key: 'block', label: 'Block Attendance', description: 'Prevent attendance submission' },
        { key: 'alert', label: 'Alert & Allow', description: 'Send alert but allow attendance' },
        { key: 'escalate', label: 'Escalate to Manager', description: 'Notify manager and allow with approval' },
    ];

    const getRuleTypeColor = (type) => {
        const colors = {
            device_restriction: 'primary',
            ip_restriction: 'secondary',
            location_restriction: 'success',
            time_restriction: 'warning'
        };
        return colors[type] || 'default';
    };

    const getRuleTypeLabel = (type) => {
        return ruleTypes.find(r => r.key === type)?.label || type;
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'success' : 'default';
    };

    const getViolationActionColor = (action) => {
        const colors = {
            log: 'primary',
            block: 'danger',
            alert: 'warning',
            escalate: 'secondary'
        };
        return colors[action] || 'default';
    };

    // Data fetching
    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.attendance.rules.paginate'), {
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
                error: 'Failed to fetch attendance rules'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.attendance.rules.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendance rule stats:', error);
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
                    ? route('hrm.attendance.rules.update', selectedRule.id)
                    : route('hrm.attendance.rules.store');
                
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
            loading: `${selectedRule ? 'Updating' : 'Creating'} attendance rule...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedRule) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.attendance.rules.destroy', selectedRule.id));
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
            loading: 'Deleting attendance rule...',
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
                rule_type: rule.rule_type || 'device_restriction',
                department_id: rule.department_id || '',
                applies_to: rule.applies_to || 'department',
                employee_ids: rule.employee_ids || [],
                
                allowed_device_types: rule.allowed_device_types || [],
                max_devices_per_user: rule.max_devices_per_user || '3',
                require_device_registration: rule.require_device_registration !== false,
                allow_mobile_devices: rule.allow_mobile_devices !== false,
                allow_desktop_devices: rule.allow_desktop_devices !== false,
                allow_tablet_devices: rule.allow_tablet_devices !== false,
                
                allowed_ip_addresses: rule.allowed_ip_addresses || '',
                blocked_ip_addresses: rule.blocked_ip_addresses || '',
                ip_whitelist_mode: rule.ip_whitelist_mode !== false,
                allow_vpn_connections: rule.allow_vpn_connections === true,
                
                allowed_locations: rule.allowed_locations || '',
                geo_fencing_enabled: rule.geo_fencing_enabled === true,
                geo_fence_radius: rule.geo_fence_radius || '100',
                gps_accuracy_required: rule.gps_accuracy_required || '50',
                allow_location_spoofing_detection: rule.allow_location_spoofing_detection !== false,
                
                time_restrictions_enabled: rule.time_restrictions_enabled === true,
                allowed_time_slots: rule.allowed_time_slots || [],
                timezone: rule.timezone || 'UTC',
                
                violation_action: rule.violation_action || 'log',
                max_violations_per_day: rule.max_violations_per_day || '5',
                violation_cooldown_minutes: rule.violation_cooldown_minutes || '15',
                send_violation_alerts: rule.send_violation_alerts !== false,
                alert_recipients: rule.alert_recipients || '',
                
                is_active: rule.is_active !== false,
                priority: rule.priority || 'medium',
                effective_date: rule.effective_date || new Date().toISOString().split('T')[0],
                expiry_date: rule.expiry_date || '',
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
            rule_type: 'device_restriction',
            department_id: '',
            applies_to: 'department',
            employee_ids: [],
            
            allowed_device_types: [],
            max_devices_per_user: '3',
            require_device_registration: true,
            allow_mobile_devices: true,
            allow_desktop_devices: true,
            allow_tablet_devices: true,
            
            allowed_ip_addresses: '',
            blocked_ip_addresses: '',
            ip_whitelist_mode: true,
            allow_vpn_connections: false,
            
            allowed_locations: '',
            geo_fencing_enabled: false,
            geo_fence_radius: '100',
            gps_accuracy_required: '50',
            allow_location_spoofing_detection: true,
            
            time_restrictions_enabled: false,
            allowed_time_slots: [],
            timezone: 'UTC',
            
            violation_action: 'log',
            max_violations_per_day: '5',
            violation_cooldown_minutes: '15',
            send_violation_alerts: true,
            alert_recipients: '',
            
            is_active: true,
            priority: 'medium',
            effective_date: new Date().toISOString().split('T')[0],
            expiry_date: '',
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

    // Table columns
    const columns = [
        { uid: 'rule_name', name: 'Rule Name' },
        { uid: 'type', name: 'Type' },
        { uid: 'scope', name: 'Scope' },
        { uid: 'restrictions', name: 'Restrictions' },
        { uid: 'violations', name: 'Violations' },
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
                        {rule.applies_to === 'department' && (
                            <div className="flex items-center gap-1">
                                <BuildingOfficeIcon className="w-4 h-4" />
                                <span>{rule.department?.name || 'All Departments'}</span>
                            </div>
                        )}
                        {rule.applies_to === 'employee' && (
                            <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                <span>{rule.employee_count || 0} employees</span>
                            </div>
                        )}
                        {rule.applies_to === 'all' && (
                            <Chip size="sm" color="primary" variant="flat">All Users</Chip>
                        )}
                    </div>
                );
            case 'restrictions':
                return (
                    <div className="flex flex-wrap gap-1">
                        {rule.rule_type === 'device_restriction' && (
                            <Chip size="sm" variant="flat" color="primary">
                                Max {rule.max_devices_per_user} devices
                            </Chip>
                        )}
                        {rule.rule_type === 'ip_restriction' && (
                            <Chip size="sm" variant="flat" color="secondary">
                                IP {rule.ip_whitelist_mode ? 'Whitelist' : 'Blacklist'}
                            </Chip>
                        )}
                        {rule.rule_type === 'location_restriction' && rule.geo_fencing_enabled && (
                            <Chip size="sm" variant="flat" color="success">
                                Geo-fence {rule.geo_fence_radius}m
                            </Chip>
                        )}
                    </div>
                );
            case 'violations':
                return (
                    <div className="text-sm">
                        <Chip 
                            size="sm" 
                            color={getViolationActionColor(rule.violation_action)} 
                            variant="flat"
                        >
                            {rule.violation_action?.charAt(0).toUpperCase() + rule.violation_action?.slice(1)}
                        </Chip>
                        <p className="text-xs text-default-500 mt-1">
                            Max: {rule.max_violations_per_day}/day
                        </p>
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
                                {selectedRule ? 'Edit Attendance Rule' : 'Create Attendance Rule'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Attendance Rule Configuration">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <Input
                                            label="Rule Name"
                                            placeholder="Office Location Access Rule"
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
                                            placeholder="Describe what this rule does and when it applies..."
                                            value={formData.description}
                                            onValueChange={(value) => handleFormChange('description', value)}
                                            radius={themeRadius}
                                        />

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
                                    </div>
                                </Tab>

                                <Tab key="restrictions" title={getRuleTypeLabel(formData.rule_type)}>
                                    <div className="space-y-4">
                                        {formData.rule_type === 'device_restriction' && (
                                            <>
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold">Device Type Restrictions</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span>Allow Mobile Devices</span>
                                                            <Switch
                                                                isSelected={formData.allow_mobile_devices}
                                                                onValueChange={(value) => handleFormChange('allow_mobile_devices', value)}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Allow Desktop Computers</span>
                                                            <Switch
                                                                isSelected={formData.allow_desktop_devices}
                                                                onValueChange={(value) => handleFormChange('allow_desktop_devices', value)}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Allow Tablets</span>
                                                            <Switch
                                                                isSelected={formData.allow_tablet_devices}
                                                                onValueChange={(value) => handleFormChange('allow_tablet_devices', value)}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Require Device Registration</span>
                                                            <Switch
                                                                isSelected={formData.require_device_registration}
                                                                onValueChange={(value) => handleFormChange('require_device_registration', value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <Input
                                                    label="Maximum Devices Per User"
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={formData.max_devices_per_user}
                                                    onValueChange={(value) => handleFormChange('max_devices_per_user', value)}
                                                    radius={themeRadius}
                                                />
                                            </>
                                        )}

                                        {formData.rule_type === 'ip_restriction' && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span>IP Whitelist Mode</span>
                                                    <Switch
                                                        isSelected={formData.ip_whitelist_mode}
                                                        onValueChange={(value) => handleFormChange('ip_whitelist_mode', value)}
                                                    />
                                                </div>

                                                <Textarea
                                                    label="Allowed IP Addresses"
                                                    placeholder="192.168.1.0/24&#10;10.0.0.0/8&#10;172.16.0.1"
                                                    value={formData.allowed_ip_addresses}
                                                    onValueChange={(value) => handleFormChange('allowed_ip_addresses', value)}
                                                    radius={themeRadius}
                                                    description="One IP address or CIDR range per line"
                                                />

                                                <Textarea
                                                    label="Blocked IP Addresses"
                                                    placeholder="List IP addresses to block..."
                                                    value={formData.blocked_ip_addresses}
                                                    onValueChange={(value) => handleFormChange('blocked_ip_addresses', value)}
                                                    radius={themeRadius}
                                                />

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span>Allow VPN Connections</span>
                                                        <p className="text-xs text-default-500">Allow attendance from VPN connections</p>
                                                    </div>
                                                    <Switch
                                                        isSelected={formData.allow_vpn_connections}
                                                        onValueChange={(value) => handleFormChange('allow_vpn_connections', value)}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {formData.rule_type === 'location_restriction' && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span>Enable Geo-fencing</span>
                                                        <p className="text-xs text-default-500">Restrict attendance to specific geographic areas</p>
                                                    </div>
                                                    <Switch
                                                        isSelected={formData.geo_fencing_enabled}
                                                        onValueChange={(value) => handleFormChange('geo_fencing_enabled', value)}
                                                    />
                                                </div>

                                                {formData.geo_fencing_enabled && (
                                                    <>
                                                        <Textarea
                                                            label="Allowed Locations"
                                                            placeholder="Office Location 1: 40.7128, -74.0060&#10;Office Location 2: 34.0522, -118.2437"
                                                            value={formData.allowed_locations}
                                                            onValueChange={(value) => handleFormChange('allowed_locations', value)}
                                                            radius={themeRadius}
                                                            description="Format: Name: latitude, longitude (one per line)"
                                                        />

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <Input
                                                                label="Geo-fence Radius (meters)"
                                                                type="number"
                                                                min="10"
                                                                max="1000"
                                                                value={formData.geo_fence_radius}
                                                                onValueChange={(value) => handleFormChange('geo_fence_radius', value)}
                                                                radius={themeRadius}
                                                            />

                                                            <Input
                                                                label="GPS Accuracy Required (meters)"
                                                                type="number"
                                                                min="1"
                                                                max="100"
                                                                value={formData.gps_accuracy_required}
                                                                onValueChange={(value) => handleFormChange('gps_accuracy_required', value)}
                                                                radius={themeRadius}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span>GPS Spoofing Detection</span>
                                                                <p className="text-xs text-default-500">Detect and block fake GPS locations</p>
                                                            </div>
                                                            <Switch
                                                                isSelected={formData.allow_location_spoofing_detection}
                                                                onValueChange={(value) => handleFormChange('allow_location_spoofing_detection', value)}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Tab>

                                <Tab key="violations" title="Violation Handling">
                                    <div className="space-y-4">
                                        <Select
                                            label="Violation Action"
                                            selectedKeys={[formData.violation_action]}
                                            onSelectionChange={(keys) => handleFormChange('violation_action', Array.from(keys)[0])}
                                            radius={themeRadius}
                                        >
                                            {violationActions.map(action => (
                                                <SelectItem key={action.key} description={action.description}>
                                                    {action.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Max Violations Per Day"
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={formData.max_violations_per_day}
                                                onValueChange={(value) => handleFormChange('max_violations_per_day', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Violation Cooldown (minutes)"
                                                type="number"
                                                min="5"
                                                max="60"
                                                value={formData.violation_cooldown_minutes}
                                                onValueChange={(value) => handleFormChange('violation_cooldown_minutes', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span>Send Violation Alerts</span>
                                            <Switch
                                                isSelected={formData.send_violation_alerts}
                                                onValueChange={(value) => handleFormChange('send_violation_alerts', value)}
                                            />
                                        </div>

                                        {formData.send_violation_alerts && (
                                            <Textarea
                                                label="Alert Recipients"
                                                placeholder="manager@company.com, hr@company.com"
                                                value={formData.alert_recipients}
                                                onValueChange={(value) => handleFormChange('alert_recipients', value)}
                                                radius={themeRadius}
                                                description="Comma-separated email addresses"
                                            />
                                        )}

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
                            <h2 className="text-lg font-semibold text-danger">Delete Attendance Rule</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the attendance rule <strong>"{selectedRule?.rule_name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will stop enforcing this rule immediately.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Rule</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Attendance Rules Management">
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
                                                    <ShieldCheckIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Attendance Rules
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Device, IP, location and security-based attendance restrictions
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
                                        aria-label="Attendance Rules" 
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
                                            emptyContent={loading ? "Loading..." : "No attendance rules found"}
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

AttendanceRules.layout = (page) => <App children={page} />;
export default AttendanceRules;