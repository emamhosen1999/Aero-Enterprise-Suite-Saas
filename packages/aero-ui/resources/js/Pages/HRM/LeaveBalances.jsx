import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Progress, Tabs, Tab, Textarea } from "@heroui/react";
import { 
    ScaleIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    ArrowPathIcon,
    BanknotesIcon,
    DocumentTextIcon,
    ChartBarIcon,
    UserIcon,
    BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const LeaveBalances = ({ title, departments = [], employees = [], leaveTypes = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete } = useHRMAC();
    
    // Theme radius helper
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
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
    const [balances, setBalances] = useState([]);
    const [activeTab, setActiveTab] = useState('balances');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        leave_type_id: 'all',
        employee_status: 'all',
        balance_status: 'all',
        accrual_period: 'current'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 25, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_employees: 0, 
        total_accrued: 0, 
        total_used: 0, 
        total_remaining: 0,
        expiring_soon: 0,
        negative_balances: 0,
        avg_utilization: 0,
        carry_over_eligible: 0
    });
    const [modalStates, setModalStates] = useState({ 
        add: false, 
        edit: false, 
        delete: false, 
        view: false, 
        adjust: false, 
        bulk_adjust: false,
        carry_over: false,
        reset: false
    });
    const [selectedBalance, setSelectedBalance] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({
        employee_id: '',
        leave_type_id: '',
        adjustment_type: 'add', // add, deduct, set
        adjustment_days: '',
        reason: '',
        effective_date: new Date().toISOString().split('T')[0],
        expires_on: '',
        notes: ''
    });

    // Permission checks
    const canManageBalances = canUpdate('hrm.leave.balances');
    const canAdjustBalances = canUpdate('hrm.leave.adjustments');
    const canViewBalances = canCreate('hrm.leave.balances') || canUpdate('hrm.leave.balances');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Accrued", 
            value: `${stats.total_accrued} days`, 
            icon: <BanknotesIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Total Used", 
            value: `${stats.total_used} days`, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Remaining Balance", 
            value: `${stats.total_remaining} days`, 
            icon: <ScaleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Expiring Soon", 
            value: stats.expiring_soon, 
            icon: <ExclamationTriangleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Configuration
    const adjustmentTypes = [
        { key: 'add', label: 'Add Days', color: 'success', description: 'Add leave days to balance' },
        { key: 'deduct', label: 'Deduct Days', color: 'warning', description: 'Deduct days from balance' },
        { key: 'set', label: 'Set Balance', color: 'primary', description: 'Set exact balance amount' },
        { key: 'reset', label: 'Reset Balance', color: 'danger', description: 'Reset to default allocation' },
    ];

    const balanceStatuses = [
        { key: 'normal', label: 'Normal', color: 'success' },
        { key: 'low', label: 'Low Balance', color: 'warning' },
        { key: 'critical', label: 'Critical', color: 'danger' },
        { key: 'negative', label: 'Negative', color: 'danger' },
        { key: 'expiring', label: 'Expiring Soon', color: 'warning' },
    ];

    const accrualPeriods = [
        { key: 'current', label: 'Current Year' },
        { key: 'previous', label: 'Previous Year' },
        { key: 'next', label: 'Next Year' },
        { key: 'all', label: 'All Periods' },
    ];

    const getBalanceStatus = (balance) => {
        if (balance.current_balance < 0) return 'negative';
        if (balance.days_until_expiry <= 30 && balance.days_until_expiry > 0) return 'expiring';
        if (balance.current_balance <= balance.critical_threshold) return 'critical';
        if (balance.current_balance <= balance.low_threshold) return 'low';
        return 'normal';
    };

    const getBalanceColor = (status) => {
        const colors = {
            normal: 'success',
            low: 'warning',
            critical: 'danger',
            negative: 'danger',
            expiring: 'warning'
        };
        return colors[status] || 'default';
    };

    const getUtilizationColor = (percentage) => {
        if (percentage >= 80) return 'danger';
        if (percentage >= 60) return 'warning';
        if (percentage >= 40) return 'primary';
        return 'success';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateUtilization = (used, total) => {
        if (total === 0) return 0;
        return Math.round((used / total) * 100);
    };

    // Data fetching
    const fetchBalances = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.leave.balances.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    year: selectedYear,
                    ...filters
                }
            });
            if (response.status === 200) {
                setBalances(response.data.balances || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch leave balances'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage, selectedYear]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.leave.balances.stats'), {
                params: { year: selectedYear }
            });
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch leave balance stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchBalances();
        fetchStats();
    }, [fetchBalances, fetchStats]);

    // CRUD operations
    const handleAdjustment = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.leave.balances.adjust'), adjustmentData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Balance adjusted successfully']);
                    fetchBalances();
                    fetchStats();
                    closeModal('adjust');
                    resetAdjustmentForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to adjust balance']);
            }
        });

        showToast.promise(promise, {
            loading: 'Adjusting leave balance...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleBulkCarryOver = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.leave.balances.carry_over'), {
                    from_year: selectedYear,
                    to_year: selectedYear + 1,
                    department_id: filters.department_id !== 'all' ? filters.department_id : null
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Carry over processed successfully']);
                    fetchBalances();
                    fetchStats();
                    closeModal('carry_over');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to process carry over']);
            }
        });

        showToast.promise(promise, {
            loading: 'Processing carry over...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleYearlyReset = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.leave.balances.yearly_reset'), {
                    year: selectedYear,
                    department_id: filters.department_id !== 'all' ? filters.department_id : null
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Yearly reset completed successfully']);
                    fetchBalances();
                    fetchStats();
                    closeModal('reset');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to reset balances']);
            }
        });

        showToast.promise(promise, {
            loading: 'Resetting yearly balances...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, balance = null) => {
        setSelectedBalance(balance);
        if (balance && type === 'adjust') {
            setAdjustmentData({
                employee_id: balance.employee_id,
                leave_type_id: balance.leave_type_id,
                adjustment_type: 'add',
                adjustment_days: '',
                reason: '',
                effective_date: new Date().toISOString().split('T')[0],
                expires_on: '',
                notes: ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedBalance(null);
    };

    const resetAdjustmentForm = () => {
        setAdjustmentData({
            employee_id: '',
            leave_type_id: '',
            adjustment_type: 'add',
            adjustment_days: '',
            reason: '',
            effective_date: new Date().toISOString().split('T')[0],
            expires_on: '',
            notes: ''
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleAdjustmentChange = (key, value) => {
        setAdjustmentData(prev => ({ ...prev, [key]: value }));
    };

    // Year navigation
    const handleYearChange = (year) => {
        setSelectedYear(year);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'leave_type', name: 'Leave Type' },
        { uid: 'allocation', name: 'Allocation' },
        { uid: 'accrued', name: 'Accrued' },
        { uid: 'used', name: 'Used' },
        { uid: 'remaining', name: 'Remaining' },
        { uid: 'utilization', name: 'Utilization' },
        { uid: 'expiry', name: 'Expiry' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((balance, columnKey) => {
        const balanceStatus = getBalanceStatus(balance);
        const utilization = calculateUtilization(balance.used_days, balance.total_allocated);

        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="font-medium">{balance.employee?.full_name}</p>
                            <p className="text-xs text-default-500">#{balance.employee?.employee_id}</p>
                            <p className="text-xs text-default-500">{balance.employee?.department?.name}</p>
                        </div>
                    </div>
                );
            case 'leave_type':
                return (
                    <div>
                        <p className="font-medium">{balance.leave_type?.name}</p>
                        <p className="text-xs text-default-500">{balance.leave_type?.code}</p>
                    </div>
                );
            case 'allocation':
                return (
                    <div className="text-sm">
                        <p className="font-medium">{balance.total_allocated} days</p>
                        <p className="text-xs text-default-500">
                            Base: {balance.base_allocation} + Earned: {balance.earned_allocation}
                        </p>
                    </div>
                );
            case 'accrued':
                return (
                    <div className="text-sm">
                        <p className="font-medium text-success">{balance.accrued_days} days</p>
                        <p className="text-xs text-default-500">
                            Rate: {balance.accrual_rate}/month
                        </p>
                    </div>
                );
            case 'used':
                return (
                    <div className="text-sm">
                        <p className="font-medium text-warning">{balance.used_days} days</p>
                        <p className="text-xs text-default-500">
                            Pending: {balance.pending_days}
                        </p>
                    </div>
                );
            case 'remaining':
                return (
                    <div className="text-sm">
                        <p className={`font-medium ${balance.current_balance < 0 ? 'text-danger' : 'text-primary'}`}>
                            {balance.current_balance} days
                        </p>
                        {balance.carry_over_days > 0 && (
                            <p className="text-xs text-default-500">
                                Carried: {balance.carry_over_days}
                            </p>
                        )}
                    </div>
                );
            case 'utilization':
                return (
                    <div className="w-full max-w-md">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Usage</span>
                            <span>{utilization}%</span>
                        </div>
                        <Progress
                            value={utilization}
                            color={getUtilizationColor(utilization)}
                            size="sm"
                        />
                    </div>
                );
            case 'expiry':
                return (
                    <div className="text-sm">
                        {balance.expires_on ? (
                            <>
                                <p className="font-medium">{formatDate(balance.expires_on)}</p>
                                {balance.days_until_expiry <= 30 && balance.days_until_expiry > 0 && (
                                    <Chip size="sm" color="warning" variant="flat">
                                        {balance.days_until_expiry} days left
                                    </Chip>
                                )}
                            </>
                        ) : (
                            <span className="text-default-500">No expiry</span>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <div className="flex flex-col gap-1">
                        <Chip 
                            color={getBalanceColor(balanceStatus)} 
                            size="sm" 
                            variant="flat"
                        >
                            {balanceStatus.replace('_', ' ').toUpperCase()}
                        </Chip>
                        {balance.last_updated && (
                            <p className="text-xs text-default-500">
                                Updated: {formatDate(balance.last_updated)}
                            </p>
                        )}
                    </div>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', balance)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canAdjustBalances && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => openModal('adjust', balance)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return balance[columnKey] || '-';
        }
    }, [canAdjustBalances]);

    return (
        <>
            <Head title={title} />
            
            {/* Balance Adjustment Modal */}
            {modalStates.adjust && (
                <Modal 
                    isOpen={modalStates.adjust} 
                    onOpenChange={() => closeModal('adjust')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                Adjust Leave Balance
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                {selectedBalance && (
                                    <Card>
                                        <CardBody className="py-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{selectedBalance.employee?.full_name}</p>
                                                    <p className="text-sm text-default-500">{selectedBalance.leave_type?.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">Current: {selectedBalance.current_balance} days</p>
                                                    <p className="text-sm text-default-500">Used: {selectedBalance.used_days} days</p>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Adjustment Type"
                                        selectedKeys={[adjustmentData.adjustment_type]}
                                        onSelectionChange={(keys) => handleAdjustmentChange('adjustment_type', Array.from(keys)[0])}
                                        radius={getThemeRadius()}
                                    >
                                        {adjustmentTypes.map(type => (
                                            <SelectItem key={type.key} description={type.description}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Input
                                        label="Days"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={adjustmentData.adjustment_days}
                                        onValueChange={(value) => handleAdjustmentChange('adjustment_days', value)}
                                        radius={getThemeRadius()}
                                        isRequired
                                    />
                                </div>

                                <Textarea
                                    label="Reason for Adjustment"
                                    placeholder="Explain why this adjustment is necessary..."
                                    value={adjustmentData.reason}
                                    onValueChange={(value) => handleAdjustmentChange('reason', value)}
                                    radius={getThemeRadius()}
                                    isRequired
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Effective Date"
                                        type="date"
                                        value={adjustmentData.effective_date}
                                        onValueChange={(value) => handleAdjustmentChange('effective_date', value)}
                                        radius={getThemeRadius()}
                                    />

                                    <Input
                                        label="Expires On (Optional)"
                                        type="date"
                                        value={adjustmentData.expires_on}
                                        onValueChange={(value) => handleAdjustmentChange('expires_on', value)}
                                        radius={getThemeRadius()}
                                    />
                                </div>

                                <Textarea
                                    label="Additional Notes"
                                    placeholder="Any additional notes or comments..."
                                    value={adjustmentData.notes}
                                    onValueChange={(value) => handleAdjustmentChange('notes', value)}
                                    radius={getThemeRadius()}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('adjust')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleAdjustment}>
                                Apply Adjustment
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Carry Over Modal */}
            {modalStates.carry_over && (
                <Modal isOpen={modalStates.carry_over} onOpenChange={() => closeModal('carry_over')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Year-end Carry Over</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Process carry over of unused leave balances from {selectedYear} to {selectedYear + 1}?</p>
                            <p className="text-sm text-warning">This will apply carry over rules and may affect multiple employees.</p>
                            {filters.department_id !== 'all' && (
                                <p className="text-sm text-primary">This will only process the selected department.</p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('carry_over')}>Cancel</Button>
                            <Button color="primary" onPress={handleBulkCarryOver}>Process Carry Over</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Yearly Reset Modal */}
            {modalStates.reset && (
                <Modal isOpen={modalStates.reset} onOpenChange={() => closeModal('reset')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Yearly Reset</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Reset all leave balances for {selectedYear}?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will reset balances to their default allocations.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('reset')}>Cancel</Button>
                            <Button color="danger" onPress={handleYearlyReset}>Reset Balances</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Leave Balance Management">
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
                                                    <ScaleIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Leave Balances
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Track leave accruals, usage, and balances
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {/* Year Selector */}
                                                <div className="flex items-center gap-1 bg-default-100 rounded-lg p-1">
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        isIconOnly
                                                        onPress={() => handleYearChange(selectedYear - 1)}
                                                    >
                                                        ←
                                                    </Button>
                                                    <span className="px-3 font-medium">{selectedYear}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        isIconOnly
                                                        onPress={() => handleYearChange(selectedYear + 1)}
                                                    >
                                                        →
                                                    </Button>
                                                </div>

                                                {canManageBalances && (
                                                    <>
                                                        <Button 
                                                            color="secondary" 
                                                            variant="flat"
                                                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('carry_over')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Carry Over
                                                        </Button>
                                                        <Button 
                                                            color="primary" 
                                                            variant="shadow"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={() => openModal('adjust')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Adjust Balance
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
                                            placeholder="Search employees..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments.map(department => (
                                                <SelectItem key={department.id}>{department.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Leave Types"
                                            selectedKeys={filters.leave_type_id !== 'all' ? [filters.leave_type_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('leave_type_id', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Leave Types</SelectItem>
                                            {leaveTypes.map(type => (
                                                <SelectItem key={type.id}>{type.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.balance_status !== 'all' ? [filters.balance_status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('balance_status', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            {balanceStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Leave Balances" 
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
                                            items={balances} 
                                            emptyContent={loading ? "Loading..." : "No leave balances found"}
                                            isLoading={loading}
                                        >
                                            {(item) => (
                                                <TableRow key={`${item.employee_id}-${item.leave_type_id}`}>
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

LeaveBalances.layout = (page) => <App children={page} />;
export default LeaveBalances;