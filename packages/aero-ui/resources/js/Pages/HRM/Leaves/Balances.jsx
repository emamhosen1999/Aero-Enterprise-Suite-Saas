import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Switch, Avatar } from "@heroui/react";
import { 
    ScaleIcon,
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
    ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const LeaveBalances = ({ title, employees = [], leaveTypes = [], departments = [], balanceData = [] }) => {
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
    const [balances, setBalances] = useState(balanceData);
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        leave_type_id: 'all',
        year: new Date().getFullYear(),
        balance_status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_employees: 0, 
        total_allocated: 0, 
        total_used: 0, 
        total_remaining: 0,
        expiring_soon: 0
    });
    const [modalStates, setModalStates] = useState({ 
        adjust: false, 
        bulk: false, 
        history: false, 
        allocate: false 
    });
    const [selectedBalance, setSelectedBalance] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({
        employee_id: '',
        leave_type_id: '',
        adjustment_type: 'add', // add, deduct, set
        amount: '',
        reason: '',
        notes: '',
        effective_date: new Date().toISOString().split('T')[0]
    });
    const [bulkAllocationData, setBulkAllocationData] = useState({
        department_ids: [],
        leave_type_id: '',
        allocation_amount: '',
        effective_date: new Date().toISOString().split('T')[0],
        reset_existing: false,
        notes: ''
    });

    // Permission checks
    const canAdjustBalances = canUpdate('hrm.leaves.adjust-balance');
    const canBulkAllocate = canCreate('hrm.leaves.bulk-allocate');
    const canViewHistory = canUpdate('hrm.leaves.balance-history');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: stats.total_employees, 
            icon: <UserIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Total Allocated", 
            value: stats.total_allocated, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Total Used", 
            value: stats.total_used, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Expiring Soon", 
            value: stats.expiring_soon, 
            icon: <ExclamationCircleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Balance status configuration
    const balanceStatuses = [
        { key: 'sufficient', label: 'Sufficient', color: 'success' },
        { key: 'low', label: 'Low Balance', color: 'warning' },
        { key: 'depleted', label: 'Depleted', color: 'danger' },
        { key: 'expiring', label: 'Expiring Soon', color: 'secondary' },
    ];

    const adjustmentTypes = [
        { key: 'add', label: 'Add Balance', icon: '+' },
        { key: 'deduct', label: 'Deduct Balance', icon: '-' },
        { key: 'set', label: 'Set Balance', icon: '=' },
    ];

    const getStatusColor = (balance) => {
        const remaining = balance.allocated - balance.used;
        const percentage = balance.allocated > 0 ? (remaining / balance.allocated) * 100 : 0;
        
        if (remaining <= 0) return 'danger';
        if (percentage <= 25) return 'warning';
        if (balance.is_expiring_soon) return 'secondary';
        return 'success';
    };

    const getStatusLabel = (balance) => {
        const remaining = balance.allocated - balance.used;
        const percentage = balance.allocated > 0 ? (remaining / balance.allocated) * 100 : 0;
        
        if (remaining <= 0) return 'Depleted';
        if (percentage <= 25) return 'Low Balance';
        if (balance.is_expiring_soon) return 'Expiring Soon';
        return 'Sufficient';
    };

    const formatBalance = (balance) => {
        const remaining = balance.allocated - balance.used;
        return `${remaining} / ${balance.allocated}`;
    };

    const formatPercentage = (balance) => {
        const remaining = balance.allocated - balance.used;
        const percentage = balance.allocated > 0 ? (remaining / balance.allocated) * 100 : 0;
        return `${Math.round(percentage)}%`;
    };

    // Data fetching
    const fetchBalances = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.leaves.balances.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
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
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.leaves.balances.stats'), {
                params: {
                    year: filters.year,
                    department_id: filters.department_id !== 'all' ? filters.department_id : undefined,
                    leave_type_id: filters.leave_type_id !== 'all' ? filters.leave_type_id : undefined
                }
            });
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch balance stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [filters.year, filters.department_id, filters.leave_type_id]);

    useEffect(() => {
        fetchBalances();
        fetchStats();
    }, [fetchBalances, fetchStats]);

    // CRUD operations
    const handleBalanceAdjustment = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.leaves.balances.adjust'), adjustmentData);
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
            loading: 'Adjusting balance...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleBulkAllocation = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.leaves.balances.bulk-allocate'), bulkAllocationData);
                if (response.status === 200) {
                    resolve([response.data.message || 'Bulk allocation completed successfully']);
                    fetchBalances();
                    fetchStats();
                    closeModal('bulk');
                    resetBulkForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to perform bulk allocation']);
            }
        });

        showToast.promise(promise, {
            loading: 'Processing bulk allocation...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, balance = null) => {
        setSelectedBalance(balance);
        if (type === 'adjust' && balance) {
            setAdjustmentData({
                employee_id: balance.employee_id,
                leave_type_id: balance.leave_type_id,
                adjustment_type: 'add',
                amount: '',
                reason: '',
                notes: '',
                effective_date: new Date().toISOString().split('T')[0]
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
            amount: '',
            reason: '',
            notes: '',
            effective_date: new Date().toISOString().split('T')[0]
        });
    };

    const resetBulkForm = () => {
        setBulkAllocationData({
            department_ids: [],
            leave_type_id: '',
            allocation_amount: '',
            effective_date: new Date().toISOString().split('T')[0],
            reset_existing: false,
            notes: ''
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'department', name: 'Department' },
        { uid: 'leave_type', name: 'Leave Type' },
        { uid: 'balance', name: 'Balance' },
        { uid: 'percentage', name: 'Usage' },
        { uid: 'expiry_date', name: 'Expiry Date' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((balance, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar 
                            src={balance.employee?.avatar} 
                            name={balance.employee?.name} 
                            size="sm"
                        />
                        <div>
                            <p className="font-medium">{balance.employee?.name}</p>
                            <p className="text-xs text-default-500">{balance.employee?.employee_id}</p>
                        </div>
                    </div>
                );
            case 'department':
                return balance.employee?.department?.name || 'N/A';
            case 'leave_type':
                return (
                    <div>
                        <p className="font-medium">{balance.leave_type?.name}</p>
                        <p className="text-xs text-default-500">
                            {balance.leave_type?.unit === 'days' ? 'Days' : 'Hours'}
                        </p>
                    </div>
                );
            case 'balance':
                return (
                    <div>
                        <p className="font-medium">{formatBalance(balance)}</p>
                        <p className="text-xs text-default-500">
                            Remaining: {balance.allocated - balance.used}
                        </p>
                    </div>
                );
            case 'percentage':
                const percentage = balance.allocated > 0 ? ((balance.allocated - balance.used) / balance.allocated) * 100 : 0;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-default-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all ${
                                    percentage > 50 ? 'bg-success' : 
                                    percentage > 25 ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ width: `${Math.max(0, percentage)}%` }}
                            />
                        </div>
                        <span className="text-xs">{Math.round(percentage)}%</span>
                    </div>
                );
            case 'expiry_date':
                return balance.expiry_date ? new Date(balance.expiry_date).toLocaleDateString() : 'No Expiry';
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(balance)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(balance)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        {canViewHistory && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => openModal('history', balance)}
                            >
                                <EyeIcon className="w-4 h-4" />
                            </Button>
                        )}
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
    }, [canViewHistory, canAdjustBalances]);

    return (
        <>
            <Head title={title} />
            
            {/* Balance Adjustment Modal */}
            {modalStates.adjust && (
                <Modal 
                    isOpen={modalStates.adjust} 
                    onOpenChange={() => closeModal('adjust')}
                    size="lg"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Adjust Leave Balance</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                {!selectedBalance && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label="Employee"
                                            placeholder="Select employee"
                                            selectedKeys={adjustmentData.employee_id ? [adjustmentData.employee_id] : []}
                                            onSelectionChange={(keys) => setAdjustmentData(prev => ({ ...prev, employee_id: Array.from(keys)[0] || '' }))}
                                            radius={themeRadius}
                                        >
                                            {employees.map(employee => (
                                                <SelectItem key={employee.id}>{employee.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Leave Type"
                                            placeholder="Select leave type"
                                            selectedKeys={adjustmentData.leave_type_id ? [adjustmentData.leave_type_id] : []}
                                            onSelectionChange={(keys) => setAdjustmentData(prev => ({ ...prev, leave_type_id: Array.from(keys)[0] || '' }))}
                                            radius={themeRadius}
                                        >
                                            {leaveTypes.map(type => (
                                                <SelectItem key={type.id}>{type.name}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Adjustment Type"
                                        selectedKeys={[adjustmentData.adjustment_type]}
                                        onSelectionChange={(keys) => setAdjustmentData(prev => ({ ...prev, adjustment_type: Array.from(keys)[0] }))}
                                        radius={themeRadius}
                                    >
                                        {adjustmentTypes.map(type => (
                                            <SelectItem key={type.key}>{type.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Input
                                        label="Amount"
                                        type="number"
                                        placeholder="Enter amount"
                                        value={adjustmentData.amount}
                                        onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, amount: value }))}
                                        radius={themeRadius}
                                    />
                                </div>

                                <Input
                                    label="Effective Date"
                                    type="date"
                                    value={adjustmentData.effective_date}
                                    onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, effective_date: value }))}
                                    radius={themeRadius}
                                />

                                <Select
                                    label="Reason"
                                    placeholder="Select reason"
                                    selectedKeys={adjustmentData.reason ? [adjustmentData.reason] : []}
                                    onSelectionChange={(keys) => setAdjustmentData(prev => ({ ...prev, reason: Array.from(keys)[0] || '' }))}
                                    radius={themeRadius}
                                >
                                    <SelectItem key="policy_change">Policy Change</SelectItem>
                                    <SelectItem key="error_correction">Error Correction</SelectItem>
                                    <SelectItem key="bonus_allocation">Bonus Allocation</SelectItem>
                                    <SelectItem key="carry_forward">Carry Forward</SelectItem>
                                    <SelectItem key="medical_emergency">Medical Emergency</SelectItem>
                                    <SelectItem key="special_approval">Special Approval</SelectItem>
                                    <SelectItem key="other">Other</SelectItem>
                                </Select>

                                <Textarea
                                    label="Notes"
                                    placeholder="Additional notes (optional)"
                                    value={adjustmentData.notes}
                                    onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, notes: value }))}
                                    radius={themeRadius}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('adjust')}>Cancel</Button>
                            <Button color="primary" onPress={handleBalanceAdjustment}>Adjust Balance</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Bulk Allocation Modal */}
            {modalStates.bulk && (
                <Modal 
                    isOpen={modalStates.bulk} 
                    onOpenChange={() => closeModal('bulk')}
                    size="lg"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Bulk Leave Allocation</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Select
                                    label="Departments"
                                    placeholder="Select departments"
                                    selectionMode="multiple"
                                    selectedKeys={bulkAllocationData.department_ids}
                                    onSelectionChange={(keys) => setBulkAllocationData(prev => ({ ...prev, department_ids: Array.from(keys) }))}
                                    radius={themeRadius}
                                >
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Leave Type"
                                    placeholder="Select leave type"
                                    selectedKeys={bulkAllocationData.leave_type_id ? [bulkAllocationData.leave_type_id] : []}
                                    onSelectionChange={(keys) => setBulkAllocationData(prev => ({ ...prev, leave_type_id: Array.from(keys)[0] || '' }))}
                                    radius={themeRadius}
                                >
                                    {leaveTypes.map(type => (
                                        <SelectItem key={type.id}>{type.name}</SelectItem>
                                    ))}
                                </Select>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Allocation Amount"
                                        type="number"
                                        placeholder="Enter amount"
                                        value={bulkAllocationData.allocation_amount}
                                        onValueChange={(value) => setBulkAllocationData(prev => ({ ...prev, allocation_amount: value }))}
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Effective Date"
                                        type="date"
                                        value={bulkAllocationData.effective_date}
                                        onValueChange={(value) => setBulkAllocationData(prev => ({ ...prev, effective_date: value }))}
                                        radius={themeRadius}
                                    />
                                </div>

                                <Switch
                                    isSelected={bulkAllocationData.reset_existing}
                                    onValueChange={(checked) => setBulkAllocationData(prev => ({ ...prev, reset_existing: checked }))}
                                >
                                    Reset existing balances before allocation
                                </Switch>

                                <Textarea
                                    label="Notes"
                                    placeholder="Additional notes (optional)"
                                    value={bulkAllocationData.notes}
                                    onValueChange={(value) => setBulkAllocationData(prev => ({ ...prev, notes: value }))}
                                    radius={themeRadius}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('bulk')}>Cancel</Button>
                            <Button color="primary" onPress={handleBulkAllocation}>Allocate</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Leave Balances Management">
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
                                                        Manage and track leave balances for all employees
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canBulkAllocate && (
                                                    <Button 
                                                        color="secondary" 
                                                        variant="flat"
                                                        startContent={<DocumentCheckIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('bulk')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Bulk Allocate
                                                    </Button>
                                                )}
                                                {canAdjustBalances && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('adjust')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Adjust Balance
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
                                            placeholder="Search employees..."
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
                                            label="Year"
                                            selectedKeys={[String(filters.year)]}
                                            onSelectionChange={(keys) => handleFilterChange('year', parseInt(Array.from(keys)[0]))}
                                        >
                                            {Array.from({ length: 5 }, (_, i) => {
                                                const year = new Date().getFullYear() - 2 + i;
                                                return (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                );
                                            })}
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
                                            emptyContent={loading ? "Loading..." : "No balance records found"}
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