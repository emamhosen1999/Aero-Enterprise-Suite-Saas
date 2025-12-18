import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea, Checkbox, Progress, Card, CardBody, Chip } from "@heroui/react";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function OnboardingWizard({ open, onClose, plans = [], templates = [] }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Step 1: Basic Info
    const [basicInfo, setBasicInfo] = useState({
        tenant_name: '',
        subdomain: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
    });
    
    // Step 2: Plan Selection
    const [planInfo, setPlanInfo] = useState({
        plan_id: '',
        billing_cycle: 'monthly',
        trial_enabled: true,
        trial_days: 14,
    });
    
    // Step 3: Configuration
    const [configInfo, setConfigInfo] = useState({
        template_id: '',
        modules: [],
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
    });
    
    // Step 4: Database & Resources
    const [resourceInfo, setResourceInfo] = useState({
        database_name: '',
        max_users: 50,
        storage_limit: 10,
        enable_backups: true,
    });

    const [errors, setErrors] = useState({});

    // Get theme radius
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    const steps = [
        { number: 1, title: 'Basic Information', icon: '📋' },
        { number: 2, title: 'Plan Selection', icon: '💎' },
        { number: 3, title: 'Configuration', icon: '⚙️' },
        { number: 4, title: 'Resources', icon: '🗄️' },
        { number: 5, title: 'Review & Submit', icon: '✅' },
    ];

    const validateStep = (step) => {
        const newErrors = {};
        
        if (step === 1) {
            if (!basicInfo.tenant_name) newErrors.tenant_name = 'Tenant name is required';
            if (!basicInfo.subdomain) newErrors.subdomain = 'Subdomain is required';
            if (!basicInfo.admin_email) newErrors.admin_email = 'Admin email is required';
            if (!basicInfo.admin_name) newErrors.admin_name = 'Admin name is required';
        } else if (step === 2) {
            if (!planInfo.plan_id) newErrors.plan_id = 'Plan selection is required';
        } else if (step === 3) {
            if (!configInfo.timezone) newErrors.timezone = 'Timezone is required';
        } else if (step === 4) {
            if (!resourceInfo.database_name) newErrors.database_name = 'Database name is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
        setErrors({});
    };

    const handleSubmit = async () => {
        setLoading(true);

        const data = {
            ...basicInfo,
            ...planInfo,
            ...configInfo,
            ...resourceInfo,
        };

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.create'), data);
                resolve([response.data.message || 'Tenant onboarding initiated successfully']);
                setTimeout(() => {
                    handleClose();
                    router.reload({ only: ['tenants'] });
                }, 1000);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to initiate onboarding']);
            }
        });

        showToast.promise(promise, {
            loading: 'Initiating tenant onboarding...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        promise.finally(() => setLoading(false));
    };

    const handleClose = () => {
        setCurrentStep(1);
        setBasicInfo({ tenant_name: '', subdomain: '', admin_name: '', admin_email: '', admin_phone: '' });
        setPlanInfo({ plan_id: '', billing_cycle: 'monthly', trial_enabled: true, trial_days: 14 });
        setConfigInfo({ template_id: '', modules: [], timezone: 'UTC', language: 'en', currency: 'USD' });
        setResourceInfo({ database_name: '', max_users: 50, storage_limit: 10, enable_backups: true });
        setErrors({});
        onClose();
    };

    const selectedPlan = plans.find(p => p.id === parseInt(planInfo.plan_id));

    return (
        <Modal 
            isOpen={open} 
            onOpenChange={handleClose}
            size="3xl"
            scrollBehavior="inside"
            isDismissable={!loading}
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">New Tenant Onboarding</h2>
                    <p className="text-sm text-default-500 font-normal">
                        Step {currentStep} of {steps.length}
                    </p>
                </ModalHeader>
                
                <ModalBody>
                    {/* Progress Steps */}
                    <div className="flex justify-between mb-6">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex flex-col items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 transition-colors ${
                                    currentStep > step.number 
                                        ? 'bg-success text-white' 
                                        : currentStep === step.number 
                                        ? 'bg-primary text-white' 
                                        : 'bg-default-100 text-default-400'
                                }`}>
                                    {currentStep > step.number ? <CheckCircleIcon className="w-6 h-6" /> : step.icon}
                                </div>
                                <span className={`text-xs text-center ${currentStep >= step.number ? 'text-foreground' : 'text-default-400'}`}>
                                    {step.title}
                                </span>
                                {index < steps.length - 1 && (
                                    <div className={`h-0.5 w-full mt-5 absolute left-1/2 -z-10 ${
                                        currentStep > step.number ? 'bg-success' : 'bg-default-200'
                                    }`} style={{ width: 'calc(100% / 5)' }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <Progress 
                        value={(currentStep / steps.length) * 100} 
                        color="primary"
                        className="mb-6"
                    />

                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <Input
                                label="Tenant Name"
                                placeholder="Enter tenant name"
                                value={basicInfo.tenant_name}
                                onValueChange={(value) => setBasicInfo({ ...basicInfo, tenant_name: value })}
                                isInvalid={!!errors.tenant_name}
                                errorMessage={errors.tenant_name}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Input
                                label="Subdomain"
                                placeholder="subdomain"
                                value={basicInfo.subdomain}
                                onValueChange={(value) => setBasicInfo({ ...basicInfo, subdomain: value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                isInvalid={!!errors.subdomain}
                                errorMessage={errors.subdomain}
                                description="Only lowercase letters, numbers, and hyphens"
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                endContent={<span className="text-default-400 text-sm">.yourdomain.com</span>}
                            />
                            
                            <Input
                                label="Admin Name"
                                placeholder="Enter admin name"
                                value={basicInfo.admin_name}
                                onValueChange={(value) => setBasicInfo({ ...basicInfo, admin_name: value })}
                                isInvalid={!!errors.admin_name}
                                errorMessage={errors.admin_name}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Input
                                type="email"
                                label="Admin Email"
                                placeholder="admin@example.com"
                                value={basicInfo.admin_email}
                                onValueChange={(value) => setBasicInfo({ ...basicInfo, admin_email: value })}
                                isInvalid={!!errors.admin_email}
                                errorMessage={errors.admin_email}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Input
                                type="tel"
                                label="Admin Phone"
                                placeholder="+1 (555) 000-0000"
                                value={basicInfo.admin_phone}
                                onValueChange={(value) => setBasicInfo({ ...basicInfo, admin_phone: value })}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </div>
                    )}

                    {/* Step 2: Plan Selection */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <Select
                                label="Select Plan"
                                placeholder="Choose a subscription plan"
                                selectedKeys={planInfo.plan_id ? [String(planInfo.plan_id)] : []}
                                onSelectionChange={(keys) => setPlanInfo({ ...planInfo, plan_id: Array.from(keys)[0] })}
                                isInvalid={!!errors.plan_id}
                                errorMessage={errors.plan_id}
                                isRequired
                                radius={themeRadius}
                                classNames={{ trigger: "bg-default-100" }}
                            >
                                {plans.map(plan => (
                                    <SelectItem key={String(plan.id)} textValue={plan.name}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{plan.name}</p>
                                                <p className="text-xs text-default-400">{plan.description}</p>
                                            </div>
                                            <Chip size="sm" color="primary" variant="flat">
                                                ${plan.price}/{plan.billing_cycle}
                                            </Chip>
                                        </div>
                                    </SelectItem>
                                ))}
                            </Select>
                            
                            {selectedPlan && (
                                <Card>
                                    <CardBody>
                                        <h4 className="font-semibold mb-2">Plan Products</h4>
                                        <ul className="space-y-1 text-sm">
                                            {selectedPlan.features?.map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                    <CheckCircleIcon className="w-4 h-4 text-success" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardBody>
                                </Card>
                            )}
                            
                            <Select
                                label="Billing Cycle"
                                selectedKeys={[planInfo.billing_cycle]}
                                onSelectionChange={(keys) => setPlanInfo({ ...planInfo, billing_cycle: Array.from(keys)[0] })}
                                radius={themeRadius}
                                classNames={{ trigger: "bg-default-100" }}
                            >
                                <SelectItem key="monthly">Monthly</SelectItem>
                                <SelectItem key="yearly">Yearly (Save 20%)</SelectItem>
                            </Select>
                            
                            <Checkbox
                                isSelected={planInfo.trial_enabled}
                                onValueChange={(checked) => setPlanInfo({ ...planInfo, trial_enabled: checked })}
                                radius={themeRadius}
                            >
                                Enable Trial Period
                            </Checkbox>
                            
                            {planInfo.trial_enabled && (
                                <Input
                                    type="number"
                                    label="Trial Days"
                                    value={String(planInfo.trial_days)}
                                    onChange={(e) => setPlanInfo({ ...planInfo, trial_days: parseInt(e.target.value) || 14 })}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            )}
                        </div>
                    )}

                    {/* Step 3: Configuration */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <Select
                                label="Configuration Template"
                                placeholder="Select a template (optional)"
                                selectedKeys={configInfo.template_id ? [String(configInfo.template_id)] : []}
                                onSelectionChange={(keys) => setConfigInfo({ ...configInfo, template_id: Array.from(keys)[0] })}
                                radius={themeRadius}
                                classNames={{ trigger: "bg-default-100" }}
                            >
                                <SelectItem key="">None (Default)</SelectItem>
                                {templates.map(template => (
                                    <SelectItem key={String(template.id)}>{template.name}</SelectItem>
                                ))}
                            </Select>
                            
                            <Select
                                label="Timezone"
                                selectedKeys={[configInfo.timezone]}
                                onSelectionChange={(keys) => setConfigInfo({ ...configInfo, timezone: Array.from(keys)[0] })}
                                isRequired
                                radius={themeRadius}
                                classNames={{ trigger: "bg-default-100" }}
                            >
                                <SelectItem key="UTC">UTC</SelectItem>
                                <SelectItem key="America/New_York">Eastern Time</SelectItem>
                                <SelectItem key="America/Chicago">Central Time</SelectItem>
                                <SelectItem key="America/Denver">Mountain Time</SelectItem>
                                <SelectItem key="America/Los_Angeles">Pacific Time</SelectItem>
                            </Select>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Language"
                                    selectedKeys={[configInfo.language]}
                                    onSelectionChange={(keys) => setConfigInfo({ ...configInfo, language: Array.from(keys)[0] })}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    <SelectItem key="en">English</SelectItem>
                                    <SelectItem key="es">Spanish</SelectItem>
                                    <SelectItem key="fr">French</SelectItem>
                                </Select>
                                
                                <Select
                                    label="Currency"
                                    selectedKeys={[configInfo.currency]}
                                    onSelectionChange={(keys) => setConfigInfo({ ...configInfo, currency: Array.from(keys)[0] })}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    <SelectItem key="USD">USD ($)</SelectItem>
                                    <SelectItem key="EUR">EUR (€)</SelectItem>
                                    <SelectItem key="GBP">GBP (£)</SelectItem>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Resources */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <Input
                                label="Database Name"
                                placeholder="tenant_database"
                                value={resourceInfo.database_name}
                                onValueChange={(value) => setResourceInfo({ ...resourceInfo, database_name: value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                isInvalid={!!errors.database_name}
                                errorMessage={errors.database_name}
                                description="Only lowercase letters, numbers, and underscores"
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Input
                                type="number"
                                label="Maximum Users"
                                value={String(resourceInfo.max_users)}
                                onChange={(e) => setResourceInfo({ ...resourceInfo, max_users: parseInt(e.target.value) || 50 })}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Input
                                type="number"
                                label="Storage Limit (GB)"
                                value={String(resourceInfo.storage_limit)}
                                onChange={(e) => setResourceInfo({ ...resourceInfo, storage_limit: parseInt(e.target.value) || 10 })}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Checkbox
                                isSelected={resourceInfo.enable_backups}
                                onValueChange={(checked) => setResourceInfo({ ...resourceInfo, enable_backups: checked })}
                                radius={themeRadius}
                            >
                                Enable Automated Backups
                            </Checkbox>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <Card>
                                <CardBody className="space-y-3">
                                    <h4 className="font-semibold">Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-default-500">Tenant:</span>
                                        <span className="font-medium">{basicInfo.tenant_name}</span>
                                        <span className="text-default-500">Subdomain:</span>
                                        <span className="font-medium">{basicInfo.subdomain}.yourdomain.com</span>
                                        <span className="text-default-500">Admin:</span>
                                        <span className="font-medium">{basicInfo.admin_name}</span>
                                        <span className="text-default-500">Email:</span>
                                        <span className="font-medium">{basicInfo.admin_email}</span>
                                    </div>
                                </CardBody>
                            </Card>
                            
                            <Card>
                                <CardBody className="space-y-3">
                                    <h4 className="font-semibold">Plan & Billing</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-default-500">Plan:</span>
                                        <span className="font-medium">{selectedPlan?.name}</span>
                                        <span className="text-default-500">Billing:</span>
                                        <span className="font-medium">{planInfo.billing_cycle}</span>
                                        <span className="text-default-500">Trial:</span>
                                        <span className="font-medium">
                                            {planInfo.trial_enabled ? `${planInfo.trial_days} days` : 'Disabled'}
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                            
                            <Card>
                                <CardBody className="space-y-3">
                                    <h4 className="font-semibold">Resources</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-default-500">Database:</span>
                                        <span className="font-medium">{resourceInfo.database_name}</span>
                                        <span className="text-default-500">Max Users:</span>
                                        <span className="font-medium">{resourceInfo.max_users}</span>
                                        <span className="text-default-500">Storage:</span>
                                        <span className="font-medium">{resourceInfo.storage_limit} GB</span>
                                        <span className="text-default-500">Backups:</span>
                                        <span className="font-medium">{resourceInfo.enable_backups ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </ModalBody>
                
                <ModalFooter>
                    {currentStep > 1 && (
                        <Button 
                            variant="flat" 
                            onPress={handleBack}
                            isDisabled={loading}
                            radius={themeRadius}
                        >
                            Back
                        </Button>
                    )}
                    
                    <Button 
                        variant="flat" 
                        onPress={handleClose}
                        isDisabled={loading}
                        radius={themeRadius}
                    >
                        Cancel
                    </Button>
                    
                    {currentStep < steps.length && (
                        <Button 
                            color="primary" 
                            onPress={handleNext}
                            isDisabled={loading}
                            radius={themeRadius}
                        >
                            Next
                        </Button>
                    )}
                    
                    {currentStep === steps.length && (
                        <Button 
                            color="primary" 
                            onPress={handleSubmit}
                            isLoading={loading}
                            radius={themeRadius}
                        >
                            Start Onboarding
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
