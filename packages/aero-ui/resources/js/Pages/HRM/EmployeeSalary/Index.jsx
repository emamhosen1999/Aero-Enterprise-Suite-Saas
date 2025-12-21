import React, {useState} from 'react';
import {Head, router} from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
} from '@heroui/react';
import {
    BriefcaseIcon,
    CalculatorIcon,
    CurrencyDollarIcon,
    PlusIcon,
    TrashIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import {showToast} from '@/utils/toastUtils';
import axios from 'axios';

export default function EmployeeSalary({ title, employee, salaryStructures, allComponents, summary }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [preview, setPreview] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleOpenModal = () => {
        // Initialize with existing components or empty
        const initialComponents = salaryStructures.map(structure => ({
            salary_component_id: structure.salary_component_id,
            amount: structure.amount || structure.salary_component.default_amount || '',
            percentage_value: structure.percentage_value || structure.salary_component.percentage_value || '',
            calculation_type: structure.calculation_type || structure.salary_component.calculation_type,
            is_active: true,
        }));
        setSelectedComponents(initialComponents);
        setIsModalOpen(true);
    };

    const handleAddComponent = () => {
        setSelectedComponents([
            ...selectedComponents,
            {
                salary_component_id: '',
                amount: '',
                percentage_value: '',
                calculation_type: 'fixed',
                is_active: true,
            },
        ]);
    };

    const handleRemoveComponent = (index) => {
        setSelectedComponents(selectedComponents.filter((_, i) => i !== index));
    };

    const handleComponentChange = (index, field, value) => {
        const updated = [...selectedComponents];
        updated[index][field] = value;

        // Auto-fill calculation type if component is selected
        if (field === 'salary_component_id') {
            const component = allComponents.find(c => c.id === parseInt(value));
            if (component) {
                updated[index].calculation_type = component.calculation_type;
                if (component.calculation_type === 'fixed') {
                    updated[index].amount = component.default_amount || '';
                } else if (component.calculation_type === 'percentage') {
                    updated[index].percentage_value = component.percentage_value || '';
                }
            }
        }

        setSelectedComponents(updated);
    };

    const calculatePreview = async () => {
        if (selectedComponents.length === 0) {
            showToast.warning('Please add at least one component');
            return;
        }

        setIsCalculating(true);
        try {
            const response = await axios.post(route('hr.salary-structure.calculate-preview'), {
                user_id: employee.id,
                components: selectedComponents,
            });
            setPreview(response.data);
        } catch (error) {
            showToast.error('Failed to calculate preview');
            console.error(error);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSubmit = () => {
        if (selectedComponents.length === 0) {
            showToast.warning('Please add at least one component');
            return;
        }

        const componentsWithDate = selectedComponents.map(comp => ({
            ...comp,
            effective_from: effectiveDate,
        }));

        router.post(route('hr.salary-structure.assign'), {
            user_id: employee.id,
            components: componentsWithDate,
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                showToast.success('Salary structure assigned successfully!');
            },
            onError: (errors) => {
                showToast.error('Failed to assign salary structure');
                console.error(errors);
            },
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const getComponentName = (componentId) => {
        const component = allComponents.find(c => c.id === componentId);
        return component ? component.name : 'Unknown';
    };

    const availableComponents = allComponents.filter(comp => 
        !selectedComponents.some(sc => sc.salary_component_id === comp.id)
    );

    return (
        <App>
            <Head title={title} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <UserIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-default-900">{employee.name}</h1>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-sm text-default-500">
                                    {employee.designation?.title || 'No designation'}
                                </p>
                                <span className="text-default-300">•</span>
                                <p className="text-sm text-default-500">
                                    {employee.department?.name || 'No department'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button 
                        color="primary" 
                        startContent={<PlusIcon className="w-5 h-5" />}
                        onPress={handleOpenModal}
                    >
                        {salaryStructures.length > 0 ? 'Update Salary Structure' : 'Assign Salary Structure'}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-success/5 border border-success/20">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-success-600 dark:text-success-400">Total Earnings</p>
                                    <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                                        {formatCurrency(summary.total_earnings)}
                                    </p>
                                </div>
                                <BriefcaseIcon className="w-10 h-10 text-success-500" />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-danger/5 border border-danger/20">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-danger-600 dark:text-danger-400">Total Deductions</p>
                                    <p className="text-2xl font-bold text-danger-700 dark:text-danger-300">
                                        {formatCurrency(summary.total_deductions)}
                                    </p>
                                </div>
                                <CurrencyDollarIcon className="w-10 h-10 text-danger-500" />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-primary/5 border border-primary/20">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-primary-600 dark:text-primary-400">Net Salary</p>
                                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                                        {formatCurrency(summary.net_salary)}
                                    </p>
                                </div>
                                <CalculatorIcon className="w-10 h-10 text-primary-500" />
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Salary Components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Earnings */}
                    <Card>
                        <CardHeader className="bg-success-50 dark:bg-success-900/20">
                            <h3 className="text-lg font-semibold text-success-700 dark:text-success-400">Earnings</h3>
                        </CardHeader>
                        <CardBody>
                            {salaryStructures.filter(s => s.salary_component.type === 'earning').length === 0 ? (
                                <p className="text-center text-default-500 py-8">No earnings assigned</p>
                            ) : (
                                <div className="space-y-3">
                                    {salaryStructures
                                        .filter(s => s.salary_component.type === 'earning')
                                        .map((structure) => (
                                            <div key={structure.id} className="flex justify-between items-center py-2">
                                                <div>
                                                    <p className="font-medium">{structure.salary_component.name}</p>
                                                    <p className="text-xs text-default-400">
                                                        {structure.salary_component.calculation_type === 'percentage' 
                                                            ? `${structure.percentage_value || structure.salary_component.percentage_value}% of ${structure.salary_component.percentage_of}`
                                                            : 'Fixed amount'
                                                        }
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-success-600">
                                                    {formatCurrency(structure.amount || structure.salary_component.default_amount || 0)}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Deductions */}
                    <Card>
                        <CardHeader className="bg-danger-50 dark:bg-danger-900/20">
                            <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400">Deductions</h3>
                        </CardHeader>
                        <CardBody>
                            {salaryStructures.filter(s => s.salary_component.type === 'deduction').length === 0 ? (
                                <p className="text-center text-default-500 py-8">No deductions assigned</p>
                            ) : (
                                <div className="space-y-3">
                                    {salaryStructures
                                        .filter(s => s.salary_component.type === 'deduction')
                                        .map((structure) => (
                                            <div key={structure.id} className="flex justify-between items-center py-2">
                                                <div>
                                                    <p className="font-medium">{structure.salary_component.name}</p>
                                                    <p className="text-xs text-default-400">
                                                        {structure.salary_component.calculation_type === 'percentage' 
                                                            ? `${structure.percentage_value || structure.salary_component.percentage_value}% of ${structure.salary_component.percentage_of}`
                                                            : 'Fixed amount'
                                                        }
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-danger-600">
                                                    {formatCurrency(structure.amount || structure.salary_component.default_amount || 0)}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Assignment Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                size="5xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        <div>
                            <h2 className="text-xl font-bold">Assign Salary Structure</h2>
                            <p className="text-sm text-default-500 font-normal mt-1">{employee.name}</p>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-6">
                            {/* Effective Date */}
                            <Input
                                label="Effective From"
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                            />

                            <Divider />

                            {/* Components */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Salary Components</h3>
                                    <Button 
                                        size="sm" 
                                        color="primary" 
                                        variant="flat"
                                        startContent={<PlusIcon className="w-4 h-4" />}
                                        onPress={handleAddComponent}
                                    >
                                        Add Component
                                    </Button>
                                </div>

                                {selectedComponents.length === 0 ? (
                                    <div className="text-center py-8 text-default-500">
                                        No components added. Click "Add Component" to start.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedComponents.map((component, index) => (
                                            <Card key={index} className="border border-default-200">
                                                <CardBody>
                                                    <div className="grid grid-cols-12 gap-4 items-start">
                                                        <div className="col-span-4">
                                                            <Select
                                                                label="Component"
                                                                placeholder="Select component"
                                                                selectedKeys={component.salary_component_id ? [String(component.salary_component_id)] : []}
                                                                onChange={(e) => handleComponentChange(index, 'salary_component_id', e.target.value)}
                                                            >
                                                                {allComponents.map((comp) => (
                                                                    <SelectItem key={comp.id} value={comp.id}>
                                                                        {comp.name} ({comp.type})
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                        </div>

                                                        <div className="col-span-3">
                                                            <Select
                                                                label="Calculation Type"
                                                                selectedKeys={[component.calculation_type]}
                                                                onChange={(e) => handleComponentChange(index, 'calculation_type', e.target.value)}
                                                            >
                                                                <SelectItem key="fixed" value="fixed">Fixed</SelectItem>
                                                                <SelectItem key="percentage" value="percentage">Percentage</SelectItem>
                                                                <SelectItem key="formula" value="formula">Formula</SelectItem>
                                                            </Select>
                                                        </div>

                                                        {component.calculation_type === 'fixed' ? (
                                                            <div className="col-span-3">
                                                                <Input
                                                                    label="Amount"
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={component.amount}
                                                                    onChange={(e) => handleComponentChange(index, 'amount', e.target.value)}
                                                                    startContent={<span className="text-default-400">₹</span>}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="col-span-3">
                                                                <Input
                                                                    label="Percentage"
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={component.percentage_value}
                                                                    onChange={(e) => handleComponentChange(index, 'percentage_value', e.target.value)}
                                                                    endContent={<span className="text-default-400">%</span>}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="col-span-2 flex items-end justify-end">
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                color="danger"
                                                                variant="light"
                                                                onPress={() => handleRemoveComponent(index)}
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Preview */}
                            {selectedComponents.length > 0 && (
                                <>
                                    <Divider />
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Salary Preview</h3>
                                            <Button 
                                                size="sm" 
                                                color="secondary"
                                                variant="flat"
                                                onPress={calculatePreview}
                                                isLoading={isCalculating}
                                            >
                                                Calculate Preview
                                            </Button>
                                        </div>

                                        {preview && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <Card className="bg-success/5">
                                                    <CardBody>
                                                        <p className="text-sm text-default-500 mb-2">Total Earnings</p>
                                                        <p className="text-2xl font-bold text-success-600">
                                                            {formatCurrency(preview.total_earnings)}
                                                        </p>
                                                        <div className="mt-3 space-y-1">
                                                            {preview.earnings.map((earning, idx) => (
                                                                <div key={idx} className="flex justify-between text-sm">
                                                                    <span className="text-default-500">{earning.name}</span>
                                                                    <span className="font-medium">{formatCurrency(earning.amount)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                <Card className="bg-danger/5">
                                                    <CardBody>
                                                        <p className="text-sm text-default-500 mb-2">Total Deductions</p>
                                                        <p className="text-2xl font-bold text-danger-600">
                                                            {formatCurrency(preview.total_deductions)}
                                                        </p>
                                                        <div className="mt-3 space-y-1">
                                                            {preview.deductions.map((deduction, idx) => (
                                                                <div key={idx} className="flex justify-between text-sm">
                                                                    <span className="text-default-500">{deduction.name}</span>
                                                                    <span className="font-medium">{formatCurrency(deduction.amount)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                <Card className="col-span-2 bg-primary/5 border-2 border-primary/20">
                                                    <CardBody className="text-center">
                                                        <p className="text-sm text-default-500 mb-2">Net Salary</p>
                                                        <p className="text-3xl font-bold text-primary">
                                                            {formatCurrency(preview.net_salary)}
                                                        </p>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            Assign Salary Structure
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </App>
    );
}
