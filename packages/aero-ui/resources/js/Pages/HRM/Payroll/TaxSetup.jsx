import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { 
    DocumentIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    FunnelIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const TaxSetup = ({ title, employees: initialEmployees = [] }) => {
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
    const [taxRules, setTaxRules] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees);
    const [filters, setFilters] = useState({ search: '', tax_type: '', status: '', country: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        active: 0, 
        inactive: 0, 
        federal: 0,
        state: 0,
        local: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false });
    const [selectedTaxRule, setSelectedTaxRule] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        tax_type: 'income',
        tax_category: 'federal',
        country: 'US',
        state: '',
        min_income: '',
        max_income: '',
        tax_rate: '',
        flat_amount: '',
        calculation_method: 'percentage',
        effective_date: '',
        status: 'active',
        description: ''
    });

    // Permission checks
    const canCreateTax = canCreate('hrm.payroll.tax-setup') || isSuperAdmin();
    const canUpdateTax = canUpdate('hrm.payroll.tax-setup') || isSuperAdmin();
    const canDeleteTax = canDelete('hrm.payroll.tax-setup') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Rules", 
            value: stats.total, 
            icon: <DocumentIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active", 
            value: stats.active, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Federal", 
            value: stats.federal, 
            icon: <FunnelIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "State", 
            value: stats.state, 
            icon: <FunnelIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Tax configuration options
    const taxTypes = [
        { key: 'income', label: 'Income Tax' },
        { key: 'social_security', label: 'Social Security' },
        { key: 'medicare', label: 'Medicare' },
        { key: 'unemployment', label: 'Unemployment' },
        { key: 'disability', label: 'Disability' },
        { key: 'other', label: 'Other' },
    ];

    const taxCategories = [
        { key: 'federal', label: 'Federal' },
        { key: 'state', label: 'State' },
        { key: 'local', label: 'Local' },
        { key: 'municipal', label: 'Municipal' },
    ];

    const calculationMethods = [
        { key: 'percentage', label: 'Percentage' },
        { key: 'flat_rate', label: 'Flat Rate' },
        { key: 'progressive', label: 'Progressive' },
        { key: 'bracket', label: 'Tax Bracket' },
    ];

    const taxStatuses = [
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'inactive', label: 'Inactive', color: 'default' },
        { key: 'draft', label: 'Draft', color: 'warning' },
    ];

    const usStates = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
        'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
        'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
        'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
        'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
        'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ];

    const getStatusColor = (status) => {
        return taxStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return taxStatuses.find(s => s.key === status)?.label || status;
    };

    const getTaxTypeLabel = (type) => {
        return taxTypes.find(t => t.key === type)?.label || type;
    };

    const getTaxCategoryLabel = (category) => {
        return taxCategories.find(c => c.key === category)?.label || category;
    };

    // Data fetching
    const fetchTaxRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.tax-setup.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setTaxRules(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch tax rules'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.payroll.tax-setup.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch tax stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTaxRules();
        fetchStats();
    }, [fetchTaxRules, fetchStats]);

    // Modal handlers
    const openModal = (type, taxRule = null) => {
        setSelectedTaxRule(taxRule);
        if (taxRule) {
            setFormData({
                name: taxRule.name || '',
                tax_type: taxRule.tax_type || 'income',
                tax_category: taxRule.tax_category || 'federal',
                country: taxRule.country || 'US',
                state: taxRule.state || '',
                min_income: taxRule.min_income || '',
                max_income: taxRule.max_income || '',
                tax_rate: taxRule.tax_rate || '',
                flat_amount: taxRule.flat_amount || '',
                calculation_method: taxRule.calculation_method || 'percentage',
                effective_date: taxRule.effective_date || '',
                status: taxRule.status || 'active',
                description: taxRule.description || ''
            });
        } else {
            setFormData({
                name: '',
                tax_type: 'income',
                tax_category: 'federal',
                country: 'US',
                state: '',
                min_income: '',
                max_income: '',
                tax_rate: '',
                flat_amount: '',
                calculation_method: 'percentage',
                effective_date: '',
                status: 'active',
                description: ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedTaxRule(null);
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedTaxRule 
                    ? route('hrm.payroll.tax-setup.update', selectedTaxRule.id)
                    : route('hrm.payroll.tax-setup.store');
                
                const method = selectedTaxRule ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Tax rule ${selectedTaxRule ? 'updated' : 'created'} successfully`]);
                    fetchTaxRules();
                    fetchStats();
                    closeModal(selectedTaxRule ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedTaxRule ? 'update' : 'create'} tax rule`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedTaxRule ? 'Updating' : 'Creating'} tax rule...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.payroll.tax-setup.destroy', selectedTaxRule.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Tax rule deleted successfully']);
                    fetchTaxRules();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete tax rule']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting tax rule...',
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
        { uid: 'name', name: 'Tax Rule Name' },
        { uid: 'type_category', name: 'Type & Category' },
        { uid: 'jurisdiction', name: 'Jurisdiction' },
        { uid: 'rate_amount', name: 'Rate/Amount' },
        { uid: 'income_range', name: 'Income Range' },
        { uid: 'effective_date', name: 'Effective Date' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-small text-default-500 truncate">{item.description}</p>}
                    </div>
                );
            case 'type_category':
                return (
                    <div>
                        <p className="font-medium">{getTaxTypeLabel(item.tax_type)}</p>
                        <p className="text-small text-default-500">{getTaxCategoryLabel(item.tax_category)}</p>
                    </div>
                );
            case 'jurisdiction':
                return (
                    <div>
                        <p className="font-medium">{item.country || 'US'}</p>
                        {item.state && <p className="text-small text-default-500">{item.state}</p>}
                    </div>
                );
            case 'rate_amount':
                return (
                    <div>
                        {item.tax_rate && <p className="font-medium">{item.tax_rate}%</p>}
                        {item.flat_amount && <p className="text-small text-default-500">${item.flat_amount}</p>}
                        <p className="text-tiny text-default-400">{item.calculation_method}</p>
                    </div>
                );
            case 'income_range':
                return (
                    <div>
                        {item.min_income && (
                            <p className="text-small">Min: ${parseFloat(item.min_income).toLocaleString()}</p>
                        )}
                        {item.max_income && (
                            <p className="text-small">Max: ${parseFloat(item.max_income).toLocaleString()}</p>
                        )}
                        {!item.min_income && !item.max_income && <span className="text-default-400">No limit</span>}
                    </div>
                );
            case 'effective_date':
                return item.effective_date ? new Date(item.effective_date).toLocaleDateString() : '-';
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
                        {canUpdateTax && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteTax && (
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
    }, [canUpdateTax, canDeleteTax]);

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
                                {selectedTaxRule ? 'Edit Tax Rule' : 'Create Tax Rule'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Input
                                    label="Tax Rule Name"
                                    placeholder="Enter tax rule name"
                                    value={formData.name}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                                    isRequired
                                    radius={themeRadius}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Select
                                        label="Tax Type"
                                        placeholder="Select tax type"
                                        selectedKeys={formData.tax_type ? [formData.tax_type] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, tax_type: Array.from(keys)[0] || 'income' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {taxTypes.map(type => (
                                            <SelectItem key={type.key}>{type.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Category"
                                        placeholder="Select category"
                                        selectedKeys={formData.tax_category ? [formData.tax_category] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, tax_category: Array.from(keys)[0] || 'federal' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {taxCategories.map(category => (
                                            <SelectItem key={category.key}>{category.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Calculation Method"
                                        placeholder="Select method"
                                        selectedKeys={formData.calculation_method ? [formData.calculation_method] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, calculation_method: Array.from(keys)[0] || 'percentage' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {calculationMethods.map(method => (
                                            <SelectItem key={method.key}>{method.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Country"
                                        placeholder="US"
                                        value={formData.country}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                                        isRequired
                                        radius={themeRadius}
                                    />

                                    <Select
                                        label="State (if applicable)"
                                        placeholder="Select state"
                                        selectedKeys={formData.state ? [formData.state] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, state: Array.from(keys)[0] || '' }))}
                                        radius={themeRadius}
                                    >
                                        {usStates.map(state => (
                                            <SelectItem key={state}>{state}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Tax Rate (%)"
                                        placeholder="0.00"
                                        value={formData.tax_rate}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, tax_rate: value }))}
                                        type="number"
                                        step="0.01"
                                        endContent="%"
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Flat Amount ($)"
                                        placeholder="0.00"
                                        value={formData.flat_amount}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, flat_amount: value }))}
                                        type="number"
                                        step="0.01"
                                        startContent="$"
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Minimum Income"
                                        placeholder="0.00"
                                        value={formData.min_income}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, min_income: value }))}
                                        type="number"
                                        step="0.01"
                                        startContent="$"
                                        radius={themeRadius}
                                    />

                                    <Input
                                        label="Maximum Income"
                                        placeholder="No limit"
                                        value={formData.max_income}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, max_income: value }))}
                                        type="number"
                                        step="0.01"
                                        startContent="$"
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="date"
                                        label="Effective Date"
                                        value={formData.effective_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, effective_date: value }))}
                                        isRequired
                                        radius={themeRadius}
                                    />

                                    <Select
                                        label="Status"
                                        placeholder="Select status"
                                        selectedKeys={formData.status ? [formData.status] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] || 'active' }))}
                                        radius={themeRadius}
                                    >
                                        {taxStatuses.map(status => (
                                            <SelectItem key={status.key}>{status.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <Input
                                    label="Description"
                                    placeholder="Enter description"
                                    value={formData.description}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                    radius={themeRadius}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedTaxRule ? 'Update' : 'Create'} Tax Rule
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedTaxRule && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Tax Rule Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-default-600">Tax Rule Name</label>
                                    <p className="text-default-900 font-medium">{selectedTaxRule.name}</p>
                                    {selectedTaxRule.description && (
                                        <p className="text-small text-default-500 mt-1">{selectedTaxRule.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Tax Type</label>
                                        <p className="text-default-900">{getTaxTypeLabel(selectedTaxRule.tax_type)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Category</label>
                                        <p className="text-default-900">{getTaxCategoryLabel(selectedTaxRule.tax_category)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Jurisdiction</label>
                                        <p className="text-default-900">{selectedTaxRule.country || 'US'}</p>
                                        {selectedTaxRule.state && <p className="text-small text-default-500">{selectedTaxRule.state}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Calculation Method</label>
                                        <p className="text-default-900">{selectedTaxRule.calculation_method}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedTaxRule.tax_rate && (
                                        <div>
                                            <label className="text-sm font-medium text-default-600">Tax Rate</label>
                                            <p className="text-default-900 font-medium">{selectedTaxRule.tax_rate}%</p>
                                        </div>
                                    )}
                                    {selectedTaxRule.flat_amount && (
                                        <div>
                                            <label className="text-sm font-medium text-default-600">Flat Amount</label>
                                            <p className="text-default-900 font-medium">${selectedTaxRule.flat_amount}</p>
                                        </div>
                                    )}
                                </div>

                                {(selectedTaxRule.min_income || selectedTaxRule.max_income) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedTaxRule.min_income && (
                                            <div>
                                                <label className="text-sm font-medium text-default-600">Minimum Income</label>
                                                <p className="text-default-900">${parseFloat(selectedTaxRule.min_income).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {selectedTaxRule.max_income && (
                                            <div>
                                                <label className="text-sm font-medium text-default-600">Maximum Income</label>
                                                <p className="text-default-900">${parseFloat(selectedTaxRule.max_income).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Effective Date</label>
                                        <p className="text-default-900">
                                            {selectedTaxRule.effective_date 
                                                ? new Date(selectedTaxRule.effective_date).toLocaleDateString() 
                                                : 'Not set'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Status</label>
                                        <Chip 
                                            color={getStatusColor(selectedTaxRule.status)} 
                                            size="sm" 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStatusLabel(selectedTaxRule.status)}
                                        </Chip>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedTaxRule && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Tax Rule</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the tax rule "<strong>{selectedTaxRule.name}</strong>"?</p>
                            <p className="text-sm text-default-500">This action cannot be undone and may affect payroll calculations.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Tax Setup Management">
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
                                                    <DocumentIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Tax Setup
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Configure tax rules and rates for payroll
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateTax && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Tax Rule
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
                                            placeholder="Search tax rules..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Tax Types"
                                            selectedKeys={filters.tax_type ? [filters.tax_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('tax_type', Array.from(keys)[0] || '')}
                                        >
                                            {taxTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {taxStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            placeholder="Country"
                                            value={filters.country}
                                            onChange={(e) => handleFilterChange('country', e.target.value)}
                                            variant="bordered"
                                            size="sm"
                                        />
                                    </div>
                                    
                                    <Table 
                                        aria-label="Tax Setup Rules" 
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
                                            items={taxRules} 
                                            emptyContent={loading ? "Loading..." : "No tax rules found"}
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

TaxSetup.layout = (page) => <App children={page} />;
export default TaxSetup;