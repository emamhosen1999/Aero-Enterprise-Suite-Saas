import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Switch, Tabs, Tab } from "@heroui/react";
import { 
    ShieldCheckIcon,
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
    XCircleIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const AttendanceRules = ({ title, departments = [], attendanceRules = [] }) => {
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
    const [rules, setRules] = useState(attendanceRules);
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        rule_type: 'all',
        status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_rules: 0, 
        active_rules: 0, 
        device_rules: 0, 
        ip_rules: 0,
        geo_rules: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false, view: false });
    const [selectedRule, setSelectedRule] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        rule_type: 'device', // device, ip, geo
        department_ids: [],
        is_global: true,
        status: 'active',
        
        // Device rules
        device_type: 'all', // all, mobile, desktop
        allowed_devices: [],
        max_devices: '',
        device_registration_required: false,
        
        // IP rules  
        allowed_ip_addresses: [],
        ip_restriction_type: 'whitelist', // whitelist, blacklist
        subnet_allowed: false,
        
        // Geo-fencing rules
        allowed_locations: [],
        geo_radius: '100', // meters
        location_accuracy_threshold: '50', // meters
        allow_gps_spoofing_detection: true,
        
        // General settings
        enforce_during: ['clock_in', 'clock_out'], // clock_in, clock_out, break
        violation_action: 'block', // block, warn, log
        notify_admin: true,
        auto_logout_violation: false,
        exception_users: []
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
            value: stats.device_rules, 
            icon: <ComputerDesktopIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Location Rules", 
            value: stats.geo_rules, 
            icon: <MapPinIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Rule configuration
    const ruleTypes = [
        { key: 'device', label: 'Device Restriction', icon: <ComputerDesktopIcon className="w-4 h-4" /> },
        { key: 'ip', label: 'IP Address Control', icon: <ShieldCheckIcon className="w-4 h-4" /> },
        { key: 'geo', label: 'Geo-fencing', icon: <MapPinIcon className="w-4 h-4" /> },
    ];

    const ruleStatuses = [
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'inactive', label: 'Inactive', color: 'danger' },
        { key: 'testing', label: 'Testing', color: 'warning' },
    ];

    const deviceTypes = [
        { key: 'all', label: 'All Devices' },
        { key: 'mobile', label: 'Mobile Devices Only' },
        { key: 'desktop', label: 'Desktop Only' },
        { key: 'specific', label: 'Specific Devices' },
    ];

    const violationActions = [
        { key: 'block', label: 'Block Attendance', color: 'danger' },
        { key: 'warn', label: 'Show Warning', color: 'warning' },
        { key: 'log', label: 'Log Only', color: 'primary' },
    ];

    const getStatusColor = (status) => {
        return ruleStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return ruleStatuses.find(s => s.key === status)?.label || status;
    };

    const getRuleTypeLabel = (type) => {
        return ruleTypes.find(t => t.key === type)?.label || type;
    };

    const getViolationActionColor = (action) => {
        return violationActions.find(a => a.key === action)?.color || 'default';
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
            console.error('Failed to fetch rule stats:', error);
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
            loading: `${selectedRule ? 'Updating' : 'Creating'} rule...`,
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
                rule_type: rule.rule_type || 'device',
                department_ids: rule.department_ids || [],
                is_global: rule.is_global || false,
                status: rule.status || 'active',
                
                device_type: rule.device_type || 'all',
                allowed_devices: rule.allowed_devices || [],
                max_devices: rule.max_devices || '',
                device_registration_required: rule.device_registration_required || false,
                
                allowed_ip_addresses: rule.allowed_ip_addresses || [],
                ip_restriction_type: rule.ip_restriction_type || 'whitelist',
                subnet_allowed: rule.subnet_allowed || false,
                
                allowed_locations: rule.allowed_locations || [],
                geo_radius: rule.geo_radius || '100',
                location_accuracy_threshold: rule.location_accuracy_threshold || '50',
                allow_gps_spoofing_detection: rule.allow_gps_spoofing_detection !== false,
                
                enforce_during: rule.enforce_during || ['clock_in', 'clock_out'],
                violation_action: rule.violation_action || 'block',
                notify_admin: rule.notify_admin !== false,
                auto_logout_violation: rule.auto_logout_violation || false,
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
            rule_type: 'device',
            department_ids: [],
            is_global: true,
            status: 'active',
            
            device_type: 'all',
            allowed_devices: [],
            max_devices: '',
            device_registration_required: false,
            
            allowed_ip_addresses: [],
            ip_restriction_type: 'whitelist',
            subnet_allowed: false,
            
            allowed_locations: [],
            geo_radius: '100',
            location_accuracy_threshold: '50',
            allow_gps_spoofing_detection: true,
            
            enforce_during: ['clock_in', 'clock_out'],
            violation_action: 'block',
            notify_admin: true,
            auto_logout_violation: false,
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
        { uid: 'rule_type', name: 'Type' },
        { uid: 'scope', name: 'Scope' },
        { uid: 'enforcement', name: 'Enforcement' },
        { uid: 'violation_action', name: 'Violation Action' },
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
            case 'rule_type':
                const ruleType = ruleTypes.find(t => t.key === rule.rule_type);
                return (
                    <div className="flex items-center gap-2">
                        {ruleType?.icon}
                        <span>{getRuleTypeLabel(rule.rule_type)}</span>
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
            case 'enforcement':
                return (
                    <div className="text-sm">
                        {rule.enforce_during?.map(time => (
                            <Chip key={time} size="sm" variant="flat" className="mr-1 mb-1">
                                {time.replace('_', ' ')}
                            </Chip>
                        ))}
                    </div>
                );
            case 'violation_action':
                return (
                    <Chip 
                        color={getViolationActionColor(rule.violation_action)} 
                        size="sm" 
                        variant="flat"
                    >
                        {rule.violation_action?.replace('_', ' ') || 'Block'}
                    </Chip>
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
                    size="4xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedRule ? 'Edit Attendance Rule' : 'Add Attendance Rule'}
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
                                                label="Rule Type"
                                                selectedKeys={[formData.rule_type]}
                                                onSelectionChange={(keys) => handleFormChange('rule_type', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {ruleTypes.map(type => (
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

                                <Tab key="enforcement" title="Enforcement">
                                    <div className="space-y-4">
                                        <Select
                                            label="Enforce During"
                                            placeholder="Select when to enforce"
                                            selectionMode="multiple"
                                            selectedKeys={formData.enforce_during}
                                            onSelectionChange={(keys) => handleFormChange('enforce_during', Array.from(keys))}
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="clock_in">Clock In</SelectItem>
                                            <SelectItem key="clock_out">Clock Out</SelectItem>
                                            <SelectItem key="break">Break Time</SelectItem>
                                        </Select>

                                        <Select
                                            label="Violation Action"
                                            selectedKeys={[formData.violation_action]}
                                            onSelectionChange={(keys) => handleFormChange('violation_action', Array.from(keys)[0])}
                                            radius={themeRadius}
                                        >
                                            {violationActions.map(action => (
                                                <SelectItem key={action.key}>{action.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <div className="space-y-3">
                                            <Switch
                                                isSelected={formData.notify_admin}
                                                onValueChange={(checked) => handleFormChange('notify_admin', checked)}
                                            >
                                                Notify Admin on Violations
                                            </Switch>

                                            <Switch
                                                isSelected={formData.auto_logout_violation}
                                                onValueChange={(checked) => handleFormChange('auto_logout_violation', checked)}
                                            >
                                                Auto Logout on Violation
                                            </Switch>
                                        </div>
                                    </div>
                                </Tab>

                                {formData.rule_type === 'device' && (
                                    <Tab key="device" title="Device Settings">
                                        <div className="space-y-4">
                                            <Select
                                                label="Device Type"
                                                selectedKeys={[formData.device_type]}
                                                onSelectionChange={(keys) => handleFormChange('device_type', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {deviceTypes.map(type => (
                                                    <SelectItem key={type.key}>{type.label}</SelectItem>
                                                ))}
                                            </Select>

                                            {formData.device_type === 'specific' && (
                                                <Textarea
                                                    label="Allowed Device IDs"
                                                    placeholder="Enter device IDs (one per line)"
                                                    value={formData.allowed_devices.join('\n')}
                                                    onValueChange={(value) => handleFormChange('allowed_devices', value.split('\n').filter(id => id.trim()))}
                                                    radius={themeRadius}
                                                />
                                            )}

                                            <Input
                                                label="Max Devices Per User"
                                                type="number"
                                                placeholder="Enter max devices"
                                                value={formData.max_devices}
                                                onValueChange={(value) => handleFormChange('max_devices', value)}
                                                radius={themeRadius}
                                            />

                                            <Switch
                                                isSelected={formData.device_registration_required}
                                                onValueChange={(checked) => handleFormChange('device_registration_required', checked)}
                                            >
                                                Require Device Registration
                                            </Switch>
                                        </div>
                                    </Tab>
                                )}

                                {formData.rule_type === 'ip' && (
                                    <Tab key="ip" title="IP Settings">
                                        <div className="space-y-4">
                                            <Select
                                                label="IP Restriction Type"
                                                selectedKeys={[formData.ip_restriction_type]}
                                                onSelectionChange={(keys) => handleFormChange('ip_restriction_type', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                <SelectItem key="whitelist">Whitelist (Allow Only)</SelectItem>
                                                <SelectItem key="blacklist">Blacklist (Block Only)</SelectItem>
                                            </Select>

                                            <Textarea
                                                label="IP Addresses"
                                                placeholder="Enter IP addresses (one per line)"
                                                value={formData.allowed_ip_addresses.join('\n')}
                                                onValueChange={(value) => handleFormChange('allowed_ip_addresses', value.split('\n').filter(ip => ip.trim()))}
                                                radius={themeRadius}
                                            />

                                            <Switch
                                                isSelected={formData.subnet_allowed}
                                                onValueChange={(checked) => handleFormChange('subnet_allowed', checked)}
                                            >
                                                Allow Subnet Ranges (CIDR notation)
                                            </Switch>
                                        </div>
                                    </Tab>
                                )}

                                {formData.rule_type === 'geo' && (
                                    <Tab key="geo" title="Location Settings">
                                        <div className="space-y-4">
                                            <Textarea
                                                label="Allowed Locations"
                                                placeholder="Enter location coordinates (lat,lng) one per line"
                                                value={formData.allowed_locations.join('\n')}
                                                onValueChange={(value) => handleFormChange('allowed_locations', value.split('\n').filter(loc => loc.trim()))}
                                                radius={themeRadius}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Geo-fence Radius (meters)"
                                                    type="number"
                                                    value={formData.geo_radius}
                                                    onValueChange={(value) => handleFormChange('geo_radius', value)}
                                                    radius={themeRadius}
                                                />

                                                <Input
                                                    label="Location Accuracy Threshold (meters)"
                                                    type="number"
                                                    value={formData.location_accuracy_threshold}
                                                    onValueChange={(value) => handleFormChange('location_accuracy_threshold', value)}
                                                    radius={themeRadius}
                                                />
                                            </div>

                                            <Switch
                                                isSelected={formData.allow_gps_spoofing_detection}
                                                onValueChange={(checked) => handleFormChange('allow_gps_spoofing_detection', checked)}
                                            >
                                                Enable GPS Spoofing Detection
                                            </Switch>
                                        </div>
                                    </Tab>
                                )}
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
                            <p>Are you sure you want to delete the rule <strong>"{selectedRule?.name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and may affect attendance enforcement.</p>
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
                                                        Configure device, IP, and location-based attendance restrictions
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

AttendanceRules.layout = (page) => <App children={page} />;
export default AttendanceRules;