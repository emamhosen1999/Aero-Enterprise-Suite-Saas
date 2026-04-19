import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    DocumentTextIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    DocumentCheckIcon,
    ArrowUpTrayIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const TaxDeclarations = ({ title, employees: initialEmployees = [], taxYears: initialTaxYears = [] }) => {
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
    const [declarations, setDeclarations] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees);
    const [taxYears, setTaxYears] = useState(initialTaxYears);
    const [filters, setFilters] = useState({ search: '', employee_id: '', status: '', tax_year: '', declaration_type: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        submitted: 0, 
        pending: 0, 
        approved: 0,
        rejected: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false, upload: false });
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        tax_year: new Date().getFullYear(),
        declaration_type: 'investment',
        amount: '',
        description: '',
        category: '',
        proof_document: null,
        status: 'draft',
        remarks: ''
    });

    // Permission checks
    const canCreateDeclaration = canCreate('hrm.payroll.tax-declarations') || isSuperAdmin();
    const canUpdateDeclaration = canUpdate('hrm.payroll.tax-declarations') || isSuperAdmin();
    const canDeleteDeclaration = canDelete('hrm.payroll.tax-declarations') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Declarations", 
            value: stats.total, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Submitted", 
            value: stats.submitted, 
            icon: <ArrowUpTrayIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
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
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Tax declaration configuration
    const declarationTypes = [
        { key: 'investment', label: '80C - Investments' },
        { key: 'insurance', label: '80D - Medical Insurance' },
        { key: 'education', label: '80E - Education Loan' },
        { key: 'donation', label: '80G - Donations' },
        { key: 'nps', label: '80CCD - NPS' },
        { key: 'housing', label: '24B - Housing Loan' },
        { key: 'other', label: 'Other Deductions' },
    ];

    const categories = [
        { key: 'ppf', label: 'PPF' },
        { key: 'elss', label: 'ELSS' },
        { key: 'nsc', label: 'NSC' },
        { key: 'tax_saver_fd', label: 'Tax Saver FD' },
        { key: 'life_insurance', label: 'Life Insurance' },
        { key: 'health_insurance', label: 'Health Insurance' },
        { key: 'home_loan', label: 'Home Loan' },
        { key: 'tuition_fee', label: 'Tuition Fee' },
        { key: 'charity', label: 'Charitable Donations' },
    ];

    const declarationStatuses = [
        { key: 'draft', label: 'Draft', color: 'default' },
        { key: 'submitted', label: 'Submitted', color: 'warning' },
        { key: 'under_review', label: 'Under Review', color: 'primary' },
        { key: 'approved', label: 'Approved', color: 'success' },
        { key: 'rejected', label: 'Rejected', color: 'danger' },
        { key: 'revision_required', label: 'Revision Required', color: 'warning' },
    ];

    const getStatusColor = (status) => {
        return declarationStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return declarationStatuses.find(s => s.key === status)?.label || status;
    };

    const getDeclarationTypeLabel = (type) => {
        return declarationTypes.find(t => t.key === type)?.label || type;
    };

    const getCategoryLabel = (category) => {
        return categories.find(c => c.key === category)?.label || category;
    };

    // Data fetching
    const fetchDeclarations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.tax-declarations.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setDeclarations(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch tax declarations'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.tax-declarations.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch declaration stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeclarations();
        fetchStats();
    }, [fetchDeclarations, fetchStats]);

    // Modal handlers
    const openModal = (type, declaration = null) => {
        setSelectedDeclaration(declaration);
        if (declaration) {
            setFormData({
                employee_id: declaration.employee_id || '',
                tax_year: declaration.tax_year || new Date().getFullYear(),
                declaration_type: declaration.declaration_type || 'investment',
                amount: declaration.amount || '',
                description: declaration.description || '',
                category: declaration.category || '',
                proof_document: null,
                status: declaration.status || 'draft',
                remarks: declaration.remarks || ''
            });
        } else {
            setFormData({
                employee_id: auth.user?.employee?.id || '',
                tax_year: new Date().getFullYear(),
                declaration_type: 'investment',
                amount: '',
                description: '',
                category: '',
                proof_document: null,
                status: 'draft',
                remarks: ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedDeclaration(null);
    };

    // File upload handler
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, proof_document: file }));
        }
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const formDataToSubmit = new FormData();
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== null && formData[key] !== '') {
                        formDataToSubmit.append(key, formData[key]);
                    }
                });

                const endpoint = selectedDeclaration 
                    ? route('hrm.payroll.tax-declarations.update', selectedDeclaration.id)
                    : route('hrm.payroll.tax-declarations.store');
                
                const method = selectedDeclaration ? 'POST' : 'POST';
                if (selectedDeclaration) {
                    formDataToSubmit.append('_method', 'PUT');
                }

                const response = await axios.post(endpoint, formDataToSubmit, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Tax declaration ${selectedDeclaration ? 'updated' : 'submitted'} successfully`]);
                    fetchDeclarations();
                    fetchStats();
                    closeModal(selectedDeclaration ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedDeclaration ? 'update' : 'submit'} tax declaration`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedDeclaration ? 'Updating' : 'Submitting'} tax declaration...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.payroll.tax-declarations.destroy', selectedDeclaration.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Tax declaration deleted successfully']);
                    fetchDeclarations();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete tax declaration']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting tax declaration...',
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
        { uid: 'tax_year', name: 'Tax Year' },
        { uid: 'type_category', name: 'Type & Category' },
        { uid: 'amount', name: 'Amount' },
        { uid: 'description', name: 'Description' },
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
            case 'tax_year':
                return item.tax_year;
            case 'type_category':
                return (
                    <div>
                        <p className="font-medium">{getDeclarationTypeLabel(item.declaration_type)}</p>
                        {item.category && <p className="text-small text-default-500">{getCategoryLabel(item.category)}</p>}
                    </div>
                );
            case 'amount':
                return `₹${parseFloat(item.amount || 0).toLocaleString()}`;
            case 'description':
                return item.description ? (item.description.length > 50 ? item.description.slice(0, 50) + '...' : item.description) : '-';
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
                        {canUpdateDeclaration && (item.status === 'draft' || item.status === 'revision_required') && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteDeclaration && item.status === 'draft' && (
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
    }, [canUpdateDeclaration, canDeleteDeclaration]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedDeclaration ? 'Edit Tax Declaration' : 'Add Tax Declaration'}
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

                                    <Input
                                        label="Tax Year"
                                        placeholder="2024"
                                        value={formData.tax_year}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, tax_year: value }))}
                                        type="number"
                                        isRequired
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Declaration Type"
                                        placeholder="Select type"
                                        selectedKeys={formData.declaration_type ? [formData.declaration_type] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, declaration_type: Array.from(keys)[0] || 'investment' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {declarationTypes.map(type => (
                                            <SelectItem key={type.key}>{type.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Category"
                                        placeholder="Select category"
                                        selectedKeys={formData.category ? [formData.category] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, category: Array.from(keys)[0] || '' }))}
                                        radius={themeRadius}
                                    >
                                        {categories.map(category => (
                                            <SelectItem key={category.key}>{category.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <Input
                                    label="Amount"
                                    placeholder="Enter amount"
                                    value={formData.amount}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                                    startContent="₹"
                                    type="number"
                                    isRequired
                                    radius={themeRadius}
                                />

                                <Textarea
                                    label="Description"
                                    placeholder="Enter description"
                                    value={formData.description}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                    rows={3}
                                    radius={themeRadius}
                                />

                                <div>
                                    <label className="text-sm font-medium text-default-600 mb-2 block">
                                        Proof Document (PDF, JPG, PNG)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    />
                                </div>

                                <Select
                                    label="Status"
                                    placeholder="Select status"
                                    selectedKeys={formData.status ? [formData.status] : []}
                                    onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] || 'draft' }))}
                                    radius={themeRadius}
                                >
                                    {declarationStatuses.map(status => (
                                        <SelectItem key={status.key}>{status.label}</SelectItem>
                                    ))}
                                </Select>

                                <Textarea
                                    label="Remarks"
                                    placeholder="Enter any remarks"
                                    value={formData.remarks}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, remarks: value }))}
                                    rows={2}
                                    radius={themeRadius}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedDeclaration ? 'Update' : 'Submit'} Declaration
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedDeclaration && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Tax Declaration Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Employee</label>
                                        <p className="text-default-900 font-medium">
                                            {selectedDeclaration.employee?.name} ({selectedDeclaration.employee?.employee_id})
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Tax Year</label>
                                        <p className="text-default-900">{selectedDeclaration.tax_year}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Declaration Type</label>
                                        <p className="text-default-900">{getDeclarationTypeLabel(selectedDeclaration.declaration_type)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Category</label>
                                        <p className="text-default-900">{getCategoryLabel(selectedDeclaration.category)}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-default-600">Amount</label>
                                    <p className="text-default-900 font-medium text-lg">
                                        ₹{parseFloat(selectedDeclaration.amount || 0).toLocaleString()}
                                    </p>
                                </div>

                                {selectedDeclaration.description && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Description</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedDeclaration.description}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-default-600">Status</label>
                                    <Chip 
                                        color={getStatusColor(selectedDeclaration.status)} 
                                        size="sm" 
                                        variant="flat"
                                        className="mt-1"
                                    >
                                        {getStatusLabel(selectedDeclaration.status)}
                                    </Chip>
                                </div>

                                {selectedDeclaration.remarks && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Remarks</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedDeclaration.remarks}
                                        </p>
                                    </div>
                                )}

                                {selectedDeclaration.proof_document_path && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Proof Document</label>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            className="mt-1"
                                            startContent={<DocumentCheckIcon className="w-4 h-4" />}
                                        >
                                            View Document
                                        </Button>
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

            {modalStates.delete && selectedDeclaration && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Tax Declaration</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete this tax declaration?</p>
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
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Tax Declarations Management">
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
                                                        Tax Declarations
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee tax saving declarations
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateDeclaration && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Declaration
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
                                            placeholder="Search declarations..."
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
                                            selectedKeys={filters.declaration_type ? [filters.declaration_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('declaration_type', Array.from(keys)[0] || '')}
                                        >
                                            {declarationTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {declarationStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Tax Declarations" 
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
                                            items={declarations} 
                                            emptyContent={loading ? "Loading..." : "No tax declarations found"}
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

TaxDeclarations.layout = (page) => <App children={page} />;
export default TaxDeclarations;