import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    DocumentArrowUpIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    BanknotesIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const BankFile = ({ title, employees: initialEmployees = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
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
    const [bankFiles, setBankFiles] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [filters, setFilters] = useState({ search: '', payroll_run_id: '', status: '', bank: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        generated: 0, 
        processing: 0, 
        completed: 0,
        totalAmount: 0
    });
    const [modalStates, setModalStates] = useState({ generate: false, view: false, delete: false });
    const [selectedBankFile, setSelectedBankFile] = useState(null);
    const [formData, setFormData] = useState({
        payroll_run_id: '',
        bank_format: 'ACH',
        file_name: '',
        description: '',
        include_allowances: true,
        include_deductions: true,
        exclude_zero_amounts: true
    });

    // Permission checks
    const canGenerateFile = canCreate('hrm.payroll.bank-file') || isSuperAdmin();
    const canUpdateFile = canUpdate('hrm.payroll.bank-file') || isSuperAdmin();
    const canDeleteFile = canDelete('hrm.payroll.bank-file') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Files", 
            value: stats.total, 
            icon: <DocumentArrowUpIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Generated", 
            value: stats.generated, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Processing", 
            value: stats.processing, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Total Amount", 
            value: `$${stats.totalAmount.toLocaleString()}`, 
            icon: <BanknotesIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Bank file formats and statuses
    const bankFormats = [
        { key: 'ACH', label: 'ACH Format' },
        { key: 'NACHA', label: 'NACHA Format' },
        { key: 'MT940', label: 'MT940 Format' },
        { key: 'CSV', label: 'CSV Format' },
        { key: 'EXCEL', label: 'Excel Format' },
        { key: 'CUSTOM', label: 'Custom Format' },
    ];

    const fileStatuses = [
        { key: 'generated', label: 'Generated', color: 'success' },
        { key: 'processing', label: 'Processing', color: 'warning' },
        { key: 'completed', label: 'Completed', color: 'primary' },
        { key: 'failed', label: 'Failed', color: 'danger' },
        { key: 'cancelled', label: 'Cancelled', color: 'default' },
    ];

    const getStatusColor = (status) => {
        return fileStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return fileStatuses.find(s => s.key === status)?.label || status;
    };

    const getBankFormatLabel = (format) => {
        return bankFormats.find(f => f.key === format)?.label || format;
    };

    // Data fetching
    const fetchBankFiles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.bank-file.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setBankFiles(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch bank files'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.bank-file.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch bank file stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchPayrollRuns = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.payroll.runs.list'));
            if (response.status === 200) {
                setPayrollRuns(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch payroll runs:', error);
        }
    }, []);

    useEffect(() => {
        fetchBankFiles();
        fetchStats();
        fetchPayrollRuns();
    }, [fetchBankFiles, fetchStats, fetchPayrollRuns]);

    // Modal handlers
    const openModal = (type, bankFile = null) => {
        setSelectedBankFile(bankFile);
        if (type === 'generate') {
            setFormData({
                payroll_run_id: '',
                bank_format: 'ACH',
                file_name: '',
                description: '',
                include_allowances: true,
                include_deductions: true,
                exclude_zero_amounts: true
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedBankFile(null);
    };

    // Generate bank file
    const handleGenerate = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.payroll.bank-file.generate'), formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Bank file generated successfully']);
                    fetchBankFiles();
                    fetchStats();
                    closeModal('generate');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to generate bank file']);
            }
        });

        showToast.promise(promise, {
            loading: 'Generating bank file...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Download bank file
    const handleDownload = async (bankFileId) => {
        try {
            const response = await axios.get(route('hrm.payroll.bank-file.download', bankFileId), {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bank_file_${bankFileId}.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            showToast.promise(Promise.resolve(), {
                success: 'Bank file downloaded successfully'
            });
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to download bank file'
            });
        }
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.payroll.bank-file.destroy', selectedBankFile.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Bank file deleted successfully']);
                    fetchBankFiles();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete bank file']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting bank file...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Auto-generate file name based on payroll run and date
    useEffect(() => {
        if (formData.payroll_run_id) {
            const selectedRun = payrollRuns.find(run => run.id === formData.payroll_run_id);
            if (selectedRun) {
                const date = new Date().toISOString().split('T')[0];
                const fileName = `payroll_${selectedRun.period}_${date}.${formData.bank_format.toLowerCase()}`;
                setFormData(prev => ({ ...prev, file_name: fileName }));
            }
        }
    }, [formData.payroll_run_id, formData.bank_format, payrollRuns]);

    // Table columns
    const columns = [
        { uid: 'file_info', name: 'File Information' },
        { uid: 'payroll_run', name: 'Payroll Run' },
        { uid: 'format', name: 'Format' },
        { uid: 'amount', name: 'Total Amount' },
        { uid: 'employees', name: 'Employees' },
        { uid: 'generated_date', name: 'Generated Date' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'file_info':
                return (
                    <div>
                        <p className="font-medium">{item.file_name}</p>
                        {item.description && <p className="text-small text-default-500 truncate">{item.description}</p>}
                    </div>
                );
            case 'payroll_run':
                return (
                    <div>
                        <p className="font-medium">{item.payroll_run?.period || 'N/A'}</p>
                        <p className="text-small text-default-500">{item.payroll_run?.type || ''}</p>
                    </div>
                );
            case 'format':
                return getBankFormatLabel(item.bank_format);
            case 'amount':
                return `$${parseFloat(item.total_amount || 0).toLocaleString()}`;
            case 'employees':
                return item.employee_count || 0;
            case 'generated_date':
                return item.created_at ? new Date(item.created_at).toLocaleDateString() : '-';
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
                        {item.status === 'generated' && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                color="primary"
                                onPress={() => handleDownload(item.id)}
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteFile && (
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
    }, [canDeleteFile]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {modalStates.generate && (
                <Modal 
                    isOpen={modalStates.generate} 
                    onOpenChange={() => closeModal('generate')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Generate Bank File</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Select
                                    label="Payroll Run"
                                    placeholder="Select payroll run"
                                    selectedKeys={formData.payroll_run_id ? [formData.payroll_run_id] : []}
                                    onSelectionChange={(keys) => setFormData(prev => ({ ...prev, payroll_run_id: Array.from(keys)[0] || '' }))}
                                    isRequired
                                    radius={getThemeRadius()}
                                >
                                    {payrollRuns.map(run => (
                                        <SelectItem key={run.id} value={run.id}>
                                            {run.period} - {run.type}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Bank Format"
                                        placeholder="Select format"
                                        selectedKeys={formData.bank_format ? [formData.bank_format] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, bank_format: Array.from(keys)[0] || 'ACH' }))}
                                        isRequired
                                        radius={getThemeRadius()}
                                    >
                                        {bankFormats.map(format => (
                                            <SelectItem key={format.key}>{format.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Input
                                        label="File Name"
                                        placeholder="Auto-generated"
                                        value={formData.file_name}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, file_name: value }))}
                                        radius={getThemeRadius()}
                                    />
                                </div>

                                <Textarea
                                    label="Description"
                                    placeholder="Enter description"
                                    value={formData.description}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                    rows={2}
                                    radius={getThemeRadius()}
                                />

                                <div>
                                    <label className="text-sm font-medium text-default-600 mb-3 block">
                                        Include Options
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.include_allowances}
                                                onChange={(e) => setFormData(prev => ({ ...prev, include_allowances: e.target.checked }))}
                                            />
                                            <span className="text-sm">Include Allowances</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.include_deductions}
                                                onChange={(e) => setFormData(prev => ({ ...prev, include_deductions: e.target.checked }))}
                                            />
                                            <span className="text-sm">Include Deductions</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.exclude_zero_amounts}
                                                onChange={(e) => setFormData(prev => ({ ...prev, exclude_zero_amounts: e.target.checked }))}
                                            />
                                            <span className="text-sm">Exclude Zero Amounts</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('generate')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleGenerate}>
                                Generate File
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedBankFile && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Bank File Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-default-600">File Name</label>
                                    <p className="text-default-900 font-medium">{selectedBankFile.file_name}</p>
                                    {selectedBankFile.description && (
                                        <p className="text-small text-default-500 mt-1">{selectedBankFile.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Payroll Run</label>
                                        <p className="text-default-900">{selectedBankFile.payroll_run?.period || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Format</label>
                                        <p className="text-default-900">{getBankFormatLabel(selectedBankFile.bank_format)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Total Amount</label>
                                        <p className="text-default-900 font-medium text-lg">
                                            ${parseFloat(selectedBankFile.total_amount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Employee Count</label>
                                        <p className="text-default-900">{selectedBankFile.employee_count || 0} employees</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Generated Date</label>
                                        <p className="text-default-900">
                                            {selectedBankFile.created_at 
                                                ? new Date(selectedBankFile.created_at).toLocaleDateString() 
                                                : 'Not available'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Status</label>
                                        <Chip 
                                            color={getStatusColor(selectedBankFile.status)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStatusLabel(selectedBankFile.status)}
                                        </Chip>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600">Configuration</label>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {selectedBankFile.include_allowances && <Chip size="sm" variant="flat" color="success">Allowances</Chip>}
                                        {selectedBankFile.include_deductions && <Chip size="sm" variant="flat" color="warning">Deductions</Chip>}
                                        {selectedBankFile.exclude_zero_amounts && <Chip size="sm" variant="flat" color="primary">No Zero Amounts</Chip>}
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                            {selectedBankFile.status === 'generated' && (
                                <Button 
                                    color="primary" 
                                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                    onPress={() => handleDownload(selectedBankFile.id)}
                                >
                                    Download
                                </Button>
                            )}
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedBankFile && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Bank File</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the bank file "<strong>{selectedBankFile.file_name}</strong>"?</p>
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
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Bank File Generator">
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
                                                    <DocumentArrowUpIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Bank File Generator
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Generate bank transfer files for payroll processing
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canGenerateFile && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('generate')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Generate File
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
                                            placeholder="Search bank files..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Select
                                            placeholder="All Payroll Runs"
                                            selectedKeys={filters.payroll_run_id ? [filters.payroll_run_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('payroll_run_id', Array.from(keys)[0] || '')}
                                        >
                                            {payrollRuns.map(run => (
                                                <SelectItem key={run.id}>{run.period}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {fileStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Bank Files" 
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
                                            items={bankFiles} 
                                            emptyContent={loading ? "Loading..." : "No bank files found"}
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

BankFile.layout = (page) => <App children={page} />;
export default BankFile;