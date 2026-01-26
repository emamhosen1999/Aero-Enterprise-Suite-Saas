import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Chip
} from "@heroui/react";
import {
    PlusIcon,
    BuildingOfficeIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { showToast } from '@/utils/toastUtils';
import StatsCards from '@/Components/StatsCards';

const Structures = ({ title, structures, departments }) => {
    const themeRadius = useThemeRadius();
    const { auth } = usePage().props;
    
    // Form state for creating/editing structures
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        department_id: '',
        base_salary: '',
        allowances: [],
        deductions: [],
        description: ''
    });
    
    // Modal states
    const [modalStates, setModalStates] = useState({
        add: false,
        edit: false,
        delete: false
    });
    const [selectedStructure, setSelectedStructure] = useState(null);
    
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
    
    // Stats data
    const statsData = useMemo(() => {
        const total = structures?.length || 0;
        const active = structures?.filter(s => s.status === 'active').length || 0;
        const inactive = structures?.filter(s => s.status === 'inactive').length || 0;
        
        return [
            { 
                title: "Total Structures", 
                value: total, 
                icon: <BuildingOfficeIcon className="w-6 h-6" />, 
                color: "text-primary", 
                iconBg: "bg-primary/20" 
            },
            { 
                title: "Active", 
                value: active, 
                icon: <BuildingOfficeIcon className="w-6 h-6" />, 
                color: "text-success", 
                iconBg: "bg-success/20" 
            },
            { 
                title: "Inactive", 
                value: inactive, 
                icon: <BuildingOfficeIcon className="w-6 h-6" />, 
                color: "text-warning", 
                iconBg: "bg-warning/20" 
            }
        ];
    }, [structures]);
    
    // Modal handlers
    const openModal = (type, structure = null) => {
        if (structure) {
            setSelectedStructure(structure);
            setData({
                name: structure.name || '',
                department_id: structure.department_id || '',
                base_salary: structure.base_salary || '',
                allowances: structure.allowances || [],
                deductions: structure.deductions || [],
                description: structure.description || ''
            });
        } else {
            reset();
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };
    
    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedStructure(null);
        reset();
    };
    
    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const promise = new Promise((resolve, reject) => {
            const method = selectedStructure ? put : post;
            const url = selectedStructure 
                ? route('hrm.payroll.structures.update', selectedStructure.id)
                : route('hrm.payroll.structures.store');
            
            method(url, {
                onSuccess: (page) => {
                    resolve([page.props.flash?.message || 'Structure saved successfully']);
                    closeModal(selectedStructure ? 'edit' : 'add');
                    // Refresh the page
                    window.location.reload();
                },
                onError: (errors) => {
                    reject(Object.values(errors).flat());
                }
            });
        });
        
        showToast.promise(promise, {
            loading: selectedStructure ? 'Updating structure...' : 'Creating structure...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };
    
    // Status color mapping
    const statusColorMap = {
        active: "success",
        inactive: "warning",
        disabled: "danger"
    };
    
    // Table columns
    const columns = [
        { key: "name", label: "NAME" },
        { key: "department", label: "DEPARTMENT" },
        { key: "base_salary", label: "BASE SALARY" },
        { key: "status", label: "STATUS" },
        { key: "actions", label: "ACTIONS" }
    ];
    
    // Render table cell
    const renderCell = (structure, columnKey) => {
        switch (columnKey) {
            case "name":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{structure.name}</p>
                        {structure.description && (
                            <p className="text-xs text-default-500">{structure.description}</p>
                        )}
                    </div>
                );
            case "department":
                return structure.department?.name || 'N/A';
            case "base_salary":
                return `$${parseFloat(structure.base_salary || 0).toFixed(2)}`;
            case "status":
                return (
                    <Chip
                        className="capitalize"
                        color={statusColorMap[structure.status] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {structure.status || 'active'}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => openModal('edit', structure)}
                        >
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => openModal('delete', structure)}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return structure[columnKey];
        }
    };
    
    return (
        <>
            <Head title={title || 'Salary Structures'} />
            
            {/* Modals */}
            <Modal 
                isOpen={modalStates.add || modalStates.edit} 
                onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        {selectedStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
                    </ModalHeader>
                    <ModalBody>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Structure Name"
                                placeholder="Enter structure name"
                                value={data.name}
                                onValueChange={(value) => setData('name', value)}
                                isInvalid={!!errors.name}
                                errorMessage={errors.name}
                                isRequired
                                radius={themeRadius}
                            />
                            
                            <Select
                                label="Department"
                                placeholder="Select department"
                                selectedKeys={data.department_id ? [String(data.department_id)] : []}
                                onSelectionChange={(keys) => setData('department_id', Array.from(keys)[0])}
                                isInvalid={!!errors.department_id}
                                errorMessage={errors.department_id}
                                radius={themeRadius}
                            >
                                {departments?.map(dept => (
                                    <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                                ))}
                            </Select>
                            
                            <Input
                                type="number"
                                step="0.01"
                                label="Base Salary"
                                placeholder="Enter base salary"
                                value={data.base_salary}
                                onValueChange={(value) => setData('base_salary', value)}
                                isInvalid={!!errors.base_salary}
                                errorMessage={errors.base_salary}
                                isRequired
                                radius={themeRadius}
                                startContent={<span className="text-default-400">$</span>}
                            />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleSubmit}
                            isLoading={processing}
                        >
                            {selectedStructure ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Salary Structures">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Page Header */}
                        <Card className="mb-6">
                            <CardHeader className="border-b border-divider p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-primary/20">
                                            <BuildingOfficeIcon className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold">Salary Structures</h4>
                                            <p className="text-sm text-default-500">Manage salary structures and pay scales</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            variant="flat"
                                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                            onPress={() => window.location.href = route('hrm.payroll.index')}
                                        >
                                            Back to Payroll
                                        </Button>
                                        <Button
                                            color="primary"
                                            variant="shadow"
                                            startContent={<PlusIcon className="w-4 h-4" />}
                                            onPress={() => openModal('add')}
                                        >
                                            Add Structure
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                        
                        {/* Main Content */}
                        <Card>
                            <CardBody className="p-6">
                                {/* Stats Cards */}
                                <StatsCards stats={statsData} className="mb-6" />
                                
                                {/* Table */}
                                <Table
                                    aria-label="Salary structures table"
                                    isHeaderSticky
                                    classNames={{
                                        wrapper: "shadow-none border border-divider rounded-lg",
                                        th: "bg-default-100 text-default-600 font-semibold",
                                        td: "py-3"
                                    }}
                                >
                                    <TableHeader columns={columns}>
                                        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                    </TableHeader>
                                    <TableBody items={structures || []} emptyContent="No salary structures found">
                                        {(item) => (
                                            <TableRow key={item.id}>
                                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

Structures.layout = (page) => <App children={page} />;
export default Structures;