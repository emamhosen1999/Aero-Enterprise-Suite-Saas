import React, { useState, useEffect } from 'react';
import {
    Input,
    Textarea,
    Select,
    SelectItem,
    Button,
    Slider,
    Card,
    CardBody,
    Divider
} from '@heroui/react';
import { PlusIcon, TrashIcon, FlagIcon } from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const defaultFormData = {
    title: '',
    description: '',
    employee_id: '',
    category: '',
    start_date: '',
    due_date: '',
    progress: 0,
    weight: 10,
    status: 'not_started',
    key_results: []
};

const statusOptions = [
    { key: 'not_started', label: 'Not Started' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'on_hold', label: 'On Hold' }
];

const categoryOptions = [
    { key: 'performance', label: 'Performance' },
    { key: 'learning', label: 'Learning & Development' },
    { key: 'project', label: 'Project' },
    { key: 'leadership', label: 'Leadership' },
    { key: 'innovation', label: 'Innovation' },
    { key: 'team', label: 'Team Collaboration' },
    { key: 'other', label: 'Other' }
];

export default function GoalForm({
    goal = null,
    employees = [],
    categories = [],
    onSubmit,
    onCancel,
    isSubmitting = false
}) {
    const themeRadius = useThemeRadius();
    const [formData, setFormData] = useState(defaultFormData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (goal) {
            setFormData({
                ...defaultFormData,
                ...goal,
                employee_id: goal.employee_id ? String(goal.employee_id) : '',
                key_results: goal.key_results || []
            });
        }
    }, [goal]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const addKeyResult = () => {
        setFormData(prev => ({
            ...prev,
            key_results: [
                ...prev.key_results,
                { id: Date.now(), title: '', target: '', completed: false }
            ]
        }));
    };

    const updateKeyResult = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            key_results: prev.key_results.map(kr =>
                kr.id === id ? { ...kr, [field]: value } : kr
            )
        }));
    };

    const removeKeyResult = (id) => {
        setFormData(prev => ({
            ...prev,
            key_results: prev.key_results.filter(kr => kr.id !== id)
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        if (!formData.employee_id) newErrors.employee_id = 'Please select an employee';
        if (!formData.due_date) newErrors.due_date = 'Due date is required';
        if (formData.start_date && formData.due_date && new Date(formData.start_date) > new Date(formData.due_date)) {
            newErrors.due_date = 'Due date must be after start date';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit?.(formData);
    };

    const allCategories = categories.length > 0 
        ? categories 
        : categoryOptions;

    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <Input
                    label="Goal Title"
                    placeholder="Enter goal title"
                    value={formData.title}
                    onValueChange={(value) => handleChange('title', value)}
                    isInvalid={!!errors.title}
                    errorMessage={errors.title}
                    isRequired
                    radius={themeRadius}
                    startContent={<FlagIcon className="w-4 h-4 text-default-400" />}
                />

                <Textarea
                    label="Description"
                    placeholder="Describe the goal and expected outcomes..."
                    value={formData.description}
                    onValueChange={(value) => handleChange('description', value)}
                    radius={themeRadius}
                    minRows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Employee"
                        placeholder="Select employee"
                        selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                        onSelectionChange={(keys) => handleChange('employee_id', Array.from(keys)[0])}
                        isInvalid={!!errors.employee_id}
                        errorMessage={errors.employee_id}
                        isRequired
                        radius={themeRadius}
                    >
                        {employees.map(emp => (
                            <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                {emp.name}
                            </SelectItem>
                        ))}
                    </Select>

                    <Select
                        label="Category"
                        placeholder="Select category"
                        selectedKeys={formData.category ? [formData.category] : []}
                        onSelectionChange={(keys) => handleChange('category', Array.from(keys)[0])}
                        radius={themeRadius}
                    >
                        {allCategories.map(cat => (
                            <SelectItem key={cat.key || cat.id} value={cat.key || cat.id}>
                                {cat.label || cat.name}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Start Date"
                        value={formData.start_date}
                        onChange={(e) => handleChange('start_date', e.target.value)}
                        radius={themeRadius}
                    />

                    <Input
                        type="date"
                        label="Due Date"
                        value={formData.due_date}
                        onChange={(e) => handleChange('due_date', e.target.value)}
                        isInvalid={!!errors.due_date}
                        errorMessage={errors.due_date}
                        isRequired
                        radius={themeRadius}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Status"
                        placeholder="Select status"
                        selectedKeys={formData.status ? [formData.status] : ['not_started']}
                        onSelectionChange={(keys) => handleChange('status', Array.from(keys)[0])}
                        radius={themeRadius}
                    >
                        {statusOptions.map(status => (
                            <SelectItem key={status.key} value={status.key}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </Select>

                    <div>
                        <label className="text-sm text-foreground mb-2 block">
                            Weight: {formData.weight}%
                        </label>
                        <Slider
                            size="sm"
                            step={5}
                            minValue={0}
                            maxValue={100}
                            value={formData.weight}
                            onChange={(value) => handleChange('weight', value)}
                            className="max-w-full"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm text-foreground mb-2 block">
                        Progress: {formData.progress}%
                    </label>
                    <Slider
                        size="md"
                        step={5}
                        minValue={0}
                        maxValue={100}
                        value={formData.progress}
                        onChange={(value) => handleChange('progress', value)}
                        color={formData.progress >= 100 ? 'success' : formData.progress >= 50 ? 'primary' : 'warning'}
                        className="max-w-full"
                    />
                </div>
            </div>

            <Divider />

            {/* Key Results (OKR) */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="font-semibold">Key Results</h4>
                        <p className="text-sm text-default-500">Define measurable outcomes for this goal</p>
                    </div>
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={addKeyResult}
                    >
                        Add Key Result
                    </Button>
                </div>

                {formData.key_results.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-8">
                            <p className="text-default-500">No key results added yet</p>
                            <p className="text-sm text-default-400">Key results help track progress toward this goal</p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {formData.key_results.map((kr, index) => (
                            <Card key={kr.id}>
                                <CardBody className="p-4">
                                    <div className="flex gap-3 items-start">
                                        <span className="text-sm text-default-500 font-medium mt-2">
                                            KR{index + 1}
                                        </span>
                                        <div className="flex-1 space-y-3">
                                            <Input
                                                placeholder="Key result description"
                                                value={kr.title}
                                                onValueChange={(value) => updateKeyResult(kr.id, 'title', value)}
                                                size="sm"
                                                radius={themeRadius}
                                            />
                                            <Input
                                                placeholder="Target metric (e.g., '100 customers', '50% increase')"
                                                value={kr.target}
                                                onValueChange={(value) => updateKeyResult(kr.id, 'target', value)}
                                                size="sm"
                                                radius={themeRadius}
                                            />
                                        </div>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => removeKeyResult(kr.id)}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Divider />

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="flat" onPress={onCancel}>
                    Cancel
                </Button>
                <Button 
                    color="primary" 
                    onPress={handleSubmit}
                    isLoading={isSubmitting}
                >
                    {goal ? 'Update Goal' : 'Create Goal'}
                </Button>
            </div>
        </div>
    );
}
