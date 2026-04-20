import React, { useState, useEffect } from 'react';
import {
    Input,
    Textarea,
    Select,
    SelectItem,
    Button,
    Slider,
    Switch,
    Divider
} from '@heroui/react';
import { SparklesIcon, UserIcon } from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const defaultLibraryData = {
    name: '',
    description: '',
    category: '',
    is_required: false,
    tags: ''
};

const defaultEmployeeSkillData = {
    employee_id: '',
    skill_id: '',
    level: 'beginner',
    proficiency: 50,
    years_experience: 0,
    certification: '',
    certification_date: '',
    expiry_date: '',
    last_used: '',
    notes: '',
    is_verified: false
};

export default function SkillForm({
    skill = null,
    employees = [],
    skills = [],
    categories = [],
    levels = [],
    mode = 'employee', // 'library' or 'employee'
    onSubmit,
    onCancel,
    isSubmitting = false
}) {
    const themeRadius = useThemeRadius();
    const isLibraryMode = mode === 'library';
    const [formData, setFormData] = useState(isLibraryMode ? defaultLibraryData : defaultEmployeeSkillData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (skill) {
            const defaultData = isLibraryMode ? defaultLibraryData : defaultEmployeeSkillData;
            setFormData({
                ...defaultData,
                ...skill,
                employee_id: skill.employee_id ? String(skill.employee_id) : '',
                skill_id: skill.skill_id ? String(skill.skill_id) : ''
            });
        }
    }, [skill, isLibraryMode]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (isLibraryMode) {
            if (!formData.name?.trim()) newErrors.name = 'Skill name is required';
            if (!formData.category) newErrors.category = 'Category is required';
        } else {
            if (!formData.employee_id) newErrors.employee_id = 'Please select an employee';
            if (!formData.skill_id) newErrors.skill_id = 'Please select a skill';
            if (!formData.level) newErrors.level = 'Level is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit?.(formData);
    };

    if (isLibraryMode) {
        return (
            <div className="space-y-6">
                {/* Skill Library Form */}
                <div className="space-y-4">
                    <Input
                        label="Skill Name"
                        placeholder="Enter skill name"
                        value={formData.name}
                        onValueChange={(value) => handleChange('name', value)}
                        isInvalid={!!errors.name}
                        errorMessage={errors.name}
                        isRequired
                        radius={themeRadius}
                        startContent={<SparklesIcon className="w-4 h-4 text-default-400" />}
                    />

                    <Select
                        label="Category"
                        placeholder="Select category"
                        selectedKeys={formData.category ? [formData.category] : []}
                        onSelectionChange={(keys) => handleChange('category', Array.from(keys)[0])}
                        isInvalid={!!errors.category}
                        errorMessage={errors.category}
                        isRequired
                        radius={themeRadius}
                    >
                        {categories.map(cat => (
                            <SelectItem key={cat.key} value={cat.key}>
                                {cat.label}
                            </SelectItem>
                        ))}
                    </Select>

                    <Textarea
                        label="Description"
                        placeholder="Describe this skill..."
                        value={formData.description}
                        onValueChange={(value) => handleChange('description', value)}
                        radius={themeRadius}
                        minRows={3}
                    />

                    <Input
                        label="Tags"
                        placeholder="Enter tags separated by commas"
                        value={formData.tags}
                        onValueChange={(value) => handleChange('tags', value)}
                        radius={themeRadius}
                        description="Example: python, backend, api, rest"
                    />

                    <div className="flex items-center gap-3 p-4 bg-content2 rounded-lg">
                        <Switch
                            isSelected={formData.is_required}
                            onValueChange={(value) => handleChange('is_required', value)}
                        />
                        <div>
                            <span className="text-sm font-medium">Required Skill</span>
                            <p className="text-xs text-default-400">Mark as a core/required skill for the organization</p>
                        </div>
                    </div>
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
                        {skill ? 'Update Skill' : 'Add Skill'}
                    </Button>
                </div>
            </div>
        );
    }

    // Employee Skill Form
    return (
        <div className="space-y-6">
            {/* Employee & Skill Selection */}
            <div className="space-y-4">
                <Select
                    label="Employee"
                    placeholder="Select employee"
                    selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                    onSelectionChange={(keys) => handleChange('employee_id', Array.from(keys)[0])}
                    isInvalid={!!errors.employee_id}
                    errorMessage={errors.employee_id}
                    isRequired
                    radius={themeRadius}
                    startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                >
                    {employees.map(emp => (
                        <SelectItem key={String(emp.id)} value={String(emp.id)}>
                            {emp.name}
                        </SelectItem>
                    ))}
                </Select>

                <Select
                    label="Skill"
                    placeholder="Select skill"
                    selectedKeys={formData.skill_id ? [formData.skill_id] : []}
                    onSelectionChange={(keys) => handleChange('skill_id', Array.from(keys)[0])}
                    isInvalid={!!errors.skill_id}
                    errorMessage={errors.skill_id}
                    isRequired
                    radius={themeRadius}
                    startContent={<SparklesIcon className="w-4 h-4 text-default-400" />}
                >
                    {skills.map(s => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                            {s.name} ({s.category})
                        </SelectItem>
                    ))}
                </Select>
            </div>

            <Divider />

            {/* Skill Details */}
            <div className="space-y-4">
                <h4 className="font-semibold">Skill Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Proficiency Level"
                        placeholder="Select level"
                        selectedKeys={formData.level ? [formData.level] : []}
                        onSelectionChange={(keys) => handleChange('level', Array.from(keys)[0])}
                        isInvalid={!!errors.level}
                        errorMessage={errors.level}
                        isRequired
                        radius={themeRadius}
                    >
                        {levels.map(level => (
                            <SelectItem key={level.key} value={level.key}>
                                {level.label}
                            </SelectItem>
                        ))}
                    </Select>

                    <Input
                        type="number"
                        label="Years of Experience"
                        placeholder="0"
                        value={formData.years_experience}
                        onValueChange={(value) => handleChange('years_experience', value)}
                        radius={themeRadius}
                        min={0}
                        max={50}
                    />
                </div>

                <div>
                    <label className="text-sm text-foreground mb-2 block">
                        Proficiency: {formData.proficiency}%
                    </label>
                    <Slider
                        size="md"
                        step={5}
                        minValue={0}
                        maxValue={100}
                        value={formData.proficiency}
                        onChange={(value) => handleChange('proficiency', value)}
                        color={formData.proficiency >= 80 ? 'success' : formData.proficiency >= 50 ? 'primary' : 'warning'}
                        className="max-w-full"
                        marks={[
                            { value: 25, label: '25%' },
                            { value: 50, label: '50%' },
                            { value: 75, label: '75%' },
                            { value: 100, label: '100%' }
                        ]}
                    />
                </div>

                <Input
                    type="date"
                    label="Last Used"
                    value={formData.last_used}
                    onChange={(e) => handleChange('last_used', e.target.value)}
                    radius={themeRadius}
                />
            </div>

            <Divider />

            {/* Certification */}
            <div className="space-y-4">
                <h4 className="font-semibold">Certification (Optional)</h4>
                
                <Input
                    label="Certification Name"
                    placeholder="e.g., AWS Solutions Architect"
                    value={formData.certification}
                    onValueChange={(value) => handleChange('certification', value)}
                    radius={themeRadius}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Certification Date"
                        value={formData.certification_date}
                        onChange={(e) => handleChange('certification_date', e.target.value)}
                        radius={themeRadius}
                    />

                    <Input
                        type="date"
                        label="Expiry Date"
                        value={formData.expiry_date}
                        onChange={(e) => handleChange('expiry_date', e.target.value)}
                        radius={themeRadius}
                    />
                </div>
            </div>

            <Divider />

            {/* Notes & Verification */}
            <div className="space-y-4">
                <Textarea
                    label="Notes"
                    placeholder="Additional notes about this skill..."
                    value={formData.notes}
                    onValueChange={(value) => handleChange('notes', value)}
                    radius={themeRadius}
                    minRows={2}
                />

                <div className="flex items-center gap-3 p-4 bg-content2 rounded-lg">
                    <Switch
                        isSelected={formData.is_verified}
                        onValueChange={(value) => handleChange('is_verified', value)}
                    />
                    <div>
                        <span className="text-sm font-medium">Verified Skill</span>
                        <p className="text-xs text-default-400">Mark this skill as verified by a manager</p>
                    </div>
                </div>
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
                    {skill ? 'Update Skill' : 'Assign Skill'}
                </Button>
            </div>
        </div>
    );
}
