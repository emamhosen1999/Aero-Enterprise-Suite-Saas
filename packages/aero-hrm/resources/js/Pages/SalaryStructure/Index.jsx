import React, {useState} from 'react';
import {Head, router} from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Switch,
    Textarea,
} from '@heroui/react';
import {
    BanknotesIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import App from '@/Shared/Layouts/App';
import {showToast} from '@/utils/toastUtils';

export default function SalaryStructureIndex({ title, components, stats }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'earnings', 'deductions'

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'earning',
        calculation_type: 'fixed',
        percentage_of: 'basic',
        percentage_value: '',
        default_amount: '',
        formula: '',
        is_taxable: false,
        is_statutory: false,
        affects_gross: false,
        affects_ctc: false,
        affects_epf: false,
        affects_esi: false,
        is_active: true,
        show_in_payslip: true,
        show_if_zero: true,
        display_order: '',
        description: '',
    });

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            type: 'earning',
            calculation_type: 'fixed',
            percentage_of: 'basic',
            percentage_value: '',
            default_amount: '',
            formula: '',
            is_taxable: false,
            is_statutory: false,
            affects_gross: false,
            affects_ctc: false,
            affects_epf: false,
            affects_esi: false,
            is_active: true,
            show_in_payslip: true,
            show_if_zero: true,
            display_order: '',
            description: '',
        });
    };

    const handleOpenModal = (mode, component = null) => {
        setModalMode(mode);
        if (mode === 'edit' && component) {
            setSelectedComponent(component);
            setFormData({
                name: component.name,
                code: component.code,
                type: component.type,
                calculation_type: component.calculation_type,
                percentage_of: component.percentage_of || 'basic',
                percentage_value: component.percentage_value || '',
                default_amount: component.default_amount || '',
                formula: component.formula || '',
                is_taxable: component.is_taxable,
                is_statutory: component.is_statutory,
                affects_gross: component.affects_gross,
                affects_ctc: component.affects_ctc,
                affects_epf: component.affects_epf,
                affects_esi: component.affects_esi,
                is_active: component.is_active,
                show_in_payslip: component.show_in_payslip,
                show_if_zero: component.show_if_zero,
                display_order: component.display_order || '',
                description: component.description || '',
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedComponent(null);
        resetForm();
    };

    const handleSubmit = () => {
        const url = modalMode === 'create' 
            ? route('hr.salary-structure.store')
            : route('hr.salary-structure.update', selectedComponent.id);

        const method = modalMode === 'create' ? 'post' : 'put';

        router[method](url, formData, {
            onSuccess: () => {
                handleCloseModal();
                showToast.success(`Salary component ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
            },
            onError: (errors) => {
                showToast.error('Failed to save component. Please check the form.');
                console.error(errors);
            },
        });
    };

    const handleDelete = (componentId) => {
        if (confirm('Are you sure you want to delete this salary component?')) {
            router.delete(route('hr.salary-structure.destroy', componentId), {
                onSuccess: () => {
                    showToast.success('Salary component deleted successfully!');
                },
                onError: () => {
                    showToast.error('Failed to delete component.');
                },
            });
        }
    };

    const filteredComponents = components.filter(comp => {
        if (activeTab === 'earnings') return comp.type === 'earning';
        if (activeTab === 'deductions') return comp.type === 'deduction';
        return true;
    });

    const earnings = components.filter(c => c.type === 'earning');
    const deductions = components.filter(c => c.type === 'deduction');

    return (
        <App>
            <Head title={title} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-default-900">{title}</h1>
                        <p className="text-sm text-default-500 mt-1">Manage salary components and structure</p>
                    </div>
                    <Button 
                        color="primary" 
                        startContent={<PlusIcon className="w-5 h-5" />}
                        onPress={() => handleOpenModal('create')}
                    >
                        Add Component
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <ChartBarIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Total Components</p>
                                <p className="text-2xl font-bold">{stats.total_components}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-success/10 rounded-lg">
                                <BanknotesIcon className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Earnings</p>
                                <p className="text-2xl font-bold">{stats.earnings}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-danger/10 rounded-lg">
                                <CurrencyDollarIcon className="w-6 h-6 text-danger" />
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Deductions</p>
                                <p className="text-2xl font-bold">{stats.deductions}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <ChartBarIcon className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Active</p>
                                <p className="text-2xl font-bold">{stats.active_components}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button 
                        variant={activeTab === 'all' ? 'solid' : 'light'}
                        color={activeTab === 'all' ? 'primary' : 'default'}
                        onPress={() => setActiveTab('all')}
                    >
                        All Components ({components.length})
                    </Button>
                    <Button 
                        variant={activeTab === 'earnings' ? 'solid' : 'light'}
                        color={activeTab === 'earnings' ? 'success' : 'default'}
                        onPress={() => setActiveTab('earnings')}
                    >
                        Earnings ({earnings.length})
                    </Button>
                    <Button 
                        variant={activeTab === 'deductions' ? 'solid' : 'light'}
                        color={activeTab === 'deductions' ? 'danger' : 'default'}
                        onPress={() => setActiveTab('deductions')}
                    >
                        Deductions ({deductions.length})
                    </Button>
                </div>

                {/* Components List */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Salary Components</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {filteredComponents.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-default-500">No components found</p>
                                </div>
                            ) : (
                                filteredComponents.map((component) => (
                                    <div 
                                        key={component.id} 
                                        className="p-4 border border-default-200 rounded-lg hover:border-primary transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-semibold">{component.name}</h4>
                                                    <Chip 
                                                        size="sm" 
                                                        color={component.type === 'earning' ? 'success' : 'danger'}
                                                        variant="flat"
                                                    >
                                                        {component.type.toUpperCase()}
                                                    </Chip>
                                                    <Chip size="sm" variant="bordered">
                                                        {component.code}
                                                    </Chip>
                                                    {component.is_statutory && (
                                                        <Chip size="sm" color="warning" variant="flat">
                                                            Statutory
                                                        </Chip>
                                                    )}
                                                    {!component.is_active && (
                                                        <Chip size="sm" color="default" variant="flat">
                                                            Inactive
                                                        </Chip>
                                                    )}
                                                </div>
                                                {component.description && (
                                                    <p className="text-sm text-default-500 mb-2">{component.description}</p>
                                                )}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-default-500">Calculation:</span>
                                                        <p className="font-medium capitalize">{component.calculation_type}</p>
                                                    </div>
                                                    {component.calculation_type === 'percentage' && (
                                                        <div>
                                                            <span className="text-default-500">Percentage:</span>
                                                            <p className="font-medium">{component.percentage_value}% of {component.percentage_of}</p>
                                                        </div>
                                                    )}
                                                    {component.calculation_type === 'fixed' && component.default_amount && (
                                                        <div>
                                                            <span className="text-default-500">Amount:</span>
                                                            <p className="font-medium">₹{parseFloat(component.default_amount).toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-default-500">Taxable:</span>
                                                        <p className="font-medium">{component.is_taxable ? 'Yes' : 'No'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-default-500">Display Order:</span>
                                                        <p className="font-medium">{component.display_order}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="primary"
                                                    onPress={() => handleOpenModal('edit', component)}
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={() => handleDelete(component.id)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Component Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal}
                size="3xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        {modalMode === 'create' ? 'Add New Component' : 'Edit Component'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Component Name"
                                    placeholder="e.g., Basic Salary"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    isRequired
                                />
                                <Input
                                    label="Component Code"
                                    placeholder="e.g., BASIC"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    isRequired
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Type"
                                    selectedKeys={[formData.type]}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    isRequired
                                >
                                    <SelectItem key="earning" value="earning">Earning</SelectItem>
                                    <SelectItem key="deduction" value="deduction">Deduction</SelectItem>
                                </Select>

                                <Select
                                    label="Calculation Type"
                                    selectedKeys={[formData.calculation_type]}
                                    onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                                    isRequired
                                >
                                    <SelectItem key="fixed" value="fixed">Fixed Amount</SelectItem>
                                    <SelectItem key="percentage" value="percentage">Percentage</SelectItem>
                                    <SelectItem key="formula" value="formula">Formula</SelectItem>
                                    <SelectItem key="attendance" value="attendance">Attendance Based</SelectItem>
                                    <SelectItem key="slab" value="slab">Slab Based</SelectItem>
                                </Select>
                            </div>

                            {formData.calculation_type === 'percentage' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="Percentage Of"
                                        selectedKeys={[formData.percentage_of]}
                                        onChange={(e) => setFormData({ ...formData, percentage_of: e.target.value })}
                                    >
                                        <SelectItem key="basic" value="basic">Basic Salary</SelectItem>
                                        <SelectItem key="gross" value="gross">Gross Salary</SelectItem>
                                        <SelectItem key="ctc" value="ctc">CTC</SelectItem>
                                    </Select>
                                    <Input
                                        label="Percentage Value"
                                        type="number"
                                        placeholder="e.g., 40"
                                        value={formData.percentage_value}
                                        onChange={(e) => setFormData({ ...formData, percentage_value: e.target.value })}
                                        endContent={<span className="text-default-400">%</span>}
                                    />
                                </div>
                            )}

                            {formData.calculation_type === 'fixed' && (
                                <Input
                                    label="Default Amount"
                                    type="number"
                                    placeholder="e.g., 5000"
                                    value={formData.default_amount}
                                    onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                                    startContent={<span className="text-default-400">₹</span>}
                                />
                            )}

                            {formData.calculation_type === 'formula' && (
                                <Textarea
                                    label="Formula"
                                    placeholder="e.g., (basic * 0.4) + (gross * 0.1)"
                                    value={formData.formula}
                                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                                />
                            )}

                            <Input
                                label="Display Order"
                                type="number"
                                placeholder="e.g., 1"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                            />

                            <Textarea
                                label="Description"
                                placeholder="Component description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />

                            <Divider />

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold">Settings</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Switch
                                        isSelected={formData.is_taxable}
                                        onValueChange={(value) => setFormData({ ...formData, is_taxable: value })}
                                    >
                                        Taxable
                                    </Switch>
                                    <Switch
                                        isSelected={formData.is_statutory}
                                        onValueChange={(value) => setFormData({ ...formData, is_statutory: value })}
                                    >
                                        Statutory
                                    </Switch>
                                    <Switch
                                        isSelected={formData.affects_gross}
                                        onValueChange={(value) => setFormData({ ...formData, affects_gross: value })}
                                    >
                                        Affects Gross
                                    </Switch>
                                    <Switch
                                        isSelected={formData.affects_ctc}
                                        onValueChange={(value) => setFormData({ ...formData, affects_ctc: value })}
                                    >
                                        Affects CTC
                                    </Switch>
                                    <Switch
                                        isSelected={formData.affects_epf}
                                        onValueChange={(value) => setFormData({ ...formData, affects_epf: value })}
                                    >
                                        Affects EPF
                                    </Switch>
                                    <Switch
                                        isSelected={formData.affects_esi}
                                        onValueChange={(value) => setFormData({ ...formData, affects_esi: value })}
                                    >
                                        Affects ESI
                                    </Switch>
                                    <Switch
                                        isSelected={formData.show_in_payslip}
                                        onValueChange={(value) => setFormData({ ...formData, show_in_payslip: value })}
                                    >
                                        Show in Payslip
                                    </Switch>
                                    <Switch
                                        isSelected={formData.is_active}
                                        onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                                    >
                                        Active
                                    </Switch>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            {modalMode === 'create' ? 'Create' : 'Update'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </App>
    );
}
