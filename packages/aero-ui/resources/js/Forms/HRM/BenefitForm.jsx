import React, { useState, useEffect } from 'react';
import {
    Input,
    Textarea,
    Select,
    SelectItem,
    Button,
    Switch,
    Divider
} from '@heroui/react';
import { GiftIcon, UserIcon } from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const defaultPlanData = {
    name: '',
    description: '',
    type: '',
    provider: '',
    coverage_amount: '',
    monthly_cost: '',
    employer_contribution: '',
    employee_contribution: '',
    eligibility_criteria: '',
    waiting_period_days: 0,
    is_active: true
};

const defaultEnrollmentData = {
    employee_id: '',
    benefit_plan_id: '',
    coverage_amount: '',
    monthly_cost: '',
    start_date: '',
    end_date: '',
    status: 'pending',
    notes: ''
};

export default function BenefitForm({
    benefit = null,
    employees = [],
    benefitPlans = [],
    benefitTypes = [],
    mode = 'enrollment', // 'plan' or 'enrollment'
    onSubmit,
    onCancel,
    isSubmitting = false
}) {
    const themeRadius = useThemeRadius();
    const isPlanMode = mode === 'plan' || mode === 'plans';
    const [formData, setFormData] = useState(isPlanMode ? defaultPlanData : defaultEnrollmentData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (benefit) {
            const defaultData = isPlanMode ? defaultPlanData : defaultEnrollmentData;
            setFormData({
                ...defaultData,
                ...benefit,
                employee_id: benefit.employee_id ? String(benefit.employee_id) : '',
                benefit_plan_id: benefit.benefit_plan_id ? String(benefit.benefit_plan_id) : ''
            });
        }
    }, [benefit, isPlanMode]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Auto-fill coverage and cost when plan is selected
    const handlePlanSelect = (planId) => {
        handleChange('benefit_plan_id', planId);
        const selectedPlan = benefitPlans.find(p => String(p.id) === planId);
        if (selectedPlan) {
            setFormData(prev => ({
                ...prev,
                benefit_plan_id: planId,
                coverage_amount: selectedPlan.coverage_amount || '',
                monthly_cost: selectedPlan.employee_contribution || selectedPlan.monthly_cost || ''
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (isPlanMode) {
            if (!formData.name?.trim()) newErrors.name = 'Plan name is required';
            if (!formData.type) newErrors.type = 'Benefit type is required';
        } else {
            if (!formData.employee_id) newErrors.employee_id = 'Please select an employee';
            if (!formData.benefit_plan_id) newErrors.benefit_plan_id = 'Please select a benefit plan';
            if (!formData.start_date) newErrors.start_date = 'Start date is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit?.(formData);
    };

    if (isPlanMode) {
        return (
            <div className="space-y-6">
                {/* Plan Basic Info */}
                <div className="space-y-4">
                    <Input
                        label="Plan Name"
                        placeholder="Enter plan name"
                        value={formData.name}
                        onValueChange={(value) => handleChange('name', value)}
                        isInvalid={!!errors.name}
                        errorMessage={errors.name}
                        isRequired
                        radius={themeRadius}
                        startContent={<GiftIcon className="w-4 h-4 text-default-400" />}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Benefit Type"
                            placeholder="Select type"
                            selectedKeys={formData.type ? [formData.type] : []}
                            onSelectionChange={(keys) => handleChange('type', Array.from(keys)[0])}
                            isInvalid={!!errors.type}
                            errorMessage={errors.type}
                            isRequired
                            radius={themeRadius}
                        >
                            {benefitTypes.map(type => (
                                <SelectItem key={type.key} value={type.key}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </Select>

                        <Input
                            label="Provider"
                            placeholder="Insurance provider name"
                            value={formData.provider}
                            onValueChange={(value) => handleChange('provider', value)}
                            radius={themeRadius}
                        />
                    </div>

                    <Textarea
                        label="Description"
                        placeholder="Describe the benefit plan..."
                        value={formData.description}
                        onValueChange={(value) => handleChange('description', value)}
                        radius={themeRadius}
                        minRows={2}
                    />
                </div>

                <Divider />

                {/* Financial Details */}
                <div className="space-y-4">
                    <h4 className="font-semibold">Financial Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Coverage Amount"
                            placeholder="0.00"
                            value={formData.coverage_amount}
                            onValueChange={(value) => handleChange('coverage_amount', value)}
                            radius={themeRadius}
                            startContent={<span className="text-default-400">$</span>}
                        />

                        <Input
                            type="number"
                            label="Total Monthly Cost"
                            placeholder="0.00"
                            value={formData.monthly_cost}
                            onValueChange={(value) => handleChange('monthly_cost', value)}
                            radius={themeRadius}
                            startContent={<span className="text-default-400">$</span>}
                        />

                        <Input
                            type="number"
                            label="Employer Contribution"
                            placeholder="0.00"
                            value={formData.employer_contribution}
                            onValueChange={(value) => handleChange('employer_contribution', value)}
                            radius={themeRadius}
                            startContent={<span className="text-default-400">$</span>}
                        />

                        <Input
                            type="number"
                            label="Employee Contribution"
                            placeholder="0.00"
                            value={formData.employee_contribution}
                            onValueChange={(value) => handleChange('employee_contribution', value)}
                            radius={themeRadius}
                            startContent={<span className="text-default-400">$</span>}
                        />
                    </div>
                </div>

                <Divider />

                {/* Eligibility */}
                <div className="space-y-4">
                    <h4 className="font-semibold">Eligibility & Settings</h4>
                    
                    <Textarea
                        label="Eligibility Criteria"
                        placeholder="Describe who is eligible for this plan..."
                        value={formData.eligibility_criteria}
                        onValueChange={(value) => handleChange('eligibility_criteria', value)}
                        radius={themeRadius}
                        minRows={2}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Waiting Period (Days)"
                            placeholder="0"
                            value={formData.waiting_period_days}
                            onValueChange={(value) => handleChange('waiting_period_days', value)}
                            radius={themeRadius}
                            min={0}
                        />

                        <div className="flex items-center gap-3 p-4 bg-content2 rounded-lg">
                            <Switch
                                isSelected={formData.is_active}
                                onValueChange={(value) => handleChange('is_active', value)}
                            />
                            <div>
                                <span className="text-sm font-medium">Active Plan</span>
                                <p className="text-xs text-default-400">Allow new enrollments</p>
                            </div>
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
                        {benefit ? 'Update Plan' : 'Create Plan'}
                    </Button>
                </div>
            </div>
        );
    }

    // Enrollment Form
    return (
        <div className="space-y-6">
            {/* Employee & Plan Selection */}
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
                    label="Benefit Plan"
                    placeholder="Select benefit plan"
                    selectedKeys={formData.benefit_plan_id ? [formData.benefit_plan_id] : []}
                    onSelectionChange={(keys) => handlePlanSelect(Array.from(keys)[0])}
                    isInvalid={!!errors.benefit_plan_id}
                    errorMessage={errors.benefit_plan_id}
                    isRequired
                    radius={themeRadius}
                    startContent={<GiftIcon className="w-4 h-4 text-default-400" />}
                >
                    {benefitPlans.map(plan => (
                        <SelectItem key={String(plan.id)} value={String(plan.id)}>
                            {plan.name} ({plan.type})
                        </SelectItem>
                    ))}
                </Select>
            </div>

            <Divider />

            {/* Coverage Details */}
            <div className="space-y-4">
                <h4 className="font-semibold">Coverage Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="number"
                        label="Coverage Amount"
                        placeholder="0.00"
                        value={formData.coverage_amount}
                        onValueChange={(value) => handleChange('coverage_amount', value)}
                        radius={themeRadius}
                        startContent={<span className="text-default-400">$</span>}
                    />

                    <Input
                        type="number"
                        label="Monthly Cost"
                        placeholder="0.00"
                        value={formData.monthly_cost}
                        onValueChange={(value) => handleChange('monthly_cost', value)}
                        radius={themeRadius}
                        startContent={<span className="text-default-400">$</span>}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Start Date"
                        value={formData.start_date}
                        onChange={(e) => handleChange('start_date', e.target.value)}
                        isInvalid={!!errors.start_date}
                        errorMessage={errors.start_date}
                        isRequired
                        radius={themeRadius}
                    />

                    <Input
                        type="date"
                        label="End Date (Optional)"
                        value={formData.end_date}
                        onChange={(e) => handleChange('end_date', e.target.value)}
                        radius={themeRadius}
                    />
                </div>

                <Select
                    label="Status"
                    placeholder="Select status"
                    selectedKeys={formData.status ? [formData.status] : ['pending']}
                    onSelectionChange={(keys) => handleChange('status', Array.from(keys)[0])}
                    radius={themeRadius}
                >
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="active">Active</SelectItem>
                    <SelectItem key="expired">Expired</SelectItem>
                    <SelectItem key="cancelled">Cancelled</SelectItem>
                </Select>

                <Textarea
                    label="Notes"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onValueChange={(value) => handleChange('notes', value)}
                    radius={themeRadius}
                    minRows={2}
                />
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
                    {benefit ? 'Update Enrollment' : 'Enroll Employee'}
                </Button>
            </div>
        </div>
    );
}
