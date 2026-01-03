import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
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
    Skeleton,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
    Tooltip,
} from "@heroui/react";
import {
    ClipboardDocumentListIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CheckCircleIcon,
    XCircleIcon,
    CubeIcon,
    CurrencyDollarIcon,
    CalculatorIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * BOQ Items Management Page
 * 
 * Part of the Chainage-Centric Integrated Construction Ledger.
 * Manages Bill of Quantities item master data with work layer associations.
 */
const BoqItemsIndex = ({ title }) => {
    const { auth } = usePage().props;

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
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [workLayers, setWorkLayers] = useState([]);
    const [units, setUnits] = useState([]);
    const [filters, setFilters] = useState({ search: '', work_layer_id: '', unit: '', is_active: '' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalQuantity: 0, totalValue: 0 });
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Modal states
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        item_code: '',
        description: '',
        unit: '',
        unit_rate: '',
        total_quantity: '',
        specification: '',
        work_layer_id: '',
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        { title: "Total Items", value: stats.total, icon: <ClipboardDocumentListIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Active", value: stats.active, icon: <CheckCircleIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Inactive", value: stats.inactive, icon: <XCircleIcon className="w-5 h-5" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "Total Value", value: `৳${(stats.totalValue / 1000000).toFixed(2)}M`, icon: <CurrencyDollarIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
    ], [stats]);

    // Permissions
    const canCreate = auth.permissions?.includes('project.boq-items.create') || auth.permissions?.includes('project.*') || true;
    const canEdit = auth.permissions?.includes('project.boq-items.update') || auth.permissions?.includes('project.*') || true;
    const canDelete = auth.permissions?.includes('project.boq-items.delete') || auth.permissions?.includes('project.*') || true;
    const canImport = auth.permissions?.includes('project.boq-items.import') || auth.permissions?.includes('project.*') || true;
    const canExport = auth.permissions?.includes('project.boq-items.export') || auth.permissions?.includes('project.*') || true;

    // Fetch data
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('project.boq-items.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters,
                },
            });
            if (response.status === 200) {
                setItems(response.data.items);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch BOQ items:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('project.boq-items.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchWorkLayers = useCallback(async () => {
        try {
            const response = await axios.get(route('rfi.work-layers.list'));
            if (response.status === 200) {
                setWorkLayers(response.data.items || []);
            }
        } catch (error) {
            console.error('Failed to fetch work layers:', error);
        }
    }, []);

    const fetchUnits = useCallback(async () => {
        try {
            const response = await axios.get(route('project.boq-items.units'));
            if (response.status === 200) {
                setUnits(response.data.units || []);
            }
        } catch (error) {
            console.error('Failed to fetch units:', error);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        fetchStats();
        fetchWorkLayers();
        fetchUnits();
    }, [fetchStats, fetchWorkLayers, fetchUnits]);

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Form handlers
    const resetForm = () => {
        setFormData({
            item_code: '',
            description: '',
            unit: '',
            unit_rate: '',
            total_quantity: '',
            specification: '',
            work_layer_id: '',
            is_active: true,
        });
        setFormErrors({});
    };

    const openAddModal = () => {
        resetForm();
        setAddModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        setFormData({
            item_code: item.item_code || '',
            description: item.description || '',
            unit: item.unit || '',
            unit_rate: item.unit_rate?.toString() || '',
            total_quantity: item.total_quantity?.toString() || '',
            specification: item.specification || '',
            work_layer_id: item.work_layer_id?.toString() || '',
            is_active: item.is_active ?? true,
        });
        setFormErrors({});
        setEditModalOpen(true);
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setDeleteModalOpen(true);
    };

    const handleSubmit = async (isEdit = false) => {
        setSubmitting(true);
        setFormErrors({});

        const promise = new Promise(async (resolve, reject) => {
            try {
                const payload = {
                    ...formData,
                    unit_rate: parseFloat(formData.unit_rate) || 0,
                    total_quantity: parseFloat(formData.total_quantity) || 0,
                    work_layer_id: formData.work_layer_id || null,
                };

                let response;
                if (isEdit) {
                    response = await axios.put(route('project.boq-items.update', selectedItem.id), payload);
                } else {
                    response = await axios.post(route('project.boq-items.store'), payload);
                }

                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message]);
                    fetchItems();
                    fetchStats();
                    if (isEdit) {
                        setEditModalOpen(false);
                    } else {
                        setAddModalOpen(false);
                    }
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject([error.response?.data?.message || 'An error occurred']);
            } finally {
                setSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: isEdit ? 'Updating BOQ item...' : 'Creating BOQ item...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('project.boq-items.destroy', selectedItem.id));
                if (response.status === 200) {
                    resolve([response.data.message]);
                    fetchItems();
                    fetchStats();
                    setDeleteModalOpen(false);
                    setSelectedItem(null);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete']);
            } finally {
                setSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting BOQ item...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(route('project.boq-items.export'), {
                params: filters,
            });
            
            if (response.status === 200) {
                // Convert to CSV and download
                const data = response.data.data;
                if (data.length === 0) {
                    showToast.error('No data to export');
                    return;
                }

                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(','),
                    ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = response.data.filename;
                a.click();
                window.URL.revokeObjectURL(url);

                showToast.success('Export completed');
            }
        } catch (error) {
            showToast.error('Export failed');
        }
    };

    // Table columns
    const columns = [
        { uid: 'item_code', name: 'Item Code' },
        { uid: 'description', name: 'Description' },
        { uid: 'unit', name: 'Unit' },
        { uid: 'unit_rate', name: 'Rate' },
        { uid: 'total_quantity', name: 'Qty' },
        { uid: 'total_value', name: 'Value' },
        { uid: 'work_layer', name: 'Work Layer' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'item_code':
                return (
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <CubeIcon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-mono font-medium">{item.item_code}</span>
                    </div>
                );
            case 'description':
                return (
                    <Tooltip content={item.description}>
                        <span className="max-w-xs truncate block">{item.description}</span>
                    </Tooltip>
                );
            case 'unit':
                return <Chip size="sm" variant="flat">{item.unit}</Chip>;
            case 'unit_rate':
                return <span className="font-mono">৳{parseFloat(item.unit_rate).toLocaleString()}</span>;
            case 'total_quantity':
                return <span className="font-mono">{parseFloat(item.total_quantity).toLocaleString()}</span>;
            case 'total_value':
                const value = (parseFloat(item.unit_rate) * parseFloat(item.total_quantity));
                return <span className="font-mono font-medium">৳{value.toLocaleString()}</span>;
            case 'work_layer':
                return item.work_layer ? (
                    <Chip size="sm" variant="flat" color="secondary" startContent={<Squares2X2Icon className="w-3 h-3" />}>
                        {item.work_layer.name}
                    </Chip>
                ) : (
                    <span className="text-default-400">-</span>
                );
            case 'status':
                return (
                    <Chip size="sm" color={item.is_active ? 'success' : 'danger'} variant="flat">
                        {item.is_active ? 'Active' : 'Inactive'}
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
                        <DropdownMenu aria-label="Actions">
                            {canEdit && (
                                <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openEditModal(item)}>
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem key="delete" className="text-danger" color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => openDeleteModal(item)}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    // Form modal content
    const renderFormModal = (isEdit = false) => (
        <Modal
            isOpen={isEdit ? editModalOpen : addModalOpen}
            onOpenChange={isEdit ? setEditModalOpen : setAddModalOpen}
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
                        {isEdit ? 'Edit BOQ Item' : 'Add BOQ Item'}
                    </h2>
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Item Code"
                            placeholder="e.g., BOQ-001"
                            value={formData.item_code}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, item_code: v }))}
                            isInvalid={!!formErrors.item_code}
                            errorMessage={formErrors.item_code?.[0]}
                            isRequired
                            radius={getThemeRadius()}
                        />
                        <Input
                            label="Unit"
                            placeholder="e.g., m³, kg, nos"
                            value={formData.unit}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}
                            isInvalid={!!formErrors.unit}
                            errorMessage={formErrors.unit?.[0]}
                            isRequired
                            radius={getThemeRadius()}
                        />
                        <div className="md:col-span-2">
                            <Textarea
                                label="Description"
                                placeholder="Item description"
                                value={formData.description}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
                                isInvalid={!!formErrors.description}
                                errorMessage={formErrors.description?.[0]}
                                isRequired
                                radius={getThemeRadius()}
                                minRows={2}
                            />
                        </div>
                        <Input
                            type="number"
                            label="Unit Rate (৳)"
                            placeholder="0.00"
                            value={formData.unit_rate}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, unit_rate: v }))}
                            isInvalid={!!formErrors.unit_rate}
                            errorMessage={formErrors.unit_rate?.[0]}
                            isRequired
                            radius={getThemeRadius()}
                            startContent={<span className="text-default-400">৳</span>}
                        />
                        <Input
                            type="number"
                            label="Total Quantity"
                            placeholder="0"
                            value={formData.total_quantity}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, total_quantity: v }))}
                            isInvalid={!!formErrors.total_quantity}
                            errorMessage={formErrors.total_quantity?.[0]}
                            isRequired
                            radius={getThemeRadius()}
                        />
                        <Select
                            label="Work Layer"
                            placeholder="Select work layer"
                            selectedKeys={formData.work_layer_id ? [formData.work_layer_id] : []}
                            onSelectionChange={(keys) => setFormData(prev => ({ 
                                ...prev, 
                                work_layer_id: Array.from(keys)[0] || '' 
                            }))}
                            radius={getThemeRadius()}
                        >
                            {workLayers.map(layer => (
                                <SelectItem key={String(layer.id)}>{layer.name}</SelectItem>
                            ))}
                        </Select>
                        <div className="flex items-center gap-2">
                            <Switch
                                isSelected={formData.is_active}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                            />
                            <span>Active</span>
                        </div>
                        <div className="md:col-span-2">
                            <Textarea
                                label="Specification"
                                placeholder="Technical specification (optional)"
                                value={formData.specification}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, specification: v }))}
                                radius={getThemeRadius()}
                                minRows={3}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={() => isEdit ? setEditModalOpen(false) : setAddModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={() => handleSubmit(isEdit)} isLoading={submitting}>
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );

    return (
        <>
            <Head title={title} />

            {/* Modals */}
            {addModalOpen && renderFormModal(false)}
            {editModalOpen && renderFormModal(true)}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onOpenChange={setDeleteModalOpen} size="sm">
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete BOQ item <strong>{selectedItem?.item_code}</strong>?</p>
                        <p className="text-sm text-danger mt-2">This action cannot be undone.</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setDeleteModalOpen(false)}>Cancel</Button>
                        <Button color="danger" onPress={handleDelete} isLoading={submitting}>Delete</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="BOQ Items Management">
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
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                {/* Card Header */}
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
                                                    <ClipboardDocumentListIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        BOQ Items
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Bill of Quantities master data
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                {canExport && (
                                                    <Button variant="bordered" size={isMobile ? "sm" : "md"}
                                                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                        onPress={handleExport}>
                                                        Export
                                                    </Button>
                                                )}
                                                {canCreate && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={openAddModal}
                                                        size={isMobile ? "sm" : "md"}>
                                                        Add Item
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search items..."
                                            value={filters.search}
                                            onValueChange={(v) => handleFilterChange('search', v)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            className="flex-1"
                                            radius={getThemeRadius()}
                                        />
                                        <Select
                                            placeholder="All Work Layers"
                                            selectedKeys={filters.work_layer_id ? [filters.work_layer_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('work_layer_id', Array.from(keys)[0] || '')}
                                            className="w-full sm:w-48"
                                            radius={getThemeRadius()}
                                        >
                                            {workLayers.map(layer => (
                                                <SelectItem key={String(layer.id)}>{layer.name}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            placeholder="All Units"
                                            selectedKeys={filters.unit ? [filters.unit] : []}
                                            onSelectionChange={(keys) => handleFilterChange('unit', Array.from(keys)[0] || '')}
                                            className="w-full sm:w-36"
                                            radius={getThemeRadius()}
                                        >
                                            {units.map(unit => (
                                                <SelectItem key={unit}>{unit}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.is_active !== '' ? [filters.is_active] : []}
                                            onSelectionChange={(keys) => handleFilterChange('is_active', Array.from(keys)[0] ?? '')}
                                            className="w-full sm:w-36"
                                            radius={getThemeRadius()}
                                        >
                                            <SelectItem key="true">Active</SelectItem>
                                            <SelectItem key="false">Inactive</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Table */}
                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <Skeleton className="h-12 w-24 rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-3/4 rounded" />
                                                        <Skeleton className="h-3 w-1/2 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="BOQ Items table"
                                            isHeaderSticky
                                            classNames={{
                                                wrapper: "shadow-none border border-divider rounded-lg",
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-3"
                                            }}
                                        >
                                            <TableHeader columns={columns}>
                                                {(column) => (
                                                    <TableColumn key={column.uid}>{column.name}</TableColumn>
                                                )}
                                            </TableHeader>
                                            <TableBody items={items} emptyContent="No BOQ items found">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}

                                    {/* Pagination */}
                                    {pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={handlePageChange}
                                                showControls
                                                color="primary"
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

BoqItemsIndex.layout = (page) => <App children={page} />;
export default BoqItemsIndex;
