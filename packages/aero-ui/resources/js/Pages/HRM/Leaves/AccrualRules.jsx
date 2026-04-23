import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Select,
    SelectItem,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea
} from "@heroui/react";
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    EllipsisVerticalIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlayIcon,
    PlusIcon,
    TrashIcon,
    UsersIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import axios from 'axios';

const AccrualRules = ({ title, rules, leaveTypes, stats, filters: initialFilters }) => {
    const themeRadius = useThemeRadius();
    const { hasAccess } = useHRMAC();

    // Permission checks
    const canCreate = hasAccess('hrm', 'leaves', 'leave-accrual', 'create');
    const canUpdate = hasAccess('hrm', 'leaves', 'leave-accrual', 'update');
    const canDelete = hasAccess('hrm', 'leaves', 'leave-accrual', 'delete');
    const canRun = hasAccess('hrm', 'leaves', 'leave-accrual', 'run');

    // Responsive state
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
    const [tableData, setTableData] = useState(rules?.data || []);
    const [pagination, setPagination] = useState({
        currentPage: rules?.current_page || 1,
        perPage: rules?.per_page || 10,
        total: rules?.total || 0,
        lastPage: rules?.last_page || 1
    });
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all'
    });
    const [loading, setLoading] = useState(false);

    // Modal states
    const [modalStates, setModalStates] = useState({
        add_edit: false,
        delete: false,
        run_accrual: false
    });
    const [currentRule, setCurrentRule] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form state for add/edit modal
    const [formData, setFormData] = useState({
        name: '',
        leave_type_id: '',
        accrual_frequency: 'monthly',
        accrual_rate: 1,
        max_balance: '',
        min_service_months: 0,
        carry_forward: false,
        max_carry_forward_days: '',
        is_active: true,
        notes: ''
    });

    // Form state for run accrual modal
    const [runAccrualData, setRunAccrualData] = useState({
        month: new Date().toISOString().substring(0, 7),
        user_id: '',
        dry_run: false
    });
    const [runAccrualResult, setRunAccrualResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Stats data
    const statsData = useMemo(() => [
        {
            title: "Total Rules",
            value: stats?.total_rules || 0,
            icon: <ClipboardDocumentListIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "Active Rules",
            value: stats?.active_rules || 0,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20"
        },
        {
            title: "Employees Processed",
            value: stats?.employees_processed_this_month || 0,
            icon: <UsersIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20"
        },
        {
            title: "Days Accrued (This Month)",
            value: stats?.total_days_accrued_this_month || 0,
            icon: <CalendarDaysIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20"
        }
    ], [stats]);

    // Modal handlers
    const openAddEditModal = useCallback((rule = null) => {
        if (rule) {
            setCurrentRule(rule);
            setIsEditMode(true);
            setFormData({
                name: rule.name,
                leave_type_id: String(rule.leave_type_id),
                accrual_frequency: rule.accrual_frequency,
                accrual_rate: rule.accrual_rate,
                max_balance: rule.max_balance || '',
                min_service_months: rule.min_service_months,
                carry_forward: rule.carry_forward,
                max_carry_forward_days: rule.max_carry_forward_days || '',
                is_active: rule.is_active,
                notes: rule.notes || ''
            });
        } else {
            setCurrentRule(null);
            setIsEditMode(false);
            setFormData({
                name: '',
                leave_type_id: '',
                accrual_frequency: 'monthly',
                accrual_rate: 1,
                max_balance: '',
                min_service_months: 0,
                carry_forward: false,
                max_carry_forward_days: '',
                is_active: true,
                notes: ''
            });
        }
        setModalStates(prev => ({ ...prev, add_edit: true }));
    }, []);

    const closeAddEditModal = useCallback(() => {
        setModalStates(prev => ({ ...prev, add_edit: false }));
        setCurrentRule(null);
        setIsEditMode(false);
    }, []);

    const openDeleteModal = useCallback((rule) => {
        setCurrentRule(rule);
        setModalStates(prev => ({ ...prev, delete: true }));
    }, []);

    const closeDeleteModal = useCallback(() => {
        setModalStates(prev => ({ ...prev, delete: false }));
        setCurrentRule(null);
    }, []);

    const openRunAccrualModal = useCallback(() => {
        setRunAccrualData({
            month: new Date().toISOString().substring(0, 7),
            user_id: '',
            dry_run: false
        });
        setRunAccrualResult(null);
        setModalStates(prev => ({ ...prev, run_accrual: true }));
    }, []);

    const closeRunAccrualModal = useCallback(() => {
        setModalStates(prev => ({ ...prev, run_accrual: false }));
        setRunAccrualResult(null);
    }, []);

    // Data fetching
    const fetchRules = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.leaves.accrual.index'), {
                params: {
                    page,
                    per_page: pagination.perPage,
                    search: filters.search,
                    status: filters.status !== 'all' ? filters.status : undefined
                }
            });

            if (response.status === 200) {
                const { rules: rulesData } = response.data;
                setTableData(rulesData.data || []);
                setPagination({
                    currentPage: rulesData.current_page || page,
                    perPage: rulesData.per_page || 10,
                    total: rulesData.total || 0,
                    lastPage: rulesData.last_page || 1
                });
            }
        } catch (error) {
            console.error('Error fetching accrual rules:', error);
            showToast.promise(Promise.reject(error), {
                error: 'Failed to load accrual rules'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.perPage]);

    useEffect(() => {
        fetchRules(1);
    }, [filters]);

    // Form handlers
    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmitRule = useCallback(async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const payload = {
                    ...formData,
                    accrual_rate: parseFloat(formData.accrual_rate),
                    max_balance: formData.max_balance ? parseFloat(formData.max_balance) : null,
                    min_service_months: parseInt(formData.min_service_months),
                    max_carry_forward_days: formData.max_carry_forward_days ? parseFloat(formData.max_carry_forward_days) : null
                };

                const route_name = isEditMode ? `hrm.leaves.accrual.update` : `hrm.leaves.accrual.store`;
                const route_params = isEditMode ? [currentRule.id] : [];

                const response = await axios[isEditMode ? 'put' : 'post'](
                    route(route_name, ...route_params),
                    payload
                );

                if (response.status === 200 || response.status === 201) {
                    fetchRules(pagination.currentPage);
                    closeAddEditModal();
                    resolve([response.data.message || (isEditMode ? 'Rule updated successfully' : 'Rule created successfully')]);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save rule']);
            }
        });

        showToast.promise(promise, {
            loading: isEditMode ? 'Updating rule...' : 'Creating rule...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data
        });
    }, [formData, isEditMode, currentRule, pagination.currentPage, fetchRules, closeAddEditModal]);

    const handleDeleteRule = useCallback(async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.leaves.accrual.destroy', currentRule.id));

                if (response.status === 200) {
                    fetchRules(pagination.currentPage);
                    closeDeleteModal();
                    resolve([response.data.message || 'Rule deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete rule']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting rule...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data
        });
    }, [currentRule, pagination.currentPage, fetchRules, closeDeleteModal]);

    const handleToggleStatus = useCallback(async (rule) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('hrm.leaves.accrual.update', rule.id), {
                    is_active: !rule.is_active
                });

                if (response.status === 200) {
                    fetchRules(pagination.currentPage);
                    resolve([`Rule ${!rule.is_active ? 'activated' : 'deactivated'} successfully`]);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to update rule']);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating rule status...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data
        });
    }, [pagination.currentPage, fetchRules]);

    const handleRunAccrual = useCallback(async () => {
        setIsProcessing(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.leaves.accrual.process'), runAccrualData);

                if (response.status === 200) {
                    setRunAccrualResult(response.data.result);
                    fetchRules(pagination.currentPage);
                    resolve([response.data.message || 'Accrual processed successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to process accrual']);
            } finally {
                setIsProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Processing accrual...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data
        });
    }, [runAccrualData, pagination.currentPage, fetchRules]);

    // Table columns
    const columns = [
        { key: 'name', label: 'Rule Name' },
        { key: 'leave_type', label: 'Leave Type' },
        { key: 'accrual_frequency', label: 'Frequency' },
        { key: 'accrual_rate', label: 'Rate' },
        { key: 'max_balance', label: 'Max Balance' },
        { key: 'min_service_months', label: 'Min Service' },
        { key: 'carry_forward', label: 'Carry Forward' },
        { key: 'is_active', label: 'Status' },
        { key: 'actions', label: 'Actions' }
    ];

    const renderCell = useCallback((rule, columnKey) => {
        const cellValue = rule[columnKey];

        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{rule.name}</span>
                        {rule.notes && <span className="text-xs text-default-500">{rule.notes}</span>}
                    </div>
                );
            case 'leave_type':
                return (
                    <Chip color="primary" variant="flat" size="sm">
                        {rule.leave_type?.name || 'N/A'}
                    </Chip>
                );
            case 'accrual_frequency':
                const frequencyLabels = {
                    'monthly': 'Monthly',
                    'bi-weekly': 'Bi-weekly',
                    'weekly': 'Weekly',
                    'annually': 'Annually'
                };
                return (
                    <Chip color="secondary" variant="flat" size="sm">
                        {frequencyLabels[rule.accrual_frequency] || rule.accrual_frequency}
                    </Chip>
                );
            case 'accrual_rate':
                return <span>{rule.accrual_rate} days/period</span>;
            case 'max_balance':
                return <span>{rule.max_balance ? `${rule.max_balance} days` : 'No cap'}</span>;
            case 'min_service_months':
                return <span>{rule.min_service_months > 0 ? `${rule.min_service_months} months` : '-'}</span>;
            case 'carry_forward':
                return rule.carry_forward ? <CheckCircleIcon className="w-5 h-5 text-success" /> : <span>-</span>;
            case 'is_active':
                return (
                    <Chip
                        color={rule.is_active ? 'success' : 'danger'}
                        variant="flat"
                        size="sm"
                    >
                        {rule.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            {canUpdate && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openAddEditModal(rule)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canUpdate && (
                                <DropdownItem
                                    key="toggle"
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleToggleStatus(rule)}
                                >
                                    {rule.is_active ? 'Deactivate' : 'Activate'}
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => openDeleteModal(rule)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return cellValue;
        }
    }, [canUpdate, canDelete, openAddEditModal, openDeleteModal, handleToggleStatus]);

    return (
        <>
            <Head title={title} />

            {/* Add/Edit Modal */}
            {modalStates.add_edit && (
                <Modal
                    isOpen={modalStates.add_edit}
                    onOpenChange={closeAddEditModal}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">
                                {isEditMode ? 'Edit Accrual Rule' : 'Create New Accrual Rule'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="flex flex-col gap-4">
                                <Input
                                    label="Rule Name"
                                    placeholder="Enter rule name"
                                    value={formData.name}
                                    onValueChange={(value) => handleFormChange('name', value)}
                                    isRequired
                                    radius={themeRadius}
                                />
                                <Select
                                    label="Leave Type"
                                    placeholder="Select leave type"
                                    selectedKeys={formData.leave_type_id ? [formData.leave_type_id] : []}
                                    onSelectionChange={(keys) => handleFormChange('leave_type_id', Array.from(keys)[0])}
                                    isRequired
                                    radius={themeRadius}
                                >
                                    {leaveTypes?.map(type => (
                                        <SelectItem key={String(type.id)} value={String(type.id)}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Select
                                    label="Accrual Frequency"
                                    placeholder="Select frequency"
                                    selectedKeys={[formData.accrual_frequency]}
                                    onSelectionChange={(keys) => handleFormChange('accrual_frequency', Array.from(keys)[0])}
                                    radius={themeRadius}
                                >
                                    <SelectItem key="monthly">Monthly</SelectItem>
                                    <SelectItem key="bi-weekly">Bi-weekly</SelectItem>
                                    <SelectItem key="weekly">Weekly</SelectItem>
                                    <SelectItem key="annually">Annually</SelectItem>
                                </Select>
                                <Input
                                    label="Days Accrued Per Period"
                                    type="number"
                                    placeholder="e.g., 2.5"
                                    value={String(formData.accrual_rate)}
                                    onValueChange={(value) => handleFormChange('accrual_rate', parseFloat(value) || 0)}
                                    step="0.01"
                                    min="0"
                                    radius={themeRadius}
                                />
                                <Input
                                    label="Max Balance Cap (days)"
                                    type="number"
                                    placeholder="Leave empty for no cap"
                                    value={String(formData.max_balance)}
                                    onValueChange={(value) => handleFormChange('max_balance', value)}
                                    step="0.01"
                                    min="0"
                                    radius={themeRadius}
                                />
                                <Input
                                    label="Min Service (months)"
                                    type="number"
                                    placeholder="e.g., 6"
                                    value={String(formData.min_service_months)}
                                    onValueChange={(value) => handleFormChange('min_service_months', parseInt(value) || 0)}
                                    min="0"
                                    radius={themeRadius}
                                />
                                <div className="flex items-center gap-3">
                                    <Switch
                                        isSelected={formData.carry_forward}
                                        onValueChange={(value) => handleFormChange('carry_forward', value)}
                                    />
                                    <label className="text-sm text-foreground">Allow Carry Forward</label>
                                </div>
                                {formData.carry_forward && (
                                    <Input
                                        label="Max Carry Forward Days"
                                        type="number"
                                        placeholder="e.g., 5"
                                        value={String(formData.max_carry_forward_days)}
                                        onValueChange={(value) => handleFormChange('max_carry_forward_days', value)}
                                        step="0.01"
                                        min="0"
                                        radius={themeRadius}
                                    />
                                )}
                                <div className="flex items-center gap-3">
                                    <Switch
                                        isSelected={formData.is_active}
                                        onValueChange={(value) => handleFormChange('is_active', value)}
                                    />
                                    <label className="text-sm text-foreground">Active</label>
                                </div>
                                <Textarea
                                    label="Notes"
                                    placeholder="Add any notes about this rule..."
                                    value={formData.notes}
                                    onValueChange={(value) => handleFormChange('notes', value)}
                                    minRows={3}
                                    radius={themeRadius}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={closeAddEditModal}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmitRule}>
                                {isEditMode ? 'Update Rule' : 'Create Rule'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {modalStates.delete && (
                <Modal
                    isOpen={modalStates.delete}
                    onOpenChange={closeDeleteModal}
                    size="md"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Delete Accrual Rule</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the accrual rule <strong>{currentRule?.name}</strong>? This action cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={closeDeleteModal}>
                                Cancel
                            </Button>
                            <Button color="danger" onPress={handleDeleteRule}>
                                Delete
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Run Accrual Modal */}
            {modalStates.run_accrual && (
                <Modal
                    isOpen={modalStates.run_accrual}
                    onOpenChange={closeRunAccrualModal}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Run Leave Accrual Engine</h2>
                        </ModalHeader>
                        <ModalBody>
                            {!runAccrualResult ? (
                                <div className="flex flex-col gap-4">
                                    <Input
                                        label="Month"
                                        type="month"
                                        value={runAccrualData.month}
                                        onChange={(e) => setRunAccrualData(prev => ({ ...prev, month: e.target.value }))}
                                        isRequired
                                        radius={themeRadius}
                                    />
                                    <Select
                                        label="Employee (Optional)"
                                        placeholder="Leave empty to process all"
                                        selectedKeys={runAccrualData.user_id ? [runAccrualData.user_id] : []}
                                        onSelectionChange={(keys) => setRunAccrualData(prev => ({ ...prev, user_id: Array.from(keys)[0] || '' }))}
                                        radius={themeRadius}
                                    >
                                        {/* Employee list would come from props or API */}
                                    </Select>
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            isSelected={runAccrualData.dry_run}
                                            onValueChange={(value) => setRunAccrualData(prev => ({ ...prev, dry_run: value }))}
                                        />
                                        <label className="text-sm text-foreground">Dry Run (simulate only)</label>
                                    </div>
                                </div>
                            ) : (
                                <Card className="bg-content2">
                                    <CardBody className="gap-3">
                                        <p><strong>Processed Employees:</strong> {runAccrualResult.processed_count}</p>
                                        <p><strong>Skipped Employees:</strong> {runAccrualResult.skipped_count}</p>
                                        {runAccrualResult.errors && runAccrualResult.errors.length > 0 && (
                                            <div>
                                                <strong>Errors:</strong>
                                                <ul className="mt-2 ml-4 text-sm text-danger space-y-1">
                                                    {runAccrualResult.errors.map((error, idx) => (
                                                        <li key={idx}>• {error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={closeRunAccrualModal}>
                                {runAccrualResult ? 'Close' : 'Cancel'}
                            </Button>
                            {!runAccrualResult && (
                                <Button color="primary" onPress={handleRunAccrual} isLoading={isProcessing}>
                                    Run Accrual
                                </Button>
                            )}
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Leave Accrual Rules">
                <div className="space-y-4">
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
                                    var(--theme-content3, #F1F3F4) 20%)`
                            }}
                        >
                            {/* Card Header */}
                            <CardHeader
                                className="border-b p-0"
                                style={{
                                    borderColor: `var(--theme-divider, #E4E4E7)`,
                                    background: `linear-gradient(135deg, 
                                        color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                        color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`
                                }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Title Section */}
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`
                                                }}
                                            >
                                                <ClipboardDocumentListIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    {title}
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Manage leave accrual rules and run the accrual engine
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            {canCreate && (
                                                <Button
                                                    color="primary"
                                                    variant="shadow"
                                                    startContent={<PlusIcon className="w-4 h-4" />}
                                                    onPress={() => openAddEditModal(null)}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Add Rule
                                                </Button>
                                            )}
                                            {canRun && (
                                                <Button
                                                    color="secondary"
                                                    variant="shadow"
                                                    startContent={<PlayIcon className="w-4 h-4" />}
                                                    onPress={openRunAccrualModal}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Run Accrual
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Card Body */}
                            <CardBody className="p-6">
                                {/* Stats Cards */}
                                <StatsCards stats={statsData} className="mb-6" />

                                {/* Filter Section */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Input
                                        placeholder="Search rules..."
                                        value={filters.search}
                                        onValueChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        className="flex-1"
                                    />
                                    <Select
                                        placeholder="All Status"
                                        selectedKeys={[filters.status]}
                                        onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] }))}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        className="sm:w-40"
                                    >
                                        <SelectItem key="all">All Status</SelectItem>
                                        <SelectItem key="active">Active Only</SelectItem>
                                        <SelectItem key="inactive">Inactive Only</SelectItem>
                                    </Select>
                                </div>

                                {/* Data Table */}
                                {loading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="text-default-500">Loading accrual rules...</div>
                                    </div>
                                ) : tableData.length > 0 ? (
                                    <>
                                        <Table
                                            aria-label="Leave accrual rules"
                                            isHeaderSticky
                                            classNames={{
                                                wrapper: "shadow-none border border-divider rounded-lg",
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-3"
                                            }}
                                        >
                                            <TableHeader columns={columns}>
                                                {(column) => (
                                                    <TableColumn
                                                        key={column.key}
                                                        className={column.key === 'actions' ? 'text-center' : ''}
                                                    >
                                                        {column.label}
                                                    </TableColumn>
                                                )}
                                            </TableHeader>
                                            <TableBody items={tableData} emptyContent="No accrual rules found">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>
                                                                {renderCell(item, columnKey)}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination */}
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                isCompact
                                                showControls
                                                showShadow
                                                color="primary"
                                                page={pagination.currentPage}
                                                total={pagination.lastPage}
                                                onChange={(page) => fetchRules(page)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <Card className="bg-content2">
                                        <CardBody className="py-8 text-center">
                                            <p className="text-default-500">No accrual rules found. Create one to get started.</p>
                                        </CardBody>
                                    </Card>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

// Layout wrapper
AccrualRules.layout = (page) => <App children={page} />;

export default AccrualRules;
