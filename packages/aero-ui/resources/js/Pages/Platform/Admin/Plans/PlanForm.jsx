import React, { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Select, SelectItem, Switch, Slider, Checkbox, Chip, Divider } from '@heroui/react';
import { ArrowLeftIcon, CheckIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import App from '@/Layouts/App.jsx';

const PlanForm = ({ plan = null, currencies = [], modules = [], features = [], title }) => {
    const { auth } = usePage().props;
    const isEdit = !!plan;

    // 1. Theme radius helper (REQUIRED)
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

    // 2. Responsive breakpoints (REQUIRED)
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

    const form = useForm({
        name: plan?.name || '',
        description: plan?.description || '',
        tier: plan?.tier || 'starter',
        status: plan?.status || 'active',
        visibility: plan?.visibility || 'public',
        
        currency: plan?.currency || 'USD',
        monthly_price: plan?.monthly_price || 0,
        annual_price: plan?.annual_price || 0,
        annual_discount: plan?.annual_discount || 20,
        multi_currency_enabled: plan?.multi_currency_enabled || false,
        volume_discounts_enabled: plan?.volume_discounts_enabled || false,
        
        trial_enabled: plan?.trial_enabled || false,
        trial_days: plan?.trial_days || 14,
        trial_features: plan?.trial_features || 'same',
        
        quotas: plan?.quotas || {
            users: { limit: 10, unlimited: false },
            storage: { limit: 10, unlimited: false },
            api_calls: { limit: 10000, unlimited: false },
            employees: { limit: 10, unlimited: false },
            projects: { limit: 5, unlimited: false }
        },
        
        modules: plan?.modules || [],
        enabled_features: plan?.enabled_features || [],
        
        stripe_product_id: plan?.stripe_product_id || '',
        stripe_monthly_price_id: plan?.stripe_monthly_price_id || '',
        stripe_annual_price_id: plan?.stripe_annual_price_id || '',
        
        auto_renewal: plan?.auto_renewal !== false,
        grace_period: plan?.grace_period || 7,
        downgrade_behavior: plan?.downgrade_behavior || 'keep_data',
        upgrade_behavior: plan?.upgrade_behavior || 'prorated',
        cancellation_policy: plan?.cancellation_policy || 'end_of_period',
        refund_policy: plan?.refund_policy || 'no_refunds'
    });

    useEffect(() => {
    }, []);

    useEffect(() => {
        if (form.data.monthly_price && !isEdit) {
            const annualPrice = form.data.monthly_price * 12 * (1 - form.data.annual_discount / 100);
            form.setData('annual_price', Math.round(annualPrice));
        }
    }, [form.data.monthly_price, form.data.annual_discount]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const promise = isEdit
            ? axios.put(route('admin.plans.update', plan.id), form.data)
            : axios.post(route('admin.plans.store'), form.data);

        showToast.promise(promise, {
            loading: isEdit ? 'Updating plan...' : 'Creating plan...',
            success: (response) => {
                router.visit(route('admin.plans.index'));
                return isEdit ? 'Plan updated successfully' : 'Plan created successfully';
            },
            error: (error) => {
                form.setErrors(error.response?.data?.errors || {});
                return error.response?.data?.message || 'Failed to save plan';
            }
        });
    };

    const handleModuleToggle = (moduleCode) => {
        const modules = form.data.modules.includes(moduleCode)
            ? form.data.modules.filter(m => m !== moduleCode)
            : [...form.data.modules, moduleCode];
        form.setData('modules', modules);
    };

    const handleFeatureToggle = (featureCode) => {
        const features = form.data.enabled_features.includes(featureCode)
            ? form.data.enabled_features.filter(f => f !== featureCode)
            : [...form.data.enabled_features, featureCode];
        form.setData('enabled_features', features);
    };

    const handleQuotaChange = (quotaType, field, value) => {
        form.setData('quotas', {
            ...form.data.quotas,
            [quotaType]: {
                ...form.data.quotas[quotaType],
                [field]: value
            }
        });
    };

    // RENDER STRUCTURE (CRITICAL - Follow LeavesAdmin.jsx exactly)
    return (
        <>
            <Head title={title || (isEdit ? `Edit Plan: ${plan.name}` : 'Create New Plan')} />
            
            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Plan Form"
            >
                <div className="space-y-4">
                    <div className="w-full max-w-5xl mx-auto">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
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
                                {/* Card Header with title + action buttons */}
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
                                            {/* Title Section with icon */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    radius={getThemeRadius()}
                                                    onPress={() => router.visit(route('admin.plans.index'))}
                                                    className="shrink-0"
                                                >
                                                    <ArrowLeftIcon className="w-5 h-5" />
                                                </Button>
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl flex items-center justify-center`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                        borderWidth: `var(--borderWidth, 2px)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CreditCardIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4
                                                        className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        {isEdit ? `Edit Plan: ${plan.name}` : 'Create New Plan'}
                                                    </h4>
                                                    <p
                                                        className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        {isEdit ? 'Update plan details and configuration' : 'Configure pricing, quotas, and features'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Basic Information */}
                                        <Card radius={getThemeRadius()}>
                                            <CardHeader className="border-b border-divider p-4">
                                                <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                                            </CardHeader>
                                            <CardBody className="p-4 space-y-4">
                                                <Input
                                                    label="Plan Name"
                                                    placeholder="e.g., Professional Plan"
                                                    value={form.data.name}
                                                    onValueChange={(value) => form.setData('name', value)}
                                                    isInvalid={!!form.errors.name}
                                                    errorMessage={form.errors.name}
                                                    isRequired
                                                    radius={getThemeRadius()}
                                                />
                                                <Textarea
                                                    label="Description"
                                                    placeholder="Describe the plan and its benefits"
                                                    value={form.data.description}
                                                    onValueChange={(value) => form.setData('description', value)}
                                                    isInvalid={!!form.errors.description}
                                                    errorMessage={form.errors.description}
                                                    radius={getThemeRadius()}
                                                    minRows={3}
                                                />
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <Select
                                                        label="Plan Tier"
                                                        selectedKeys={[form.data.tier]}
                                                        onSelectionChange={(keys) => form.setData('tier', Array.from(keys)[0])}
                                                        radius={getThemeRadius()}
                                                        isRequired
                                >
                                    <SelectItem key="free">Free</SelectItem>
                                    <SelectItem key="starter">Starter</SelectItem>
                                    <SelectItem key="professional">Professional</SelectItem>
                                    <SelectItem key="enterprise">Enterprise</SelectItem>
                                </Select>
                                <Select
                                    label="Status"
                                    selectedKeys={[form.data.status]}
                                    onSelectionChange={(keys) => form.setData('status', Array.from(keys)[0])}
                                    radius={getThemeRadius()}
                                >
                                    <SelectItem key="active">Active</SelectItem>
                                    <SelectItem key="archived">Archived</SelectItem>
                                </Select>
                                <Select
                                    label="Visibility"
                                    selectedKeys={[form.data.visibility]}
                                    onSelectionChange={(keys) => form.setData('visibility', Array.from(keys)[0])}
                                    radius={getThemeRadius()}
                                >
                                    <SelectItem key="public">Public</SelectItem>
                                    <SelectItem key="private">Private</SelectItem>
                                    <SelectItem key="hidden">Hidden</SelectItem>
                                </Select>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Pricing Configuration */}
                    <Card radius={getThemeRadius()}>
                        <CardHeader className="border-b border-divider p-4">
                            <h2 className="text-lg font-semibold text-foreground">Pricing Configuration</h2>
                        </CardHeader>
                        <CardBody className="p-4 space-y-4">
                            <Select
                                label="Base Currency"
                                selectedKeys={[form.data.currency]}
                                onSelectionChange={(keys) => form.setData('currency', Array.from(keys)[0])}
                                radius={getThemeRadius()}
                                isRequired
                            >
                                {currencies.map(curr => (
                                    <SelectItem key={curr.code}>{curr.name} ({curr.symbol})</SelectItem>
                                ))}
                            </Select>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Monthly Price"
                                    placeholder="0.00"
                                    value={form.data.monthly_price}
                                    onValueChange={(value) => form.setData('monthly_price', parseFloat(value) || 0)}
                                    startContent={<span className="text-default-400">$</span>}
                                    isInvalid={!!form.errors.monthly_price}
                                    errorMessage={form.errors.monthly_price}
                                    radius={getThemeRadius()}
                                    isRequired
                                />
                                <Input
                                    type="number"
                                    label="Annual Price"
                                    placeholder="0.00"
                                    value={form.data.annual_price}
                                    onValueChange={(value) => form.setData('annual_price', parseFloat(value) || 0)}
                                    startContent={<span className="text-default-400">$</span>}
                                    isInvalid={!!form.errors.annual_price}
                                    errorMessage={form.errors.annual_price}
                                    radius={getThemeRadius()}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Annual Discount: {form.data.annual_discount}%
                                </label>
                                <Slider
                                    value={form.data.annual_discount}
                                    onChange={(value) => form.setData('annual_discount', value)}
                                    minValue={0}
                                    maxValue={50}
                                    step={5}
                                    marks={[
                                        { value: 0, label: '0%' },
                                        { value: 20, label: '20%' },
                                        { value: 50, label: '50%' }
                                    ]}
                                    className="max-w-md"
                                />
                            </div>
                            <Divider className="my-2" />
                            <Switch
                                isSelected={form.data.multi_currency_enabled}
                                onValueChange={(value) => form.setData('multi_currency_enabled', value)}
                            >
                                Enable Multi-Currency Pricing
                            </Switch>
                            <Switch
                                isSelected={form.data.volume_discounts_enabled}
                                onValueChange={(value) => form.setData('volume_discounts_enabled', value)}
                            >
                                Enable Volume Discounts (10%@50, 15%@100, 20%@200+ users)
                            </Switch>
                        </CardBody>
                    </Card>

                    {/* Quota Limits */}
                    <Card radius={getThemeRadius()}>
                        <CardHeader className="border-b border-divider p-4">
                            <h2 className="text-lg font-semibold text-foreground">Quota Limits</h2>
                        </CardHeader>
                        <CardBody className="p-4 space-y-4">
                            {Object.entries(form.data.quotas).map(([quotaType, quota]) => (
                                <div key={quotaType} className="flex items-end gap-3">
                                    <Input
                                        label={quotaType.charAt(0).toUpperCase() + quotaType.slice(1).replace('_', ' ')}
                                        type="number"
                                        value={quota.limit}
                                        onValueChange={(value) => handleQuotaChange(quotaType, 'limit', parseInt(value) || 0)}
                                        isDisabled={quota.unlimited}
                                        radius={getThemeRadius()}
                                        className="flex-1"
                                    />
                                    <Checkbox
                                        isSelected={quota.unlimited}
                                        onValueChange={(value) => handleQuotaChange(quotaType, 'unlimited', value)}
                                    >
                                        Unlimited
                                    </Checkbox>
                                </div>
                            ))}
                        </CardBody>
                    </Card>

                    {/* Module Access */}
                    <Card radius={getThemeRadius()}>
                        <CardHeader className="border-b border-divider p-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-foreground">Module Access</h2>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius={getThemeRadius()}
                                    onPress={() => form.setData('modules', modules.map(m => m.code))}
                                >
                                    Select All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius={getThemeRadius()}
                                    onPress={() => form.setData('modules', [])}
                                >
                                    Clear All
                                    </Button>
                            </div>
                        </CardHeader>
                        <CardBody className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {modules.map((module) => (
                                    <Checkbox
                                        key={module.code}
                                        isSelected={form.data.modules.includes(module.code)}
                                        onValueChange={() => handleModuleToggle(module.code)}
                                    >
                                        <div>
                                            <p className="font-medium">{module.name}</p>
                                            <p className="text-xs text-default-500">{module.description}</p>
                                        </div>
                                    </Checkbox>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Feature Toggles */}
                    <Card radius={getThemeRadius()}>
                        <CardHeader className="border-b border-divider p-4">
                            <h2 className="text-lg font-semibold text-foreground">Feature Toggles</h2>
                        </CardHeader>
                        <CardBody className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {features.map((feature) => (
                                    <Checkbox
                                        key={feature.code}
                                        isSelected={form.data.enabled_features.includes(feature.code)}
                                        onValueChange={() => handleFeatureToggle(feature.code)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{feature.name}</span>
                                            <Chip size="sm" variant="flat" radius={getThemeRadius()}>
                                                {feature.category}
                                            </Chip>
                                        </div>
                                    </Checkbox>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Trial Period */}
                    <Card radius={getThemeRadius()}>
                        <CardHeader className="border-b border-divider p-4">
                            <h2 className="text-lg font-semibold text-foreground">Trial Period</h2>
                        </CardHeader>
                        <CardBody className="p-4 space-y-4">
                            <Switch
                                isSelected={form.data.trial_enabled}
                                onValueChange={(value) => form.setData('trial_enabled', value)}
                            >
                                Enable Trial Period
                            </Switch>
                            {form.data.trial_enabled && (
                                <>
                                    <Select
                                        label="Trial Duration"
                                        selectedKeys={[String(form.data.trial_days)]}
                                        onSelectionChange={(keys) => form.setData('trial_days', parseInt(Array.from(keys)[0]))}
                                        radius={getThemeRadius()}
                                    >
                                        <SelectItem key="7">7 days</SelectItem>
                                        <SelectItem key="14">14 days</SelectItem>
                                        <SelectItem key="30">30 days</SelectItem>
                                    </Select>
                                    <Select
                                        label="Trial Features"
                                        selectedKeys={[form.data.trial_features]}
                                        onSelectionChange={(keys) => form.setData('trial_features', Array.from(keys)[0])}
                                        radius={getThemeRadius()}
                                    >
                                        <SelectItem key="same">Same as paid plan</SelectItem>
                                        <SelectItem key="limited">Limited features</SelectItem>
                                    </Select>
                                </>
                            )}
                        </CardBody>
                    </Card>

                    {/* Stripe Integration */}
                    <Card radius={getThemeRadius()}>
                        <CardHeader className="border-b border-divider p-4">
                            <h2 className="text-lg font-semibold text-foreground">Stripe Integration</h2>
                        </CardHeader>
                        <CardBody className="p-4 space-y-4">
                            <Input
                                label="Stripe Product ID"
                                placeholder="prod_xxxxx"
                                value={form.data.stripe_product_id}
                                onValueChange={(value) => form.setData('stripe_product_id', value)}
                                radius={getThemeRadius()}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Monthly Price ID"
                                    placeholder="price_xxxxx"
                                    value={form.data.stripe_monthly_price_id}
                                    onValueChange={(value) => form.setData('stripe_monthly_price_id', value)}
                                    radius={getThemeRadius()}
                                />
                                <Input
                                    label="Annual Price ID"
                                    placeholder="price_xxxxx"
                                    value={form.data.stripe_annual_price_id}
                                    onValueChange={(value) => form.setData('stripe_annual_price_id', value)}
                                    radius={getThemeRadius()}
                                />
                            </div>
                        </CardBody>
                    </Card>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-3">
                                            <Button
                                                variant="flat"
                                                radius={getThemeRadius()}
                                                onPress={() => router.visit(route('admin.plans.index'))}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                color="primary"
                                                radius={getThemeRadius()}
                                                isLoading={form.processing}
                                                startContent={!form.processing && <CheckIcon className="w-5 h-5" />}
                                            >
                                                {isEdit ? 'Update Plan' : 'Create Plan'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

// REQUIRED: Use App layout wrapper
PlanForm.layout = (page) => <App>{page}</App>;
export default PlanForm;
