import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip, Progress, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Skeleton } from '@heroui/react';
import { PlusIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, PencilIcon, DocumentDuplicateIcon, ArchiveBoxIcon, TrashIcon, EyeIcon, CreditCardIcon, CurrencyDollarIcon, UserGroupIcon, ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';

const PlanList = ({ plans: initialPlans = [], stats: initialStats = {}, title }) => {
    const { auth } = usePage().props;

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

    // 3. State management
    const [plans, setPlans] = useState(initialPlans);
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // 5. Permission checks (REQUIRED)
    const canCreate = auth?.permissions?.includes('plans.create') || true;

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.plans.index'), {
                params: { search: searchQuery, tier: tierFilter, status: statusFilter }
            });
            setPlans(response.data.plans);
            setStats(response.data.stats);
        } catch (error) {
            showToast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery || tierFilter !== 'all' || statusFilter !== 'all') {
                fetchPlans();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, tierFilter, statusFilter]);

    const handleDelete = async (planId) => {
        if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
        
        const promise = axios.delete(route('admin.plans.destroy', planId));
        showToast.promise(promise, {
            loading: 'Deleting plan...',
            success: () => {
                setPlans(plans.filter(p => p.id !== planId));
                return 'Plan deleted successfully';
            },
            error: 'Failed to delete plan'
        });
    };

    const handleArchive = async (planId, isArchived) => {
        const promise = axios.post(route('admin.plans.archive', planId), { archived: !isArchived });
        showToast.promise(promise, {
            loading: isArchived ? 'Activating plan...' : 'Archiving plan...',
            success: () => {
                fetchPlans();
                return isArchived ? 'Plan activated' : 'Plan archived';
            },
            error: 'Failed to update plan status'
        });
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

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    };

    const filteredPlans = plans.filter(plan => {
        const matchesSearch = !searchQuery || plan.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = tierFilter === 'all' || plan.tier.toLowerCase() === tierFilter;
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? !plan.archived : plan.archived);
        return matchesSearch && matchesTier && matchesStatus;
    });

    // 4. Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        { 
            title: "Total Plans", 
            value: stats.total_plans || 0, 
            icon: <CreditCardIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Subscriptions", 
            value: stats.active_subscriptions || 0, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Total MRR", 
            value: formatCurrency(stats.total_mrr || 0), 
            icon: <CurrencyDollarIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Avg Plan Price", 
            value: formatCurrency(stats.avg_price || 0), 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // RENDER STRUCTURE (CRITICAL - Follow LeavesAdmin.jsx exactly)
    return (
        <>
            <Head title={title || "Plans Management"} />
            
            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Plans Management"
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
                                                        Plans Management
                                                    </h4>
                                                    <p
                                                        className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Manage subscription plans, pricing, and features
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('admin.plans.create'))}
                                                        size={isMobile ? "sm" : "md"}
                                                        className="font-semibold"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Create New Plan
                                                    </Button>
                                                )}
                                                <Button
                                                    color="default"
                                                    variant="bordered"
                                                    startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                    size={isMobile ? "sm" : "md"}
                                                    className="font-semibold"
                                                    style={{
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Export
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top) */}
                                    <StatsCards stats={statsData} isLoading={loading} className="mb-6" />

                                    {/* 2. Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search plans..."
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            radius={getThemeRadius()}
                                            variant="bordered"
                                            size="sm"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                            className="flex-1"
                                        />
                                        <Select
                                            placeholder="All Tiers"
                                            selectedKeys={tierFilter !== 'all' ? [tierFilter] : []}
                                            onSelectionChange={(keys) => setTierFilter(Array.from(keys)[0] || 'all')}
                                            radius={getThemeRadius()}
                                            variant="bordered"
                                            size="sm"
                                            className="w-full sm:w-48"
                                        >
                                            <SelectItem key="all">All Tiers</SelectItem>
                                            <SelectItem key="free">Free</SelectItem>
                                            <SelectItem key="starter">Starter</SelectItem>
                                            <SelectItem key="professional">Professional</SelectItem>
                                            <SelectItem key="enterprise">Enterprise</SelectItem>
                                        </Select>
                                        <Select
                                            placeholder="Status"
                                            selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                                            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] || 'all')}
                                            radius={getThemeRadius()}
                                            variant="bordered"
                                            size="sm"
                                            className="w-full sm:w-48"
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="archived">Archived</SelectItem>
                                        </Select>
                                    </div>

                                    {/* 3. Plans Grid */}
                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[1, 2, 3].map((i) => (
                                                <Card key={i} radius={getThemeRadius()}>
                                                    <CardHeader className="border-b border-divider p-4">
                                                        <Skeleton className="h-6 w-32 rounded" />
                                                    </CardHeader>
                                                    <CardBody className="p-4 space-y-3">
                                                        <Skeleton className="h-8 w-24 rounded" />
                                                        <Skeleton className="h-4 w-full rounded" />
                                                        <Skeleton className="h-4 w-2/3 rounded" />
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : filteredPlans.length === 0 ? (
                                        <Card radius={getThemeRadius()}>
                                            <CardBody className="p-12 text-center">
                                                <p className="text-default-500">No plans found. Create your first plan to get started.</p>
                                                <Button
                                                    color="primary"
                                                    className="mt-4"
                                                    radius={getThemeRadius()}
                                                    onPress={() => router.visit(route('admin.plans.create'))}
                                                >
                                                    Create Plan
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredPlans.map((plan) => (
                                                <Card key={plan.id} radius={getThemeRadius()} className="hover:shadow-lg transition-shadow">
                                                    <CardHeader className="border-b border-divider p-4 flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                                                                <Chip size="sm" color={getTierColor(plan.tier)} radius={getThemeRadius()}>
                                                                    {plan.tier}
                                                                </Chip>
                                                            </div>
                                                            {plan.archived && (
                                                                <Chip size="sm" color="warning" variant="flat" radius={getThemeRadius()}>
                                                                    Archived
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        <Dropdown>
                                                            <DropdownTrigger>
                                                                <Button isIconOnly size="sm" variant="light" radius={getThemeRadius()}>
                                                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                                                </Button>
                                                            </DropdownTrigger>
                                                            <DropdownMenu aria-label="Plan actions">
                                                                <DropdownItem
                                                                    key="view"
                                                                    startContent={<EyeIcon className="w-4 h-4" />}
                                                                    onPress={() => router.visit(route('admin.plans.show', plan.id))}
                                                                >
                                                                    View Details
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="edit"
                                                                    startContent={<PencilIcon className="w-4 h-4" />}
                                                                    onPress={() => router.visit(route('admin.plans.edit', plan.id))}
                                                                >
                                                                    Edit
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="clone"
                                                                    startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                                                    onPress={() => router.visit(route('admin.plans.clone', plan.id))}
                                                                >
                                                                    Clone
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="archive"
                                                                    startContent={<ArchiveBoxIcon className="w-4 h-4" />}
                                                                    onPress={() => handleArchive(plan.id, plan.archived)}
                                                                >
                                                                    {plan.archived ? 'Activate' : 'Archive'}
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="delete"
                                                                    className="text-danger"
                                                                    color="danger"
                                                                    startContent={<TrashIcon className="w-4 h-4" />}
                                                                    onPress={() => handleDelete(plan.id)}
                                                                >
                                                                    Delete
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>
                                                    </CardHeader>
                                                    <CardBody className="p-4 space-y-4">
                                                        <div>
                                                            <div className="flex items-baseline gap-2 mb-1">
                                                                <span className="text-3xl font-bold text-foreground">
                                                                    {formatCurrency(plan.monthly_price, plan.currency)}
                                                                </span>
                                                                <span className="text-sm text-default-500">/month</span>
                                                            </div>
                                                            <p className="text-sm text-default-500">
                                                                {formatCurrency(plan.annual_price, plan.currency)}/year
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-default-500">Subscribers</span>
                                                                <span className="font-semibold text-foreground">{plan.subscribers_count || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-default-500">MRR</span>
                                                                <span className="font-semibold text-foreground">{formatCurrency(plan.mrr || 0, plan.currency)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-default-500">Features</span>
                                                                <span className="font-semibold text-foreground">{plan.features_count || 0}</span>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            fullWidth
                                                            variant="bordered"
                                                            radius={getThemeRadius()}
                                                            onPress={() => router.visit(route('admin.plans.show', plan.id))}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
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

// REQUIRED: Use App layout wrapper
PlanList.layout = (page) => <App>{page}</App>;
export default PlanList;
