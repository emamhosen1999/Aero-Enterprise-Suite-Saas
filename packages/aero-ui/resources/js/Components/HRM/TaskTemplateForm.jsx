import React, { useState, useEffect } from 'react';
import {
    Input,
    Textarea,
    Select,
    SelectItem,
    Button,
    Switch,
    Divider,
    Chip,
} from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import axios from 'axios';

/**
 * TaskTemplateForm
 *
 * Create or edit an HRM onboarding task template.
 *
 * Props:
 *   template   {Object|null}  - existing template to edit (null = create mode)
 *   departments {Array}       - available departments for assignment
 *   onCancel   {Function}     - close the form without saving
 *   onSaved    {Function}     - called after successful save with the saved template
 */
const TaskTemplateForm = ({
    template = null,
    departments = [],
    onCancel,
    onSaved,
}) => {
    const themeRadius = useThemeRadius();
    const isEdit = Boolean(template?.id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        department_id: '',
        is_active: true,
        tasks: [],
    });
    const [errors, setErrors] = useState({});

    // Populate form when editing
    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name ?? '',
                description: template.description ?? '',
                department_id: template.department_id ? String(template.department_id) : '',
                is_active: template.is_active ?? true,
                tasks: Array.isArray(template.tasks) ? template.tasks : [],
            });
        }
    }, [template]);

    const set = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const addTask = () => {
        setFormData(prev => ({
            ...prev,
            tasks: [...prev.tasks, { title: '', description: '', required: false, order: prev.tasks.length + 1 }],
        }));
    };

    const updateTask = (index, field, value) => {
        setFormData(prev => {
            const tasks = [...prev.tasks];
            tasks[index] = { ...tasks[index], [field]: value };
            return { ...prev, tasks };
        });
    };

    const removeTask = (index) => {
        setFormData(prev => ({
            ...prev,
            tasks: prev.tasks.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i + 1 })),
        }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Template name is required';
        const emptyTask = formData.tasks.findIndex(t => !t.title.trim());
        if (emptyTask !== -1) errs[`task_${emptyTask}_title`] = 'Task title is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const url = isEdit
                ? `/hrm/task-templates/${template.id}`
                : '/hrm/task-templates';
            const method = isEdit ? 'put' : 'post';
            const response = await axios[method](url, formData);
            showToast.success(isEdit ? 'Template updated successfully' : 'Template created successfully');
            onSaved?.(response.data?.template ?? response.data);
        } catch (error) {
            const serverErrors = error.response?.data?.errors;
            if (serverErrors) {
                setErrors(serverErrors);
            } else {
                showToast.error(error.response?.data?.message ?? 'Failed to save template');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Template Name"
                    placeholder="e.g. Developer Onboarding"
                    value={formData.name}
                    onValueChange={v => set('name', v)}
                    isInvalid={Boolean(errors.name)}
                    errorMessage={errors.name}
                    isRequired
                    radius={themeRadius}
                    variant="bordered"
                />
                <Select
                    label="Department (optional)"
                    placeholder="All Departments"
                    selectedKeys={formData.department_id ? [formData.department_id] : []}
                    onSelectionChange={keys => set('department_id', Array.from(keys)[0] ?? '')}
                    radius={themeRadius}
                    variant="bordered"
                >
                    <SelectItem key="">All Departments</SelectItem>
                    {departments.map(d => (
                        <SelectItem key={String(d.id)} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                </Select>
            </div>

            <Textarea
                label="Description"
                placeholder="Describe the purpose of this template..."
                value={formData.description}
                onValueChange={v => set('description', v)}
                radius={themeRadius}
                variant="bordered"
                minRows={2}
            />

            <div className="flex items-center gap-3">
                <Switch
                    isSelected={formData.is_active}
                    onValueChange={v => set('is_active', v)}
                    color="success"
                    size="sm"
                />
                <span className="text-sm text-foreground-600">Active template</span>
            </div>

            <Divider />

            {/* Tasks */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">
                        Tasks
                        {formData.tasks.length > 0 && (
                            <Chip size="sm" variant="flat" color="primary" className="ml-2">
                                {formData.tasks.length}
                            </Chip>
                        )}
                    </span>
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<PlusIcon className="w-3.5 h-3.5" />}
                        onPress={addTask}
                    >
                        Add Task
                    </Button>
                </div>

                {formData.tasks.length === 0 && (
                    <p className="text-sm text-default-400 text-center py-4 border-2 border-dashed border-default-200 rounded-lg">
                        No tasks yet. Click "Add Task" to get started.
                    </p>
                )}

                <div className="space-y-3">
                    {formData.tasks.map((task, index) => (
                        <div
                            key={index}
                            className="p-3 rounded-lg border border-divider bg-content2/40"
                        >
                            <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-2">
                                    <Input
                                        label={`Task ${index + 1} Title`}
                                        placeholder="Task title"
                                        value={task.title}
                                        onValueChange={v => updateTask(index, 'title', v)}
                                        isInvalid={Boolean(errors[`task_${index}_title`])}
                                        errorMessage={errors[`task_${index}_title`]}
                                        size="sm"
                                        radius={themeRadius}
                                        variant="bordered"
                                    />
                                    <Textarea
                                        label="Description (optional)"
                                        placeholder="Task description..."
                                        value={task.description ?? ''}
                                        onValueChange={v => updateTask(index, 'description', v)}
                                        size="sm"
                                        radius={themeRadius}
                                        variant="bordered"
                                        minRows={1}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            size="sm"
                                            isSelected={task.required}
                                            onValueChange={v => updateTask(index, 'required', v)}
                                            color="warning"
                                        />
                                        <span className="text-xs text-default-500">Required task</span>
                                    </div>
                                </div>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={() => removeTask(index)}
                                    className="mt-1 shrink-0"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 pt-2">
                <Button
                    variant="flat"
                    onPress={onCancel}
                    isDisabled={loading}
                    radius={themeRadius}
                >
                    Cancel
                </Button>
                <Button
                    color="primary"
                    onPress={handleSubmit}
                    isLoading={loading}
                    radius={themeRadius}
                >
                    {isEdit ? 'Update Template' : 'Create Template'}
                </Button>
            </div>
        </div>
    );
};

export default TaskTemplateForm;