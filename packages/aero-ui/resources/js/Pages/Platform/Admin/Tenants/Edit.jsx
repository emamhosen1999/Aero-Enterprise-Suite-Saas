import { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Chip,
    Skeleton,
    Switch,
    Divider,
} from "@heroui/react";
import {
    PencilIcon,
    ArrowLeftIcon,
    BuildingOfficeIcon,
    GlobeAltIcon,
    CreditCardIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import App from "@/Layouts/App.jsx";
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

const Edit = ({ auth, tenantId, title }) => {
    // Theme radius helper (REQUIRED)
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

    // Responsive breakpoints (REQUIRED)
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

    const [tenant, setTenant] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        plan_id: '',
        trial_ends_at: '',
        subscription_ends_at: '',
    });
    
    const [errors, setErrors] = useState({});

    const fetchTenant = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.v1.tenants.show', { tenant: tenantId }));
            const data = response.data.data;
            setTenant(data);
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                plan_id: data.plan_id ? String(data.plan_id) : '',
                trial_ends_at: data.trial_ends_at ? data.trial_ends_at.split('T')[0] : '',
                subscription_ends_at: data.subscription_ends_at ? data.subscription_ends_at.split('T')[0] : '',
            });
        } catch (error) {
            showToast.error('Failed to load tenant');
            router.visit(route('admin.tenants.index'));
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(route('api.v1.plans.index'));
            setPlans(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    };

    useEffect(() => {
        fetchTenant();
        fetchPlans();
    }, [fetchTenant]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('api.v1.tenants.update', { tenant: tenantId }), {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || null,
                    plan_id: formData.plan_id || undefined,
                    trial_ends_at: formData.trial_ends_at || null,
                    subscription_ends_at: formData.subscription_ends_at || null,
                });
                setTenant(response.data.data);
                resolve([response.data.message || 'Tenant updated successfully']);
            } catch (error) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                reject(error.response?.data?.message || 'Failed to update tenant');
            } finally {
                setSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving changes...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const statusColorMap = {
        active: 'success',
        suspended: 'warning',
        pending: 'primary',
        provisioning: 'secondary',
        failed: 'danger',
        archived: 'default',
    };

    if (loading) {
        return (
            <>
                <Head title="Edit Tenant" />
                <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Edit Tenant">
                    <div className="space-y-4">
                        <div className="w-full">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card
                                    className="transition-all duration-200"
                                    style={{
                                        border: `var(--borderWidth, 2px) solid transparent`,
                                        borderRadius: `var(--borderRadius, 12px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                        background: `linear-gradient(135deg, 
                                            var(--theme-content1, #FAFAFA) 20%, 
                                            var(--theme-content2, #F4F4F5) 10%, 
                                            var(--theme-content3, #F1F3F4) 20%)`,
                                    }}
                                >
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
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="w-10 h-10 rounded-lg" />
                                                <Skeleton className="w-14 h-14 rounded-xl" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-7 w-48 rounded" />
                                                    <Skeleton className="h-4 w-64 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2 space-y-6">
                                                <ThemedCard>
                                                    <ThemedCardBody>
                                                        <div className="space-y-4">
                                                            <Skeleton className="h-10 rounded-lg" />
                                                            <Skeleton className="h-10 rounded-lg" />
                                                            <Skeleton className="h-10 rounded-lg" />
                                                        </div>
                                                    </ThemedCardBody>
                                                </ThemedCard>
                                            </div>
                                            <div>
                                                <ThemedCard>
                                                    <ThemedCardBody>
                                                        <Skeleton className="h-32 rounded-lg" />
                                                    </ThemedCardBody>
                                                </ThemedCard>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={title || `Edit ${tenant?.name || 'Tenant'}`} />
            
            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Edit Tenant"
            >
                <div className="space-y-4">
                    <div className="w-full">
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
                                                    onPress={() => router.visit(route('admin.tenants.show', { tenant: tenantId }))}
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
                                                    <PencilIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4
                                                        className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Edit: {tenant?.name}
                                                    </h4>
                                                    <p
                                                        className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Update tenant configuration and settings
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    variant="flat"
                                                    radius={getThemeRadius()}
                                                    onPress={() => router.visit(route('admin.tenants.index'))}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Back to List
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Form */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Company Information */}
                                            <ThemedCard>
                                                <ThemedCardHeader>
                                                    <div className="flex items-center gap-2">
                                                        <BuildingOfficeIcon className="w-5 h-5 text-primary" />
                                                        <h3 className="text-lg font-semibold">Company Information</h3>
                                                    </div>
                                                </ThemedCardHeader>
                                                <ThemedCardBody>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            label="Company Name"
                                                            placeholder="Enter company name"
                                                            value={formData.name}
                                                            onValueChange={(v) => handleChange('name', v)}
                                                            isInvalid={!!errors.name}
                                                            errorMessage={errors.name}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                            classNames={{ inputWrapper: "bg-default-100" }}
                                                        />
                                                        <Input
                                                            label="Email"
                                                            type="email"
                                                            placeholder="company@example.com"
                                                            value={formData.email}
                                                            onValueChange={(v) => handleChange('email', v)}
                                                            isInvalid={!!errors.email}
                                                            errorMessage={errors.email}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                            classNames={{ inputWrapper: "bg-default-100" }}
                                                        />
                                                        <Input
                                                            label="Phone"
                                                            placeholder="+1 234 567 8900"
                                                            value={formData.phone}
                                                            onValueChange={(v) => handleChange('phone', v)}
                                                            radius={getThemeRadius()}
                                                            classNames={{ inputWrapper: "bg-default-100" }}
                                                        />
                                                    </div>
                                                </ThemedCardBody>
                                            </ThemedCard>

                    {/* Domain Info (Read-only) */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-2">
                                <GlobeAltIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Domain Configuration</h3>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="space-y-4">
                                <Input
                                    label="Subdomain"
                                    value={tenant?.subdomain || ''}
                                    isReadOnly
                                    description="Subdomain cannot be changed after creation"
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-50" }}
                                />
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-default-500">Domains:</span>
                                    {tenant?.domains?.map((domain, idx) => (
                                        <Chip key={idx} size="sm" variant="flat">
                                            {domain.domain}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>

                    {/* Subscription Settings */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCardIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Subscription Settings</h3>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Plan"
                                    placeholder="Select plan"
                                    selectedKeys={formData.plan_id ? [formData.plan_id] : []}
                                    onSelectionChange={(keys) => handleChange('plan_id', Array.from(keys)[0])}
                                    radius={getThemeRadius()}
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    {plans.map(plan => (
                                        <SelectItem key={String(plan.id)} description={`$${plan.price}/mo`}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    type="date"
                                    label="Trial Ends At"
                                    value={formData.trial_ends_at}
                                    onChange={(e) => handleChange('trial_ends_at', e.target.value)}
                                    description="Leave empty for no trial"
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    type="date"
                                    label="Subscription Ends At"
                                    value={formData.subscription_ends_at}
                                    onChange={(e) => handleChange('subscription_ends_at', e.target.value)}
                                    description="Leave empty for ongoing subscription"
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <h3 className="text-lg font-semibold">Tenant Status</h3>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-default-600">Current Status</span>
                                    <Chip 
                                        color={statusColorMap[tenant?.status] || 'default'} 
                                        variant="flat"
                                    >
                                        {tenant?.status}
                                    </Chip>
                                </div>
                                <Divider />
                                <div className="flex justify-between items-center">
                                    <span className="text-default-600">Type</span>
                                    <span className="font-medium capitalize">{tenant?.type}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-default-600">Created</span>
                                    <span className="text-sm">
                                        {new Date(tenant?.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-default-600">Users</span>
                                    <span className="text-sm">
                                        {tenant?.current_users || 0} / {tenant?.max_users || '∞'}
                                    </span>
                                </div>
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>

                    {/* Action Buttons */}
                    <ThemedCard>
                        <ThemedCardBody>
                            <div className="space-y-3">
                                <Button
                                    color="primary"
                                    className="w-full"
                                    size="lg"
                                    radius={getThemeRadius()}
                                    onPress={handleSubmit}
                                    isLoading={saving}
                                    startContent={!saving && <CheckIcon className="w-5 h-5" />}
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    variant="flat"
                                    className="w-full"
                                    radius={getThemeRadius()}
                                    onPress={() => router.visit(route('admin.tenants.index'))}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>

                    {/* Current Plan Info */}
                    {tenant?.plan && (
                        <ThemedCard>
                            <ThemedCardHeader>
                                <h3 className="text-lg font-semibold">Current Plan</h3>
                            </ThemedCardHeader>
                            <ThemedCardBody>
                                <div className="space-y-2">
                                    <p className="font-semibold text-lg">{tenant.plan.name}</p>
                                    <p className="text-2xl font-bold text-primary">
                                        ${tenant.plan.price}<span className="text-sm text-default-500">/mo</span>
                                    </p>
                                    {tenant.plan.description && (
                                        <p className="text-sm text-default-500">{tenant.plan.description}</p>
                                    )}
                                </div>
                            </ThemedCardBody>
                        </ThemedCard>
                    )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Edit.layout = (page) => <App>{page}</App>;

export default Edit;
