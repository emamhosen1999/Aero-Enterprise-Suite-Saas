import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip, Progress, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Skeleton } from '@heroui/react';
import { PlusIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, PencilIcon, DocumentDuplicateIcon, ArchiveBoxIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const PlanList = ({ plans: initialPlans = [], stats: initialStats = {} }) => {
    const [plans, setPlans] = useState(initialPlans);
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [themeRadius, setThemeRadius] = useState('lg');

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) setThemeRadius('none');
        else if (radiusValue <= 4) setThemeRadius('sm');
        else if (radiusValue <= 8) setThemeRadius('md');
        else if (radiusValue <= 12) setThemeRadius('lg');
        else setThemeRadius('xl');
    }, []);

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

    return (
        <>
            <Head title="Plans Management" />
            
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Plans Management</h1>
                        <p className="text-sm text-default-500 mt-1">Manage subscription plans, pricing, and features</p>
                    </div>
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="w-5 h-5" />}
                        radius={themeRadius}
                        onPress={() => router.visit(route('admin.plans.create'))}
                    >
                        Create New Plan
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card radius={themeRadius}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Total Plans</p>
                            <p className="text-2xl font-bold text-foreground">{stats.total_plans || 0}</p>
                        </CardBody>
                    </Card>
                    <Card radius={themeRadius}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Active Subscriptions</p>
                            <p className="text-2xl font-bold text-foreground">{stats.active_subscriptions || 0}</p>
                        </CardBody>
                    </Card>
                    <Card radius={themeRadius}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Total MRR</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.total_mrr || 0)}</p>
                        </CardBody>
                    </Card>
                    <Card radius={themeRadius}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Avg Plan Price</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.avg_price || 0)}</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Filters */}
                <Card radius={themeRadius}>
                    <CardBody className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                placeholder="Search plans..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                className="flex-1"
                            />
                            <Select
                                placeholder="All Tiers"
                                selectedKeys={tierFilter !== 'all' ? [tierFilter] : []}
                                onSelectionChange={(keys) => setTierFilter(Array.from(keys)[0] || 'all')}
                                radius={themeRadius}
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
                                radius={themeRadius}
                                className="w-full sm:w-48"
                            >
                                <SelectItem key="all">All Status</SelectItem>
                                <SelectItem key="active">Active</SelectItem>
                                <SelectItem key="archived">Archived</SelectItem>
                            </Select>
                        </div>
                    </CardBody>
                </Card>

                {/* Plans Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} radius={themeRadius}>
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
                    <Card radius={themeRadius}>
                        <CardBody className="p-12 text-center">
                            <p className="text-default-500">No plans found. Create your first plan to get started.</p>
                            <Button
                                color="primary"
                                className="mt-4"
                                radius={themeRadius}
                                onPress={() => router.visit(route('admin.plans.create'))}
                            >
                                Create Plan
                            </Button>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlans.map((plan) => (
                            <Card key={plan.id} radius={themeRadius} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="border-b border-divider p-4 flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                                            <Chip size="sm" color={getTierColor(plan.tier)} radius={themeRadius}>
                                                {plan.tier}
                                            </Chip>
                                        </div>
                                        {plan.archived && (
                                            <Chip size="sm" color="warning" variant="flat" radius={themeRadius}>
                                                Archived
                                            </Chip>
                                        )}
                                    </div>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button isIconOnly size="sm" variant="light" radius={themeRadius}>
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
                                        radius={themeRadius}
                                        onPress={() => router.visit(route('admin.plans.show', plan.id))}
                                    >
                                        View Details
                                    </Button>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default PlanList;
