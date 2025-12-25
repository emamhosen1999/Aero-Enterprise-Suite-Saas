import { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Divider,
    Chip,
    Spinner,
} from "@heroui/react";
import {
    PlusIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    BuildingOfficeIcon,
    GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import App from "@/Layouts/App.jsx";
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

const Create = ({ auth, title }) => {
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

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [subdomainChecking, setSubdomainChecking] = useState(false);
    const [subdomainAvailable, setSubdomainAvailable] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        email: '',
        phone: '',
        type: 'business',
        plan_id: '',
        trial_days: 14,
        admin_name: '',
        admin_email: '',
        admin_password: '',
    });
    
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(route('api.v1.plans.index'));
            setPlans(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    };

    const checkSubdomainAvailability = useCallback(async (subdomain) => {
        if (!subdomain || subdomain.length < 3) {
            setSubdomainAvailable(null);
            return;
        }
        
        setSubdomainChecking(true);
        try {
            const response = await axios.get(route('api.v1.tenants.index'), {
                params: { subdomain_check: subdomain }
            });
            setSubdomainAvailable(response.data.available !== false);
        } catch (error) {
            setSubdomainAvailable(null);
        } finally {
            setSubdomainChecking(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.subdomain) {
                checkSubdomainAvailability(formData.subdomain);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.subdomain, checkSubdomainAvailability]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name) newErrors.name = 'Company name is required';
        if (!formData.subdomain) newErrors.subdomain = 'Subdomain is required';
        else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(formData.subdomain)) {
            newErrors.subdomain = 'Subdomain must start and end with alphanumeric characters';
        }
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.type) newErrors.type = 'Tenant type is required';
        if (!formData.plan_id) newErrors.plan_id = 'Plan is required';
        if (!formData.admin_name) newErrors.admin_name = 'Admin name is required';
        if (!formData.admin_email) newErrors.admin_email = 'Admin email is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast.error('Please fix the form errors');
            return;
        }
        
        setLoading(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('api.v1.tenants.store'), formData);
                resolve([response.data.message || 'Tenant created successfully']);
                setTimeout(() => {
                    router.visit(route('admin.tenants.show', { tenant: response.data.data.id }));
                }, 1000);
            } catch (error) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                reject(error.response?.data?.message || 'Failed to create tenant');
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating tenant...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const tenantTypes = [
        { key: 'startup', label: 'Startup', description: 'Small team, basic features' },
        { key: 'business', label: 'Business', description: 'Growing business, standard features' },
        { key: 'enterprise', label: 'Enterprise', description: 'Large organization, full features' },
    ];

    // RENDER STRUCTURE (CRITICAL - Follow LeavesAdmin.jsx exactly)
    return (
        <>
            <Head title={title || "Create Tenant"} />
            
            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Create Tenant"
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
                                                    onPress={() => router.visit(route('admin.tenants.index'))}
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
                                                    <PlusIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4
                                                        className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Create New Tenant
                                                    </h4>
                                                    <p
                                                        className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Provision a new tenant with database and configuration
                                                    </p>
                                                </div>
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
                                                        <Select
                                                            label="Tenant Type"
                                                            placeholder="Select type"
                                                            selectedKeys={formData.type ? [formData.type] : []}
                                                            onSelectionChange={(keys) => handleChange('type', Array.from(keys)[0])}
                                                            isInvalid={!!errors.type}
                                                            errorMessage={errors.type}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                            classNames={{ trigger: "bg-default-100" }}
                                                        >
                                                            {tenantTypes.map(type => (
                                                                <SelectItem key={type.key} description={type.description}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))}
                                                        </Select>
                                                    </div>
                                                </ThemedCardBody>
                                            </ThemedCard>

                    {/* Subdomain Configuration */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-2">
                                <GlobeAltIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Subdomain Configuration</h3>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="space-y-4">
                                <Input
                                    label="Subdomain"
                                    placeholder="company-name"
                                    value={formData.subdomain}
                                    onValueChange={(v) => handleChange('subdomain', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    isInvalid={!!errors.subdomain || subdomainAvailable === false}
                                    errorMessage={errors.subdomain || (subdomainAvailable === false ? 'Subdomain is already taken' : null)}
                                    isRequired
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    description={`Your tenant will be accessible at: ${formData.subdomain || 'subdomain'}.yourdomain.com`}
                                    endContent={
                                        subdomainChecking ? (
                                            <Spinner size="sm" />
                                        ) : subdomainAvailable === true ? (
                                            <CheckCircleIcon className="w-5 h-5 text-success" />
                                        ) : subdomainAvailable === false ? (
                                            <XCircleIcon className="w-5 h-5 text-danger" />
                                        ) : null
                                    }
                                />
                                {subdomainAvailable === true && (
                                    <Chip color="success" variant="flat" size="sm">
                                        Subdomain is available!
                                    </Chip>
                                )}
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>

                    {/* Admin User */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Initial Admin User</h3>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Admin Name"
                                    placeholder="John Doe"
                                    value={formData.admin_name}
                                    onValueChange={(v) => handleChange('admin_name', v)}
                                    isInvalid={!!errors.admin_name}
                                    errorMessage={errors.admin_name}
                                    isRequired
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="Admin Email"
                                    type="email"
                                    placeholder="admin@company.com"
                                    value={formData.admin_email}
                                    onValueChange={(v) => handleChange('admin_email', v)}
                                    isInvalid={!!errors.admin_email}
                                    errorMessage={errors.admin_email}
                                    isRequired
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="Admin Password"
                                    type="password"
                                    placeholder="Leave empty to auto-generate"
                                    value={formData.admin_password}
                                    onValueChange={(v) => handleChange('admin_password', v)}
                                    description="If left empty, a secure password will be generated and emailed"
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>
                </div>

                {/* Sidebar - Plan Selection */}
                <div className="space-y-6">
                    <ThemedCard>
                        <ThemedCardHeader>
                            <h3 className="text-lg font-semibold">Subscription Plan</h3>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="space-y-4">
                                <Select
                                    label="Select Plan"
                                    placeholder="Choose a plan"
                                    selectedKeys={formData.plan_id ? [String(formData.plan_id)] : []}
                                    onSelectionChange={(keys) => handleChange('plan_id', Array.from(keys)[0])}
                                    isInvalid={!!errors.plan_id}
                                    errorMessage={errors.plan_id}
                                    isRequired
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
                                    type="number"
                                    label="Trial Days"
                                    placeholder="14"
                                    value={String(formData.trial_days)}
                                    onValueChange={(v) => handleChange('trial_days', parseInt(v) || 0)}
                                    min={0}
                                    max={90}
                                    description="Number of days before billing starts"
                                    radius={getThemeRadius()}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
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
                                    isLoading={loading}
                                    startContent={!loading && <PlusIcon className="w-5 h-5" />}
                                >
                                    Create Tenant
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

                    {/* Info Card */}
                    <ThemedCard>
                        <ThemedCardBody>
                            <div className="text-sm text-default-500 space-y-2">
                                <p className="font-semibold text-default-700">What happens next?</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Database will be provisioned</li>
                                    <li>Default configurations applied</li>
                                    <li>Admin user will be created</li>
                                    <li>Welcome email will be sent</li>
                                </ul>
                            </div>
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
};

Create.layout = (page) => <App>{page}</App>;

export default Create;
