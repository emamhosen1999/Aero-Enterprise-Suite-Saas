import React, { useEffect, useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Card, CardBody, CardHeader, Button, Chip, Progress, 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Divider, Skeleton, Tooltip
} from '@heroui/react';
import { 
    ArrowLeftIcon, PencilIcon, DocumentDuplicateIcon, ArchiveBoxIcon,
    CurrencyDollarIcon, UserGroupIcon, CubeIcon, CheckCircleIcon,
    ChartBarIcon, ClockIcon, ArrowTrendingUpIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';

const PlanShow = ({ plan: initialPlan, modules = [], title = 'Plan Details' }) => {
    const { auth } = usePage().props;
    const [plan, setPlan] = useState(initialPlan);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

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

    // Fetch plan statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(route('admin.plans.stats', plan.id));
                if (response.data.success) {
                    setStats(response.data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch plan stats:', error);
            }
        };
        fetchStats();
    }, [plan.id]);

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const getTierColor = (tier) => {
        const colors = {
            free: 'default',
            starter: 'primary',
            professional: 'success',
            enterprise: 'warning'
        };
        return colors[tier?.toLowerCase()] || 'default';
    };

    const handleArchive = async () => {
        const promise = axios.post(route('admin.plans.archive', plan.id), { 
            archived: plan.is_active 
        });
        showToast.promise(promise, {
            loading: plan.is_active ? 'Archiving plan...' : 'Activating plan...',
            success: (response) => {
                setPlan(response.data.plan);
                return response.data.message;
            },
            error: 'Failed to update plan status'
        });
    };

    // Stats data for StatsCards component (REQUIRED - useMemo)
    const statsData = useMemo(() => stats ? [
        { 
            title: "Active Subscribers", 
            value: stats.subscribers_count || 0, 
            icon: <UserGroupIcon className="w-5 h-5" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Monthly Revenue", 
            value: formatCurrency(stats.mrr), 
            icon: <CurrencyDollarIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Trial Users", 
            value: stats.trial_count || 0, 
            icon: <ClockIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Modules Included", 
            value: stats.modules_count || 0, 
            icon: <CubeIcon className="w-5 h-5" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        }
    ] : [], [stats]);

    // Parse features
    const features = Array.isArray(plan.features) 
        ? plan.features 
        : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : []);

    // Parse limits
    const limits = typeof plan.limits === 'object' && plan.limits !== null
        ? plan.limits
        : (typeof plan.limits === 'string' ? JSON.parse(plan.limits || '{}') : {});

    return (
        <>
            <Head title={`${plan.name} - ${title}`} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Plan Details">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
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
                                            {/* Title Section with back button */}
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
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <SparklesIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                            {plan.name}
                                                        </h4>
                                                        <Chip 
                                                            color={getTierColor(plan.tier)} 
                                                            size="sm" 
                                                            variant="flat"
                                                        >
                                                            {plan.tier || 'Standard'}
                                                        </Chip>
                                                        {plan.is_featured && (
                                                            <Chip color="warning" size="sm" variant="dot">
                                                                Featured
                                                            </Chip>
                                                        )}
                                                        <Chip 
                                                            color={plan.is_active ? 'success' : 'default'} 
                                                            size="sm" 
                                                            variant="flat"
                                                        >
                                                            {plan.is_active ? 'Active' : 'Archived'}
                                                        </Chip>
                                                    </div>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 mt-1`}>
                                                        {plan.description || 'No description provided'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button 
                                                    color="primary" 
                                                    variant="shadow"
                                                    startContent={<PencilIcon className="w-4 h-4" />}
                                                    onPress={() => router.visit(route('admin.plans.edit', plan.id))}
                                                    size={isMobile ? "sm" : "md"}
                                                    radius={getThemeRadius()}
                                                >
                                                    Edit Plan
                                                </Button>
                                                <Button 
                                                    color="secondary" 
                                                    variant="flat"
                                                    startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                                    onPress={() => router.visit(route('admin.plans.clone', plan.id))}
                                                    size={isMobile ? "sm" : "md"}
                                                    radius={getThemeRadius()}
                                                >
                                                    Clone
                                                </Button>
                                                <Button 
                                                    color={plan.is_active ? 'warning' : 'success'} 
                                                    variant="flat"
                                                    startContent={<ArchiveBoxIcon className="w-4 h-4" />}
                                                    onPress={handleArchive}
                                                    size={isMobile ? "sm" : "md"}
                                                    radius={getThemeRadius()}
                                                >
                                                    {plan.is_active ? 'Archive' : 'Activate'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6 space-y-6">
                                    {/* Stats Cards */}
                                    {stats ? (
                                        <StatsCards stats={statsData} />
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="p-4 rounded-lg bg-default-100">
                                                    <Skeleton className="h-4 w-20 mb-2 rounded" />
                                                    <Skeleton className="h-8 w-16 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Divider />

                                    {/* Pricing Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card radius={getThemeRadius()}>
                                            <CardHeader className="border-b border-divider">
                                                <div className="flex items-center gap-2">
                                                    <CurrencyDollarIcon className="w-5 h-5 text-primary" />
                                                    <h3 className="text-lg font-semibold">Pricing</h3>
                                                </div>
                                            </CardHeader>
                                        <CardBody className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-default-600">Monthly Price</span>
                                                <span className="text-xl font-bold">
                                                    {formatCurrency(plan.monthly_price, plan.currency)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-default-600">Yearly Price</span>
                                                <span className="text-xl font-bold">
                                                    {formatCurrency(plan.yearly_price, plan.currency)}
                                                </span>
                                            </div>
                                            {plan.setup_fee > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-default-600">Setup Fee</span>
                                                    <span className="text-lg font-semibold text-warning">
                                                        {formatCurrency(plan.setup_fee, plan.currency)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="text-default-600">Trial Period</span>
                                                <span className="font-semibold">
                                                    {plan.trial_days ? `${plan.trial_days} days` : 'No trial'}
                                                </span>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Limits Section */}
                                    <Card radius={getThemeRadius()}>
                                        <CardHeader className="border-b border-divider">
                                            <div className="flex items-center gap-2">
                                                <ChartBarIcon className="w-5 h-5 text-secondary" />
                                                <h3 className="text-lg font-semibold">Limits</h3>
                                            </div>
                                        </CardHeader>
                                        <CardBody className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-default-600">Max Users</span>
                                                <span className="font-semibold">
                                                    {plan.max_users === 0 ? 'Unlimited' : plan.max_users}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-default-600">Storage</span>
                                                <span className="font-semibold">
                                                    {plan.max_storage_gb ? `${plan.max_storage_gb} GB` : 'Unlimited'}
                                                </span>
                                            </div>
                                            {Object.entries(limits).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center">
                                                    <span className="text-default-600 capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="font-semibold">{value}</span>
                                                </div>
                                            ))}
                                        </CardBody>
                                    </Card>
                                </div>

                                <Divider />

                                {/* Features Section */}
                                <Card radius={getThemeRadius()}>
                                    <CardHeader className="border-b border-divider">
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-success" />
                                            <h3 className="text-lg font-semibold">
                                                Features ({features.length})
                                            </h3>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        {features.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {features.map((feature, index) => (
                                                    <div 
                                                        key={index} 
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-success/10"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5 text-success shrink-0" />
                                                        <span className="text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-default-500 text-center py-4">
                                                No features defined for this plan
                                            </p>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* Modules Section */}
                                <Card radius={getThemeRadius()}>
                                    <CardHeader className="border-b border-divider">
                                        <div className="flex items-center gap-2">
                                            <CubeIcon className="w-5 h-5 text-primary" />
                                            <h3 className="text-lg font-semibold">
                                                Included Modules ({plan.modules?.length || 0})
                                            </h3>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        {plan.modules && plan.modules.length > 0 ? (
                                            <Table 
                                                aria-label="Included modules"
                                                removeWrapper
                                                classNames={{
                                                    th: "bg-default-100 text-default-600 font-semibold",
                                                    td: "py-3"
                                                }}
                                            >
                                                <TableHeader>
                                                    <TableColumn>MODULE</TableColumn>
                                                    <TableColumn>CODE</TableColumn>
                                                    <TableColumn>TYPE</TableColumn>
                                                </TableHeader>
                                                <TableBody>
                                                    {plan.modules.map((module) => (
                                                        <TableRow key={module.id || module.code}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <CubeIcon className="w-4 h-4 text-primary" />
                                                                    <span className="font-medium">{module.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <code className="text-sm bg-default-100 px-2 py-1 rounded">
                                                                    {module.code}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    size="sm" 
                                                                    color={module.is_core ? 'primary' : 'default'}
                                                                    variant="flat"
                                                                >
                                                                    {module.is_core ? 'Core' : 'Add-on'}
                                                                </Chip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-default-500 text-center py-4">
                                                No modules assigned to this plan
                                            </p>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* Stripe Integration Section */}
                                {(plan.stripe_product_id || plan.stripe_monthly_price_id || plan.stripe_yearly_price_id) && (
                                    <Card radius={getThemeRadius()}>
                                        <CardHeader className="border-b border-divider">
                                            <div className="flex items-center gap-2">
                                                <ArrowTrendingUpIcon className="w-5 h-5 text-warning" />
                                                <h3 className="text-lg font-semibold">Stripe Integration</h3>
                                            </div>
                                        </CardHeader>
                                        <CardBody className="space-y-3">
                                            {plan.stripe_product_id && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-default-600">Product ID</span>
                                                    <code className="text-sm bg-default-100 px-2 py-1 rounded">
                                                        {plan.stripe_product_id}
                                                    </code>
                                                </div>
                                            )}
                                            {plan.stripe_monthly_price_id && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-default-600">Monthly Price ID</span>
                                                    <code className="text-sm bg-default-100 px-2 py-1 rounded">
                                                        {plan.stripe_monthly_price_id}
                                                    </code>
                                                </div>
                                            )}
                                            {plan.stripe_yearly_price_id && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-default-600">Yearly Price ID</span>
                                                    <code className="text-sm bg-default-100 px-2 py-1 rounded">
                                                        {plan.stripe_yearly_price_id}
                                                    </code>
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
        </>
    );
};

PlanShow.layout = (page) => <App children={page} />;
export default PlanShow;
