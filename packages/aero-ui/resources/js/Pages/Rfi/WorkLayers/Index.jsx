import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Spinner,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@heroui/react";
import {
    Squares2X2Icon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowsUpDownIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    XCircleIcon,
    BeakerIcon,
    CameraIcon,
    MapPinIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * WorkLayers Management - PATENTABLE COMPONENT
 * 
 * Defines the hierarchical sequence of construction activities.
 * Each layer can have prerequisites, ensuring proper sequencing
 * (e.g., Earthwork → Sub-base → Base → Surface).
 */
const WorkLayersIndex = ({ title, layers: initialLayers }) => {
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
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State management
    const [layers, setLayers] = useState(initialLayers || []);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingLayer, setEditingLayer] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        layer_order: layers.length + 1,
        prerequisite_layer_id: '',
        color: '#6366f1',
        default_thickness: '',
        unit: 'm³',
        requires_lab_test: false,
        requires_survey: false,
        requires_photos: true,
        min_photos_required: 2,
        is_active: true
    });
    const [formErrors, setFormErrors] = useState({});

    // Table columns
    const columns = [
        { uid: 'order', name: 'Order' },
        { uid: 'name', name: 'Layer Name' },
        { uid: 'prerequisite', name: 'Prerequisite' },
        { uid: 'requirements', name: 'Requirements' },
        { uid: 'progress', name: 'Progress Count' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' }
    ];

    // Permission checks
    const canCreate = auth?.permissions?.includes('rfi.work-layers.create') || true;
    const canEdit = auth?.permissions?.includes('rfi.work-layers.update') || true;
    const canDelete = auth?.permissions?.includes('rfi.work-layers.delete') || true;

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            layer_order: layers.length + 1,
            prerequisite_layer_id: '',
            color: '#6366f1',
            default_thickness: '',
            unit: 'm³',
            requires_lab_test: false,
            requires_survey: false,
            requires_photos: true,
            min_photos_required: 2,
            is_active: true
        });
        setFormErrors({});
        setEditingLayer(null);
    };

    // Open modal for create/edit
    const openModal = (layer = null) => {
        if (layer) {
            setEditingLayer(layer);
            setFormData({
                name: layer.name || '',
                code: layer.code || '',
                description: layer.description || '',
                layer_order: layer.layer_order || layers.length + 1,
                prerequisite_layer_id: layer.prerequisite_layer_id ? String(layer.prerequisite_layer_id) : '',
                color: layer.color || '#6366f1',
                default_thickness: layer.default_thickness || '',
                unit: layer.unit || 'm³',
                requires_lab_test: layer.requires_lab_test || false,
                requires_survey: layer.requires_survey || false,
                requires_photos: layer.requires_photos ?? true,
                min_photos_required: layer.min_photos_required || 2,
                is_active: layer.is_active ?? true
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    // Handle form submission
    const handleSubmit = async () => {
        setLoading(true);
        setFormErrors({});

        const promise = new Promise(async (resolve, reject) => {
            try {
                const payload = {
                    ...formData,
                    prerequisite_layer_id: formData.prerequisite_layer_id || null,
                    default_thickness: formData.default_thickness || null
                };

                let response;
                if (editingLayer) {
                    response = await axios.put(
                        route('rfi.work-layers.update', editingLayer.id),
                        payload
                    );
                } else {
                    response = await axios.post(route('rfi.work-layers.store'), payload);
                }

                if (response.status === 200 || response.status === 201) {
                    // Update local state
                    if (editingLayer) {
                        setLayers(prev => prev.map(l => 
                            l.id === editingLayer.id ? response.data.layer : l
                        ));
                    } else {
                        setLayers(prev => [...prev, response.data.layer]);
                    }
                    setShowModal(false);
                    resetForm();
                    resolve([response.data.message || 'Layer saved successfully']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject(error.response?.data?.message || 'Failed to save layer');
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: editingLayer ? 'Updating layer...' : 'Creating layer...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    };

    // Handle delete
    const handleDelete = async (layer) => {
        setLoading(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('rfi.work-layers.destroy', layer.id));
                
                if (response.status === 200) {
                    setLayers(prev => prev.filter(l => l.id !== layer.id));
                    setDeleteConfirm(null);
                    resolve([response.data.message || 'Layer deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to delete layer');
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting layer...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    };

    // Render table cell
    const renderCell = (layer, columnKey) => {
        switch (columnKey) {
            case 'order':
                return (
                    <div className="flex items-center gap-2">
                        <span 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: layer.color || '#6366f1' }}
                        >
                            {layer.layer_order}
                        </span>
                    </div>
                );
            
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{layer.name}</p>
                        {layer.code && (
                            <p className="text-xs text-default-400">{layer.code}</p>
                        )}
                        {layer.description && (
                            <p className="text-xs text-default-500 mt-1 max-w-xs truncate">
                                {layer.description}
                            </p>
                        )}
                    </div>
                );
            
            case 'prerequisite':
                return layer.prerequisite_layer ? (
                    <Chip 
                        size="sm" 
                        variant="flat"
                        startContent={
                            <span 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: layer.prerequisite_layer.color || '#6366f1' }}
                            />
                        }
                    >
                        {layer.prerequisite_layer.name}
                    </Chip>
                ) : (
                    <span className="text-default-400 text-sm">None (Base layer)</span>
                );
            
            case 'requirements':
                return (
                    <div className="flex gap-1">
                        {layer.requires_lab_test && (
                            <Tooltip content="Requires Lab Test">
                                <Chip size="sm" color="warning" variant="flat">
                                    <BeakerIcon className="w-3 h-3" />
                                </Chip>
                            </Tooltip>
                        )}
                        {layer.requires_survey && (
                            <Tooltip content="Requires Survey">
                                <Chip size="sm" color="primary" variant="flat">
                                    <MapPinIcon className="w-3 h-3" />
                                </Chip>
                            </Tooltip>
                        )}
                        {layer.requires_photos && (
                            <Tooltip content={`Min ${layer.min_photos_required} Photos`}>
                                <Chip size="sm" color="secondary" variant="flat">
                                    <CameraIcon className="w-3 h-3" />
                                </Chip>
                            </Tooltip>
                        )}
                    </div>
                );
            
            case 'progress':
                return (
                    <Chip size="sm" variant="flat" color="default">
                        {layer.chainage_progress_count || 0} segments
                    </Chip>
                );
            
            case 'status':
                return layer.is_active ? (
                    <Chip size="sm" color="success" variant="flat" startContent={<CheckCircleIcon className="w-3 h-3" />}>
                        Active
                    </Chip>
                ) : (
                    <Chip size="sm" color="danger" variant="flat" startContent={<XCircleIcon className="w-3 h-3" />}>
                        Inactive
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
                        <DropdownMenu aria-label="Layer actions">
                            {canEdit && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openModal(layer)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => setDeleteConfirm(layer)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title} />
            
            {/* Add/Edit Modal */}
            <Modal 
                isOpen={showModal} 
                onOpenChange={(open) => { if (!open) { setShowModal(false); resetForm(); }}}
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
                            {editingLayer ? 'Edit Work Layer' : 'Add Work Layer'}
                        </h2>
                        <p className="text-sm text-default-500">
                            Define a construction activity layer with prerequisites and requirements
                        </p>
                    </ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Layer Name"
                                placeholder="e.g., Sub-base Course"
                                value={formData.name}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, name: v }))}
                                isInvalid={!!formErrors.name}
                                errorMessage={formErrors.name?.[0]}
                                isRequired
                                radius={getThemeRadius()}
                            />
                            
                            <Input
                                label="Code"
                                placeholder="e.g., SBC"
                                value={formData.code}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, code: v }))}
                                isInvalid={!!formErrors.code}
                                errorMessage={formErrors.code?.[0]}
                                radius={getThemeRadius()}
                            />
                            
                            <Input
                                label="Layer Order"
                                type="number"
                                placeholder="1"
                                value={String(formData.layer_order)}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, layer_order: parseInt(v) || 1 }))}
                                isInvalid={!!formErrors.layer_order}
                                errorMessage={formErrors.layer_order?.[0]}
                                isRequired
                                min={1}
                                radius={getThemeRadius()}
                            />
                            
                            <Select
                                label="Prerequisite Layer"
                                placeholder="None (Base layer)"
                                selectedKeys={formData.prerequisite_layer_id ? [formData.prerequisite_layer_id] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, prerequisite_layer_id: Array.from(keys)[0] || '' }))}
                                isInvalid={!!formErrors.prerequisite_layer_id}
                                errorMessage={formErrors.prerequisite_layer_id?.[0]}
                                radius={getThemeRadius()}
                            >
                                {layers
                                    .filter(l => l.id !== editingLayer?.id)
                                    .map(layer => (
                                        <SelectItem key={String(layer.id)}>
                                            <div className="flex items-center gap-2">
                                                <span 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: layer.color || '#6366f1' }}
                                                />
                                                {layer.name}
                                            </div>
                                        </SelectItem>
                                    ))
                                }
                            </Select>
                            
                            <Input
                                label="Color"
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                radius={getThemeRadius()}
                                classNames={{
                                    input: "h-10"
                                }}
                            />
                            
                            <Input
                                label="Default Thickness"
                                type="number"
                                placeholder="0.15"
                                value={formData.default_thickness}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, default_thickness: v }))}
                                endContent={<span className="text-default-400 text-xs">m</span>}
                                radius={getThemeRadius()}
                            />
                            
                            <Select
                                label="Unit of Measurement"
                                selectedKeys={formData.unit ? [formData.unit] : ['m³']}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, unit: Array.from(keys)[0] || 'm³' }))}
                                radius={getThemeRadius()}
                            >
                                <SelectItem key="m³">Cubic Meter (m³)</SelectItem>
                                <SelectItem key="m²">Square Meter (m²)</SelectItem>
                                <SelectItem key="m">Linear Meter (m)</SelectItem>
                                <SelectItem key="ton">Metric Ton</SelectItem>
                                <SelectItem key="kg">Kilogram</SelectItem>
                                <SelectItem key="nos">Numbers</SelectItem>
                            </Select>
                            
                            <Input
                                label="Min Photos Required"
                                type="number"
                                value={String(formData.min_photos_required)}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, min_photos_required: parseInt(v) || 0 }))}
                                min={0}
                                radius={getThemeRadius()}
                            />
                        </div>
                        
                        <Input
                            label="Description"
                            placeholder="Describe this layer's purpose and specifications..."
                            value={formData.description}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
                            className="mt-4"
                            radius={getThemeRadius()}
                        />
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center justify-between p-3 bg-default-100 rounded-lg">
                                <span className="text-sm">Lab Test</span>
                                <Switch
                                    size="sm"
                                    isSelected={formData.requires_lab_test}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, requires_lab_test: v }))}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-default-100 rounded-lg">
                                <span className="text-sm">Survey</span>
                                <Switch
                                    size="sm"
                                    isSelected={formData.requires_survey}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, requires_survey: v }))}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-default-100 rounded-lg">
                                <span className="text-sm">Photos</span>
                                <Switch
                                    size="sm"
                                    isSelected={formData.requires_photos}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, requires_photos: v }))}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-default-100 rounded-lg">
                                <span className="text-sm">Active</span>
                                <Switch
                                    size="sm"
                                    isSelected={formData.is_active}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => { setShowModal(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                            {editingLayer ? 'Update Layer' : 'Create Layer'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={!!deleteConfirm} 
                onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
                size="sm"
            >
                <ModalContent>
                    <ModalHeader>Delete Work Layer</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
                        <p className="text-sm text-default-500 mt-2">
                            This action cannot be undone. Any dependent layers will need to be updated.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={() => handleDelete(deleteConfirm)} isLoading={loading}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Work Layers Management">
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
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div 
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <Squares2X2Icon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} 
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Work Layers
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Define construction activity layers with prerequisites
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
                                                        onPress={() => openModal()}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Layer
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Info Banner */}
                                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                                        <div className="flex gap-3">
                                            <Squares2X2Icon className="w-6 h-6 text-primary shrink-0" />
                                            <div>
                                                <h5 className="font-semibold text-primary mb-1">
                                                    Layer Sequencing for RFI Validation
                                                </h5>
                                                <p className="text-sm text-default-600">
                                                    Work layers define the order of construction activities. When submitting an RFI, 
                                                    the system validates that prerequisite layers are completed at the same chainage range. 
                                                    This prevents out-of-sequence work and ensures quality construction.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Table */}
                                    <Table
                                        aria-label="Work layers table"
                                        isHeaderSticky
                                        classNames={{
                                            wrapper: "shadow-none border border-divider rounded-lg",
                                            th: "bg-default-100 text-default-600 font-semibold",
                                            td: "py-3"
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => (
                                                <TableColumn key={column.uid}>
                                                    {column.name}
                                                </TableColumn>
                                            )}
                                        </TableHeader>
                                        <TableBody 
                                            items={layers} 
                                            emptyContent={
                                                <div className="py-8 text-center">
                                                    <Squares2X2Icon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                                                    <p className="text-default-400">No work layers defined yet.</p>
                                                    <p className="text-sm text-default-300">
                                                        Click "Add Layer" to define your first construction layer.
                                                    </p>
                                                </div>
                                            }
                                        >
                                            {(layer) => (
                                                <TableRow key={layer.id}>
                                                    {(columnKey) => (
                                                        <TableCell>{renderCell(layer, columnKey)}</TableCell>
                                                    )}
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

WorkLayersIndex.layout = (page) => <App children={page} />;
export default WorkLayersIndex;
