import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Switch, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    AdjustmentsHorizontalIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ListBulletIcon,
    CalendarIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const CustomFields = ({ title }) => {
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
    const [customFields, setCustomFields] = useState([]);
    const [filters, setFilters] = useState({ search: '', type: '', status: '' });
    const [stats, setStats] = useState({ 
        total: 0, 
        active: 0, 
        required: 0, 
        optional: 0 
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false });
    const [selectedField, setSelectedField] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        label: '',
        type: 'text',
        is_required: false,
        is_active: true,
        options: '',
        validation_rules: '',
        help_text: ''
    });

    // Permission checks
    const canCreateField = canCreate('hrm.employees.custom_fields') || isSuperAdmin();
    const canEditField = canUpdate('hrm.employees.custom_fields') || isSuperAdmin();
    const canDeleteField = canDelete('hrm.employees.custom_fields') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Fields", 
            value: stats.total, 
            icon: <AdjustmentsHorizontalIcon className="w-6 h-6" />, 
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
            title: "Required", 
            value: stats.required, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Optional", 
            value: stats.optional, 
            icon: <ListBulletIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
    ], [stats]);

    // Field type options
    const fieldTypes = [
        { key: 'text', label: 'Text' },
        { key: 'textarea', label: 'Textarea' },
        { key: 'number', label: 'Number' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'date', label: 'Date' },
        { key: 'select', label: 'Select Dropdown' },
        { key: 'checkbox', label: 'Checkbox' },
        { key: 'radio', label: 'Radio Button' },
        { key: 'file', label: 'File Upload' },
    ];

    // Data fetching
    const fetchCustomFields = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.employees.custom-fields.index'), {
                params: filters
            });
            if (response.status === 200) {
                setCustomFields(response.data.data || []);
                setStats(response.data.stats || stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch custom fields'
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchCustomFields();
    }, [fetchCustomFields]);

    // Modal handlers
    const openModal = (type, field = null) => {
        setSelectedField(field);
        if (field) {
            setFormData({
                name: field.name || '',
                label: field.label || '',
                type: field.type || 'text',
                is_required: field.is_required || false,
                is_active: field.is_active !== undefined ? field.is_active : true,
                options: field.options ? field.options.join('\n') : '',
                validation_rules: field.validation_rules || '',
                help_text: field.help_text || ''
            });
        } else {
            setFormData({
                name: '',
                label: '',
                type: 'text',
                is_required: false,
                is_active: true,
                options: '',
                validation_rules: '',
                help_text: ''
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedField(null);
        setFormData({
            name: '',
            label: '',
            type: 'text',
            is_required: false,
            is_active: true,
            options: '',
            validation_rules: '',
            help_text: ''
        });
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedField 
                    ? route('hrm.employees.custom-fields.update', selectedField.id)
                    : route('hrm.employees.custom-fields.store');
                
                const method = selectedField ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, {
                    ...formData,
                    options: formData.options ? formData.options.split('\n').filter(opt => opt.trim()) : []
                });
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Custom field ${selectedField ? 'updated' : 'created'} successfully`]);
                    fetchCustomFields();
                    closeModal(selectedField ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedField ? 'update' : 'create'} custom field`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedField ? 'Updating' : 'Creating'} custom field...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.employees.custom-fields.destroy', selectedField.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Custom field deleted successfully']);
                    fetchCustomFields();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete custom field']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting custom field...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Table columns
    const columns = [
        { uid: 'label', name: 'Field Label' },
        { uid: 'name', name: 'Field Name' },
        { uid: 'type', name: 'Type' },
        { uid: 'is_required', name: 'Required' },
        { uid: 'is_active', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'type':
                const typeLabel = fieldTypes.find(t => t.key === item.type)?.label || item.type;
                return <Chip color="default" size="sm" variant="flat">{typeLabel}</Chip>;
            case 'is_required':
                return (
                    <Chip 
                        color={item.is_required ? 'danger' : 'default'} 
                        size="sm" 
                        variant="flat"
                    >
                        {item.is_required ? 'Required' : 'Optional'}
                    </Chip>
                );
            case 'is_active':
                return (
                    <Chip 
                        color={item.is_active ? 'success' : 'default'} 
                        size="sm" 
                        variant="flat"
                    >
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex gap-1">
                        {canEditField && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteField && (
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
    }, [canEditField, canDeleteField]);

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
                                {selectedField ? 'Edit Custom Field' : 'Add Custom Field'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Field Label"
                                        placeholder="Enter field label"
                                        value={formData.label}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, label: value }))}
                                        isRequired
                                        radius={themeRadius}
                                    />
                                    <Input
                                        label="Field Name"
                                        placeholder="Enter field name (no spaces)"
                                        value={formData.name}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, name: value.replace(/\s/g, '_').toLowerCase() }))}
                                        isRequired
                                        radius={themeRadius}
                                    />
                                </div>
                                
                                <Select
                                    label="Field Type"
                                    selectedKeys={[formData.type]}
                                    onSelectionChange={(keys) => setFormData(prev => ({ ...prev, type: Array.from(keys)[0] }))}
                                    radius={themeRadius}
                                >
                                    {fieldTypes.map(type => (
                                        <SelectItem key={type.key}>{type.label}</SelectItem>
                                    ))}
                                </Select>

                                {(formData.type === 'select' || formData.type === 'radio' || formData.type === 'checkbox') && (
                                    <Textarea
                                        label="Options (one per line)"
                                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                                        value={formData.options}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, options: value }))}
                                        rows={4}
                                        radius={themeRadius}
                                    />
                                )}

                                <Input
                                    label="Validation Rules"
                                    placeholder="e.g., min:3|max:50"
                                    value={formData.validation_rules}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, validation_rules: value }))}
                                    radius={themeRadius}
                                />

                                <Textarea
                                    label="Help Text"
                                    placeholder="Enter help text for this field"
                                    value={formData.help_text}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, help_text: value }))}
                                    rows={2}
                                    radius={themeRadius}
                                />

                                <div className="flex gap-4">
                                    <Switch
                                        isSelected={formData.is_required}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_required: value }))}
                                    >
                                        Required Field
                                    </Switch>
                                    <Switch
                                        isSelected={formData.is_active}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                                    >
                                        Active
                                    </Switch>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedField ? 'Update' : 'Create'} Field
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedField && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Custom Field</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the custom field "{selectedField.label}"?</p>
                            <p className="text-sm text-default-500">This action cannot be undone and will remove all associated data.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Custom Fields Management">
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
                                                    <AdjustmentsHorizontalIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Employee Custom Fields
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage custom fields for employee profiles
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateField && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Custom Field
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search custom fields..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Types"
                                            selectedKeys={filters.type ? [filters.type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || '')}
                                        >
                                            {fieldTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="inactive">Inactive</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Custom Fields" 
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
                                            items={customFields} 
                                            emptyContent={loading ? "Loading..." : "No custom fields found"}
                                            isLoading={loading}
                                        >
                                            {(item) => (
                                                <TableRow key={item.id}>
                                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

CustomFields.layout = (page) => <App children={page} />;
export default CustomFields;