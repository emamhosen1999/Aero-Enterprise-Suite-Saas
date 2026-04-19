import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { 
    BanknotesIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    CreditCardIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Loans = ({ title, employees: initialEmployees = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
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
    const [loans, setLoans] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees);
    const [filters, setFilters] = useState({ search: '', employee_id: '', status: '', loan_type: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        approved: 0, 
        pending: 0, 
        totalAmount: 0,
        outstandingAmount: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false });
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        loan_type: 'advance_salary',
        amount: '',
        interest_rate: '0',
        tenure_months: '12',
        start_date: '',
        reason: '',
        status: 'pending',
        monthly_deduction: '',
        guarantor_name: '',
        guarantor_contact: ''
    });

    // Permission checks
    const canCreateLoan = canCreate('hrm.payroll.loans') || isSuperAdmin();
    const canUpdateLoan = canUpdate('hrm.payroll.loans') || isSuperAdmin();
    const canDeleteLoan = canDelete('hrm.payroll.loans') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Loans", 
            value: stats.total, 
            icon: <BanknotesIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Approved", 
            value: stats.approved, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Pending", 
            value: stats.pending, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Outstanding", 
            value: `$${stats.outstandingAmount.toLocaleString()}`, 
            icon: <CreditCardIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Loan types and statuses
    const loanTypes = [
        { key: 'advance_salary', label: 'Advance Salary' },
        { key: 'personal', label: 'Personal Loan' },
        { key: 'emergency', label: 'Emergency Loan' },
        { key: 'education', label: 'Education Loan' },
        { key: 'housing', label: 'Housing Loan' },
        { key: 'vehicle', label: 'Vehicle Loan' },
    ];

    const loanStatuses = [
        { key: 'pending', label: 'Pending', color: 'warning' },
        { key: 'approved', label: 'Approved', color: 'success' },
        { key: 'rejected', label: 'Rejected', color: 'danger' },
        { key: 'active', label: 'Active', color: 'primary' },
        { key: 'completed', label: 'Completed', color: 'default' },
        { key: 'defaulted', label: 'Defaulted', color: 'danger' },
    ];

    const getStatusColor = (status) => {
        return loanStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return loanStatuses.find(s => s.key === status)?.label || status;
    };

    const getLoanTypeLabel = (type) => {
        return loanTypes.find(t => t.key === type)?.label || type;
    };

    // Data fetching
    const fetchLoans = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.loans.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setLoans(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch loans'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.loans.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch loan stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLoans();
        fetchStats();
    }, [fetchLoans, fetchStats]);

    // Modal handlers
    const openModal = (type, loan = null) => {
        setSelectedLoan(loan);
        if (loan) {
            setFormData({
                employee_id: loan.employee_id || '',
                loan_type: loan.loan_type || 'advance_salary',
                amount: loan.amount || '',
                interest_rate: loan.interest_rate || '0',
                tenure_months: loan.tenure_months || '12',
                start_date: loan.start_date || '',
                reason: loan.reason || '',
                status: loan.status || 'pending',
                monthly_deduction: loan.monthly_deduction || '',
                guarantor_name: loan.guarantor_name || '',
                guarantor_contact: loan.guarantor_contact || ''
            });
        } else {
            setFormData({
                employee_id: '',
                loan_type: 'advance_salary',
                amount: '',
                interest_rate: '0',
                tenure_months: '12',
                start_date: '',
                reason: '',
                status: 'pending',
                monthly_deduction: '',
                guarantor_name: '',
                guarantor_contact: ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedLoan(null);
    };

    // Calculate monthly deduction when amount or tenure changes
    useEffect(() => {
        if (formData.amount && formData.tenure_months) {
            const amount = parseFloat(formData.amount);
            const months = parseInt(formData.tenure_months);
            const interestRate = parseFloat(formData.interest_rate) / 100;
            
            if (!isNaN(amount) && !isNaN(months) && months > 0) {
                let monthlyAmount;
                if (interestRate > 0) {
                    // Calculate with interest using simple interest formula
                    const totalAmount = amount * (1 + (interestRate * months / 12));
                    monthlyAmount = totalAmount / months;
                } else {
                    // No interest calculation
                    monthlyAmount = amount / months;
                }
                setFormData(prev => ({ 
                    ...prev, 
                    monthly_deduction: monthlyAmount.toFixed(2) 
                }));
            }
        }
    }, [formData.amount, formData.tenure_months, formData.interest_rate]);

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedLoan 
                    ? route('hrm.payroll.loans.update', selectedLoan.id)
                    : route('hrm.payroll.loans.store');
                
                const method = selectedLoan ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Loan ${selectedLoan ? 'updated' : 'created'} successfully`]);
                    fetchLoans();
                    fetchStats();
                    closeModal(selectedLoan ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedLoan ? 'update' : 'create'} loan`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedLoan ? 'Updating' : 'Creating'} loan...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.payroll.loans.destroy', selectedLoan.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Loan deleted successfully']);
                    fetchLoans();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete loan']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting loan...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
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
        { uid: 'loan_type', name: 'Loan Type' },
        { uid: 'amount', name: 'Amount' },
        { uid: 'monthly_deduction', name: 'Monthly Deduction' },
        { uid: 'tenure', name: 'Tenure' },
        { uid: 'start_date', name: 'Start Date' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div>
                        <p className="font-medium">{item.employee?.name || 'N/A'}</p>
                        <p className="text-small text-default-500">{item.employee?.employee_id || 'N/A'}</p>
                    </div>
                );
            case 'loan_type':
                return getLoanTypeLabel(item.loan_type);
            case 'amount':
                return `$${parseFloat(item.amount || 0).toLocaleString()}`;
            case 'monthly_deduction':
                return `$${parseFloat(item.monthly_deduction || 0).toFixed(2)}`;
            case 'tenure':
                return `${item.tenure_months} months`;
            case 'start_date':
                return item.start_date ? new Date(item.start_date).toLocaleDateString() : '-';
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(item.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(item.status)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex gap-1">
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light"
                            onPress={() => openModal('view', item)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canUpdateLoan && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteLoan && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light" 
                                color="danger"
                                onPress={() => openModal('delete', item)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return item[columnKey] || '-';
        }
    }, [canUpdateLoan, canDeleteLoan]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="3xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedLoan ? 'Edit Loan' : 'Create New Loan'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Employee"
                                        placeholder="Select employee"
                                        selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, employee_id: Array.from(keys)[0] || '' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {employees.map(employee => (
                                            <SelectItem key={employee.id} value={employee.id}>
                                                {employee.name} ({employee.employee_id})
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Loan Type"
                                        placeholder="Select loan type"
                                        selectedKeys={formData.loan_type ? [formData.loan_type] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, loan_type: Array.from(keys)[0] || 'advance_salary' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {loanTypes.map(type => (
                                            <SelectItem key={type.key}>{type.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        label="Loan Amount"
                                        placeholder="Enter amount"
                                        value={formData.amount}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                                        startContent="$"
                                        type="number"
                                        isRequired
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Interest Rate (%)"
                                        placeholder="0"
                                        value={formData.interest_rate}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, interest_rate: value }))}
                                        endContent="%"
                                        type="number"
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Tenure (Months)"
                                        placeholder="12"
                                        value={formData.tenure_months}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, tenure_months: value }))}
                                        type="number"
                                        isRequired
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="date"
                                        label="Start Date"
                                        value={formData.start_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                                        isRequired
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Monthly Deduction"
                                        value={formData.monthly_deduction}
                                        startContent="$"
                                        isReadOnly
                                        description="Auto-calculated based on amount and tenure"
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Guarantor Name"
                                        placeholder="Enter guarantor name"
                                        value={formData.guarantor_name}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, guarantor_name: value }))}
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Guarantor Contact"
                                        placeholder="Enter phone/email"
                                        value={formData.guarantor_contact}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, guarantor_contact: value }))}
                                        radius={themeRadius}
                                    />
                                </div>

                                <Input
                                    label="Reason for Loan"
                                    placeholder="Enter reason"
                                    value={formData.reason}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                                    isRequired
                                    radius={themeRadius}
                                />

                                <Select
                                    label="Status"
                                    placeholder="Select status"
                                    selectedKeys={formData.status ? [formData.status] : []}
                                    onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] || 'pending' }))}
                                    radius={themeRadius}
                                >
                                    {loanStatuses.map(status => (
                                        <SelectItem key={status.key}>{status.label}</SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedLoan ? 'Update' : 'Create'} Loan
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedLoan && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Loan Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Employee</label>
                                        <p className="text-default-900 font-medium">
                                            {selectedLoan.employee?.name} ({selectedLoan.employee?.employee_id})
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Loan Type</label>
                                        <p className="text-default-900">{getLoanTypeLabel(selectedLoan.loan_type)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Amount</label>
                                        <p className="text-default-900 font-medium text-lg">
                                            ${parseFloat(selectedLoan.amount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Interest Rate</label>
                                        <p className="text-default-900">{selectedLoan.interest_rate || 0}%</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Monthly Deduction</label>
                                        <p className="text-default-900 font-medium">
                                            ${parseFloat(selectedLoan.monthly_deduction || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Tenure</label>
                                        <p className="text-default-900">{selectedLoan.tenure_months} months</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Start Date</label>
                                        <p className="text-default-900">
                                            {selectedLoan.start_date ? new Date(selectedLoan.start_date).toLocaleDateString() : 'Not set'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600">Status</label>
                                    <Chip 
                                        color={getStatusColor(selectedLoan.status)} 
                                        size="sm" 
                                        variant="flat"
                                        className="mt-1"
                                    >
                                        {getStatusLabel(selectedLoan.status)}
                                    </Chip>
                                </div>

                                {(selectedLoan.guarantor_name || selectedLoan.guarantor_contact) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedLoan.guarantor_name && (
                                            <div>
                                                <label className="text-sm font-medium text-default-600">Guarantor</label>
                                                <p className="text-default-900">{selectedLoan.guarantor_name}</p>
                                            </div>
                                        )}
                                        {selectedLoan.guarantor_contact && (
                                            <div>
                                                <label className="text-sm font-medium text-default-600">Guarantor Contact</label>
                                                <p className="text-default-900">{selectedLoan.guarantor_contact}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedLoan.reason && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Reason</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedLoan.reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedLoan && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Loan</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete this loan for "<strong>{selectedLoan.employee?.name}</strong>"?</p>
                            <p className="text-sm text-default-500">This action cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Loans Management">
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
                                                    <BanknotesIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Employee Loans
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee loan applications and repayments
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateLoan && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Loan
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
                                            placeholder="Search loans..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Employees"
                                            selectedKeys={filters.employee_id ? [filters.employee_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('employee_id', Array.from(keys)[0] || '')}
                                        >
                                            {employees.map(employee => (
                                                <SelectItem key={employee.id}>{employee.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Types"
                                            selectedKeys={filters.loan_type ? [filters.loan_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('loan_type', Array.from(keys)[0] || '')}
                                        >
                                            {loanTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {loanStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Employee Loans" 
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
                                            items={loans} 
                                            emptyContent={loading ? "Loading..." : "No loans found"}
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

Loans.layout = (page) => <App children={page} />;
export default Loans;