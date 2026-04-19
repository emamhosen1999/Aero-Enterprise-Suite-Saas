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
    Chip,
    Tabs,
    Tab
} from "@heroui/react";
import {
    PlusIcon,
    CogIcon,
    PencilIcon,
    TrashIcon,
    ArrowLeftIcon,
    PlusCircleIcon,
    MinusCircleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { showToast } from '@/utils/toastUtils';
import StatsCards from '@/Components/StatsCards';
import { router } from '@inertiajs/react';

const Components = ({ title, allowances, deductions }) => {
    const themeRadius = useThemeRadius();
    const { auth } = usePage().props;
    
    // Form state for creating/editing components
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        type: 'allowance', // allowance or deduction
        amount_type: 'fixed', // fixed or percentage
        amount: '',
        description: '',
        is_taxable: false,
        is_active: true
    });
    
    // Modal states
    const [modalStates, setModalStates] = useState({
        add: false,
        edit: false,
        delete: false
    });
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [activeTab, setActiveTab] = useState('allowances');
    
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
        const totalAllowances = allowances?.length || 0;
        const totalDeductions = deductions?.length || 0;
        const activeAllowances = allowances?.filter(a => a.is_active).length || 0;
        const activeDeductions = deductions?.filter(d => d.is_active).length || 0;
        
        return [
            { 
                title: "Total Allowances", 
                value: totalAllowances, 
                icon: <PlusCircleIcon className="w-6 h-6" />, 
                color: "text-success", 
                iconBg: "bg-success/20" 
            },
            { 
                title: "Active Allowances", 
                value: activeAllowances, 
                icon: <PlusCircleIcon className="w-6 h-6" />, 
                color: "text-success", 
                iconBg: "bg-success/20" 
            },
            { 
                title: "Total Deductions", 
                value: totalDeductions, 
                icon: <MinusCircleIcon className="w-6 h-6" />, 
                color: "text-danger", 
                iconBg: "bg-danger/20" 
            },
            { 
                title: "Active Deductions", 
                value: activeDeductions, 
                icon: <MinusCircleIcon className="w-6 h-6" />, 
                color: "text-danger", 
                iconBg: "bg-danger/20" 
            }
        ];
    }, [allowances, deductions]);
    
    // Modal handlers
    const openModal = (type, component = null) => {
        if (component) {
            setSelectedComponent(component);
            setData({
                name: component.name || '',
                type: component.type || 'allowance',
                amount_type: component.amount_type || 'fixed',
                amount: component.amount || '',
                description: component.description || '',
                is_taxable: component.is_taxable || false,
                is_active: component.is_active || true
            });
        } else {
            reset();
            setData(prev => ({
                ...prev,
                type: activeTab === 'allowances' ? 'allowance' : 'deduction'
            }));
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };
    
    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedComponent(null);
        reset();
    };
    
    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const promise = new Promise((resolve, reject) => {
            const method = selectedComponent ? put : post;
            const url = selectedComponent 
                ? route('hrm.payroll.components.update', selectedComponent.id)
                : route('hrm.payroll.components.store');
            
            method(url, {
                onSuccess: (page) => {
                    resolve([page.props.flash?.message || 'Component saved successfully']);
                    closeModal(selectedComponent ? 'edit' : 'add');
                    // Refresh the page
                    window.location.reload();
                },
                onError: (errors) => {
                    reject(Object.values(errors).flat());
                }
            });
        });
        
        showToast.promise(promise, {
            loading: selectedComponent ? 'Updating component...' : 'Creating component...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };
    
    // Status color mapping
    const statusColorMap = {
        true: "success",
        false: "default"
    };
    
    // Table columns
    const columns = [
        { key: "name", label: "NAME" },
        { key: "amount_type", label: "TYPE" },
        { key: "amount", label: "AMOUNT" },
        { key: "is_taxable", label: "TAXABLE" },
        { key: "is_active", label: "STATUS" },
        { key: "actions", label: "ACTIONS" }
    ];
    
    // Render table cell
    const renderCell = (component, columnKey) => {
        switch (columnKey) {
            case "name":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{component.name}</p>
                        {component.description && (
                            <p className="text-xs text-default-500">{component.description}</p>
                        )}
                    </div>
                );
            case "amount_type":
                return (
                    <Chip
                        className="capitalize"
                        color="primary"
                        size="sm"
                        variant="flat"
                    >
                        {component.amount_type}
                    </Chip>
                );
            case "amount":
                return component.amount_type === 'percentage' 
                    ? `${component.amount}%` 
                    : `$${parseFloat(component.amount || 0).toFixed(2)}`;
            case "is_taxable":
                return (
                    <Chip
                        className="capitalize"
                        color={component.is_taxable ? "success" : "default"}
                        size="sm"
                        variant="flat"
                    >
                        {component.is_taxable ? 'Yes' : 'No'}
                    </Chip>
                );
            case "is_active":
                return (
                    <Chip
                        className="capitalize"
                        color={statusColorMap[component.is_active]}
                        size="sm"
                        variant="flat"
                    >
                        {component.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => openModal('edit', component)}
                        >
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => openModal('delete', component)}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return component[columnKey];
        }
    };
    
    return (
        <>
            <Head title={title || 'Payroll Components'} />
            
            {/* Modals */}
            <Modal 
                isOpen={modalStates.add || modalStates.edit} 
                onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        {selectedComponent ? 'Edit Payroll Component' : 'Create Payroll Component'}
                    </ModalHeader>
                    <ModalBody>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Component Name"
                                placeholder="Enter component name"
                                value={data.name}
                                onValueChange={(value) => setData('name', value)}
                                isInvalid={!!errors.name}
                                errorMessage={errors.name}
                                isRequired
                                radius={themeRadius}
                            />
                            
                            <Select
                                label="Component Type"
                                placeholder="Select type"
                                selectedKeys={data.type ? [data.type] : []}
                                onSelectionChange={(keys) => setData('type', Array.from(keys)[0])}
                                isInvalid={!!errors.type}
                                errorMessage={errors.type}
                                radius={themeRadius}
                            >
                                <SelectItem key="allowance">Allowance</SelectItem>
                                <SelectItem key="deduction">Deduction</SelectItem>
                            </Select>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Amount Type"
                                    placeholder="Select amount type"
                                    selectedKeys={data.amount_type ? [data.amount_type] : []}
                                    onSelectionChange={(keys) => setData('amount_type', Array.from(keys)[0])}
                                    isInvalid={!!errors.amount_type}
                                    errorMessage={errors.amount_type}
                                    radius={themeRadius}
                                >
                                    <SelectItem key="fixed">Fixed Amount</SelectItem>
                                    <SelectItem key="percentage">Percentage</SelectItem>
                                </Select>
                                
                                <Input
                                    type="number"
                                    step="0.01"
                                    label="Amount"
                                    placeholder={data.amount_type === 'percentage' ? "Enter percentage" : "Enter amount"}
                                    value={data.amount}
                                    onValueChange={(value) => setData('amount', value)}
                                    isInvalid={!!errors.amount}
                                    errorMessage={errors.amount}
                                    isRequired
                                    radius={themeRadius}
                                    startContent={
                                        data.amount_type === 'percentage' 
                                            ? <span className="text-default-400">%</span>
                                            : <span className="text-default-400">$</span>
                                    }
                                />
                            </div>
                            
                            <Input
                                label="Description"
                                placeholder="Enter component description"
                                value={data.description}
                                onValueChange={(value) => setData('description', value)}
                                isInvalid={!!errors.description}
                                errorMessage={errors.description}
                                radius={themeRadius}
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
                            {selectedComponent ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Payroll Components">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Page Header */}
                        <Card className="mb-6">
                            <CardHeader className="border-b border-divider p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-primary/20">
                                            <CogIcon className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold">Payroll Components</h4>
                                            <p className="text-sm text-default-500">Manage allowances and deductions</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            variant="flat"
                                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                            onPress={() => router.visit(route('hrm.payroll.index'))}
                                        >
                                            Back to Payroll
                                        </Button>
                                        <Button
                                            color="primary"
                                            variant="shadow"
                                            startContent={<PlusIcon className="w-4 h-4" />}
                                            onPress={() => openModal('add')}
                                        >
                                            Add Component
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
                                
                                {/* Tabs */}
                                <Tabs 
                                    selectedKey={activeTab} 
                                    onSelectionChange={setActiveTab}
                                    className="mb-6"
                                >
                                    <Tab key="allowances" title="Allowances">
                                        <Table
                                            aria-label="Allowances table"
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
                                            <TableBody items={allowances || []} emptyContent="No allowances found">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Tab>
                                    <Tab key="deductions" title="Deductions">
                                        <Table
                                            aria-label="Deductions table"
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
                                            <TableBody items={deductions || []} emptyContent="No deductions found">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Tab>
                                </Tabs>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

Components.layout = (page) => <App children={page} />;
export default Components;