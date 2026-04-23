import { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Tabs,
    Tab,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Skeleton,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Progress,
} from "@heroui/react";
import {
    BuildingOfficeIcon,
    PencilIcon,
    ArrowLeftIcon,
    UsersIcon,
    CreditCardIcon,
    Cog6ToothIcon,
    GlobeAltIcon,
    ServerIcon,
    PlayIcon,
    PauseIcon,
    ArchiveBoxIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/ui/toastUtils';
import App from "@/Layouts/App.jsx";
import StatsCards from '@/Components/UI/StatsCards';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const Show = ({ auth, tenantId, title, can_impersonate }) => {
    // Theme radius helper (REQUIRED)
    const themeRadius = useThemeRadius();

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
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [actionModal, setActionModal] = useState({ open: false, action: null });

    const fetchTenant = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.v1.tenants.show', { tenant: tenantId }));
            setTenant(response.data.data);
        } catch (error) {
            showToast.error('Failed to load tenant');
            router.visit(route('admin.tenants.index'));
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchTenant();
    }, [fetchTenant]);

    const handleAction = async (action) => {
        setActionModal({ open: false, action: null });
        
        // Handle impersonate differently - it's a redirect, not API call
        if (action === 'impersonate') {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await axios.post(route('admin.tenants.impersonate', { tenant: tenantId }));
                    if (response.data.redirect_url) {
                        resolve(['Impersonation session started. Redirecting...']);
                        // Redirect to tenant after short delay
                        setTimeout(() => {
                            window.location.href = response.data.redirect_url;
                        }, 500);
                    } else {
                        resolve(['Impersonation session started']);
                    }
                } catch (error) {
                    reject(error.response?.data?.message || 'Failed to impersonate tenant');
                }
            });

            showToast.promise(promise, {
                loading: 'Starting impersonation session...',
                success: (data) => data.join(', '),
                error: (data) => Array.isArray(data) ? data.join(', ') : data,
            });
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                let response;
                if (action === 'suspend') {
                    response = await axios.post(route('api.v1.tenants.suspend', { tenant: tenantId }));
                } else if (action === 'activate') {
                    response = await axios.post(route('api.v1.tenants.activate', { tenant: tenantId }));
                } else if (action === 'archive') {
                    response = await axios.post(route('api.v1.tenants.archive', { tenant: tenantId }));
                } else if (action === 'restore') {
                    response = await axios.post(route('api.v1.tenants.restore', { tenant: tenantId }));
                }
                await fetchTenant();
                resolve([response.data.message || `Tenant ${action}d successfully`]);
            } catch (error) {
                reject(error.response?.data?.message || `Failed to ${action} tenant`);
            }
        });

        showToast.promise(promise, {
            loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing tenant...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleRetryProvisioning = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('api.v1.tenants.retry-provisioning', { tenant: tenantId }));
                await fetchTenant();
                resolve([response.data.message || 'Provisioning retry started']);
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to retry provisioning');
            }
        });

        showToast.promise(promise, {
            loading: 'Retrying provisioning...',
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

    const statusIconMap = {
        active: CheckCircleIcon,
        suspended: PauseIcon,
        pending: ArrowPathIcon,
        provisioning: ArrowPathIcon,
        failed: ExclamationCircleIcon,
        archived: ArchiveBoxIcon,
    };

    // Stats data for StatsCards component (MUST be before any early returns)
    const statsData = useMemo(() => [
        { 
            title: 'Plan', 
            value: tenant?.plan?.name || 'No Plan', 
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            icon: <CreditCardIcon className="w-5 h-5" />,
        },
        { 
            title: 'Status', 
            value: tenant?.status || 'Unknown', 
            color: `text-${statusColorMap[tenant?.status] || 'default'}`,
            iconBg: `bg-${statusColorMap[tenant?.status] || 'default'}/20`,
            icon: <CheckCircleIcon className="w-5 h-5" />,
        },
        { 
            title: 'Users', 
            value: `${tenant?.current_users || 0} / ${tenant?.max_users || '∞'}`, 
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
            icon: <UsersIcon className="w-5 h-5" />,
        },
        { 
            title: 'Domains', 
            value: tenant?.domains?.length || 0, 
            color: 'text-success',
            iconBg: 'bg-success/20',
            icon: <GlobeAltIcon className="w-5 h-5" />,
        },
    ], [tenant, statusColorMap]);

    const StatusIcon = statusIconMap[tenant?.status] || CheckCircleIcon;

    if (loading) {
        return (
            <>
                <Head title="Tenant Details" />
                <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Tenant Details">
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
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            {[...Array(4)].map((_, i) => (
                                                <Card key={i}>
                                                    <CardBody>
                                                        <Skeleton className="h-6 w-24 mb-2 rounded" />
                                                        <Skeleton className="h-8 w-32 rounded" />
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                        <Card>
                                            <CardBody>
                                                <Skeleton className="h-64 rounded-lg" />
                                            </CardBody>
                                        </Card>
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
            <Head title={title || `Tenant: ${tenant?.name}`} />
            
            {/* Action Confirmation Modal */}
            <Modal
                isOpen={actionModal.open}
                onOpenChange={(open) => !open && setActionModal({ open: false, action: null })}
                size="md"
            >
                <ModalContent>
                    <ModalHeader>
                        Confirm {actionModal.action?.charAt(0).toUpperCase() + actionModal.action?.slice(1)}
                    </ModalHeader>
                    <ModalBody>
                        <p>
                            Are you sure you want to {actionModal.action} <strong>{tenant?.name}</strong>?
                        </p>
                        {actionModal.action === 'suspend' && (
                            <p className="text-warning text-sm mt-2">
                                Suspended tenants will not be able to access their workspace.
                            </p>
                        )}
                        {actionModal.action === 'archive' && (
                            <p className="text-default-500 text-sm mt-2">
                                Archived tenants will be removed from active lists but data will be preserved.
                            </p>
                        )}
                        {actionModal.action === 'restore' && (
                            <div className="bg-success/10 border border-success/20 rounded-lg p-3 mt-2">
                                <p className="text-success text-sm font-medium">
                                    ✓ Restore Tenant
                                </p>
                                <p className="text-sm text-default-600 mt-1">
                                    This will restore the tenant to active status. Users will be able 
                                    to access their workspace again.
                                </p>
                            </div>
                        )}
                        {actionModal.action === 'impersonate' && (
                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-2">
                                <p className="text-warning text-sm font-medium">
                                    ⚠️ Security Warning
                                </p>
                                <p className="text-sm text-default-600 mt-1">
                                    You will be logged into this tenant's workspace as their admin user. 
                                    All actions will be logged for audit purposes. Your session will be 
                                    clearly marked as impersonated.
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={() => setActionModal({ open: false, action: null })}
                            radius={themeRadius}
                        >
                            Cancel
                        </Button>
                        <Button
                            color={actionModal.action === 'activate' || actionModal.action === 'restore' ? 'success' : 'warning'}
                            onPress={() => handleAction(actionModal.action)}
                            radius={themeRadius}
                        >
                            {actionModal.action?.charAt(0).toUpperCase() + actionModal.action?.slice(1)}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Tenant Details"
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
                                                    radius={themeRadius}
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
                                                    <BuildingOfficeIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4
                                                        className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        {tenant?.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <p
                                                            className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}
                                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                        >
                                                            {tenant?.subdomain}.{window.location.hostname.split('.').slice(-2).join('.')}
                                                        </p>
                                                        <Chip 
                                                            color={statusColorMap[tenant?.status]} 
                                                            variant="flat" 
                                                            size="sm"
                                                            startContent={<StatusIcon className="w-3 h-3" />}
                                                        >
                                                            {tenant?.status}
                                                        </Chip>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    color="primary"
                                                    startContent={<PencilIcon className="w-4 h-4" />}
                                                    onPress={() => router.visit(route('admin.tenants.edit', { tenant: tenantId }))}
                                                    radius={themeRadius}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* Quick Actions */}
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <h3 className="text-lg font-semibold">Quick Actions</h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="flex flex-wrap gap-3">
                                                {tenant?.status !== 'suspended' && tenant?.status !== 'archived' && (
                                                    <Button
                                                        color="warning"
                                                        variant="flat"
                                                        startContent={<PauseIcon className="w-4 h-4" />}
                                                        radius={themeRadius}
                                                        onPress={() => setActionModal({ open: true, action: 'suspend' })}
                                                    >
                                                        Suspend Tenant
                                                    </Button>
                                                )}
                                                {tenant?.status === 'suspended' && (
                                                    <Button
                                                        color="success"
                                                        variant="flat"
                                                        startContent={<PlayIcon className="w-4 h-4" />}
                                    radius={themeRadius}
                                    onPress={() => setActionModal({ open: true, action: 'activate' })}
                                >
                                    Activate Tenant
                                </Button>
                            )}
                            {tenant?.status !== 'archived' && (
                                <Button
                                    variant="flat"
                                    startContent={<ArchiveBoxIcon className="w-4 h-4" />}
                                    radius={themeRadius}
                                    onPress={() => setActionModal({ open: true, action: 'archive' })}
                                >
                                    Archive Tenant
                                </Button>
                            )}
                            {tenant?.status === 'archived' && (
                                <Button
                                    color="success"
                                    variant="flat"
                                    startContent={<ArrowUturnLeftIcon className="w-4 h-4" />}
                                    radius={themeRadius}
                                    onPress={() => setActionModal({ open: true, action: 'restore' })}
                                >
                                    Restore Tenant
                                </Button>
                            )}
                            <Button
                                variant="flat"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                radius={themeRadius}
                                onPress={fetchTenant}
                            >
                                Refresh Data
                            </Button>
                            {/* Impersonate Tenant - only for active/pending tenants */}
                            {['active', 'pending'].includes(tenant?.status) && can_impersonate && (
                                <Button
                                    color="secondary"
                                    variant="flat"
                                    startContent={<UsersIcon className="w-4 h-4" />}
                                    radius={themeRadius}
                                    onPress={() => setActionModal({ open: true, action: 'impersonate' })}
                                >
                                    Impersonate Tenant
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Tabs Content */}
                <Card>
                    <CardHeader>
                        <Tabs 
                            selectedKey={selectedTab} 
                            onSelectionChange={setSelectedTab}
                            radius={themeRadius}
                            variant="underlined"
                        >
                            <Tab key="overview" title={
                                <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="w-4 h-4" />
                                    <span>Overview</span>
                                </div>
                            } />
                            <Tab key="domains" title={
                                <div className="flex items-center gap-2">
                                    <GlobeAltIcon className="w-4 h-4" />
                                    <span>Domains</span>
                                </div>
                            } />
                            <Tab key="subscription" title={
                                <div className="flex items-center gap-2">
                                    <CreditCardIcon className="w-4 h-4" />
                                    <span>Subscription</span>
                                </div>
                            } />
                            <Tab key="settings" title={
                                <div className="flex items-center gap-2">
                                    <Cog6ToothIcon className="w-4 h-4" />
                                    <span>Settings</span>
                                </div>
                            } />
                        </Tabs>
                    </CardHeader>
                    <CardBody>
                        {selectedTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Company Info */}
                                    <div>
                                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                                            <BuildingOfficeIcon className="w-5 h-5 text-primary" />
                                            Company Information
                                        </h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Name</span>
                                                <span className="font-medium">{tenant?.name}</span>
                                            </div>
                                            <Divider />
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Email</span>
                                                <span className="font-medium">{tenant?.email}</span>
                                            </div>
                                            <Divider />
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Phone</span>
                                                <span className="font-medium">{tenant?.phone || '-'}</span>
                                            </div>
                                            <Divider />
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Type</span>
                                                <Chip size="sm" variant="flat" className="capitalize">
                                                    {tenant?.type}
                                                </Chip>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Technical Info */}
                                    <div>
                                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                                            <ServerIcon className="w-5 h-5 text-primary" />
                                            Technical Details
                                        </h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Tenant ID</span>
                                                <span className="font-mono text-xs">{tenant?.id}</span>
                                            </div>
                                            <Divider />
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Subdomain</span>
                                                <span className="font-medium">{tenant?.subdomain}</span>
                                            </div>
                                            <Divider />
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Database</span>
                                                <span className="font-mono text-xs">tenant_{tenant?.id}</span>
                                            </div>
                                            <Divider />
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Created</span>
                                                <span className="font-medium">
                                                    {new Date(tenant?.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Trial/Subscription Dates */}
                                {(tenant?.trial_ends_at || tenant?.subscription_ends_at) && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold mb-4">Subscription Timeline</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tenant?.trial_ends_at && (
                                                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                                    <p className="text-sm text-default-500">Trial Ends</p>
                                                    <p className="font-semibold">
                                                        {new Date(tenant.trial_ends_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            {tenant?.subscription_ends_at && (
                                                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                                                    <p className="text-sm text-default-500">Subscription Ends</p>
                                                    <p className="font-semibold">
                                                        {new Date(tenant.subscription_ends_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Provisioning Status - shown for provisioning/failed tenants */}
                                {['provisioning', 'failed'].includes(tenant?.status) && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                                            <ServerIcon className="w-5 h-5 text-primary" />
                                            Provisioning Status
                                        </h4>
                                        <div className={`p-4 rounded-lg border ${
                                            tenant?.status === 'failed' 
                                                ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800' 
                                                : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                                        }`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {tenant?.status === 'failed' ? (
                                                        <ExclamationCircleIcon className="w-5 h-5 text-danger" />
                                                    ) : (
                                                        <ArrowPathIcon className="w-5 h-5 text-primary animate-spin" />
                                                    )}
                                                    <span className="font-medium">
                                                        {tenant?.status === 'failed' ? 'Provisioning Failed' : 'Provisioning in Progress'}
                                                    </span>
                                                </div>
                                                {tenant?.status === 'failed' && (
                                                    <Button
                                                        size="sm"
                                                        color="primary"
                                                        variant="flat"
                                                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                        onPress={() => handleRetryProvisioning()}
                                                        radius={themeRadius}
                                                    >
                                                        Retry Provisioning
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {/* Current Step */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-default-500">Current Step</span>
                                                    <span className="font-medium capitalize">
                                                        {tenant?.data?.provisioning_step || 'Initializing'}
                                                    </span>
                                                </div>
                                                
                                                {tenant?.status === 'provisioning' && (
                                                    <Progress 
                                                        size="sm"
                                                        isIndeterminate
                                                        color="primary"
                                                        className="mt-2"
                                                        aria-label="Provisioning progress"
                                                    />
                                                )}
                                                
                                                {/* Error Message */}
                                                {tenant?.status === 'failed' && tenant?.data?.provisioning_error && (
                                                    <div className="mt-3 p-3 bg-danger-100 dark:bg-danger-950/50 rounded text-sm">
                                                        <p className="text-danger font-medium mb-1">Error Details:</p>
                                                        <p className="text-danger-700 dark:text-danger-300 font-mono text-xs break-all">
                                                            {tenant.data.provisioning_error}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedTab === 'domains' && (
                            <div className="space-y-4">
                                <Table
                                    aria-label="Domains table"
                                    classNames={{
                                        wrapper: "shadow-none",
                                        th: "bg-default-100 text-default-600 font-semibold",
                                    }}
                                >
                                    <TableHeader>
                                        <TableColumn>Domain</TableColumn>
                                        <TableColumn>Type</TableColumn>
                                        <TableColumn>SSL Status</TableColumn>
                                        <TableColumn>Created</TableColumn>
                                    </TableHeader>
                                    <TableBody 
                                        items={tenant?.domains || []} 
                                        emptyContent="No domains configured"
                                    >
                                        {(domain) => (
                                            <TableRow key={domain.id || domain.domain}>
                                                <TableCell className="font-medium">{domain.domain}</TableCell>
                                                <TableCell>
                                                    <Chip size="sm" variant="flat">
                                                        {domain.is_primary ? 'Primary' : 'Secondary'}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        size="sm" 
                                                        color={domain.ssl_enabled ? 'success' : 'default'}
                                                        variant="flat"
                                                    >
                                                        {domain.ssl_enabled ? 'Enabled' : 'Disabled'}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    {domain.created_at 
                                                        ? new Date(domain.created_at).toLocaleDateString() 
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {selectedTab === 'subscription' && (
                            <div className="space-y-6">
                                {tenant?.plan ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 border border-divider rounded-lg">
                                            <h4 className="font-semibold text-lg mb-2">{tenant.plan.name}</h4>
                                            <p className="text-3xl font-bold text-primary mb-4">
                                                ${tenant.plan.price}
                                                <span className="text-sm text-default-500 font-normal">/month</span>
                                            </p>
                                            {tenant.plan.description && (
                                                <p className="text-default-500">{tenant.plan.description}</p>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-default-500">Usage</p>
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>Users</span>
                                                        <span>{tenant.current_users || 0} / {tenant.max_users || '∞'}</span>
                                                    </div>
                                                    <Progress 
                                                        value={tenant.max_users 
                                                            ? ((tenant.current_users || 0) / tenant.max_users) * 100 
                                                            : 0}
                                                        color="primary"
                                                        size="sm"
                                                        radius={themeRadius}
                                                    />
                                                </div>
                                            </div>
                                            {tenant.subscriptions?.length > 0 && (
                                                <div>
                                                    <p className="text-sm text-default-500 mb-2">Active Subscriptions</p>
                                                    {tenant.subscriptions.map((sub, idx) => (
                                                        <Chip key={idx} size="sm" variant="flat" color="success">
                                                            {sub.stripe_status || sub.status}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-default-500">No subscription plan assigned</p>
                                        <Button 
                                            color="primary" 
                                            className="mt-4"
                                            radius={themeRadius}
                                            onPress={() => router.visit(route('admin.tenants.edit', { tenant: tenantId }))}
                                        >
                                            Assign Plan
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedTab === 'settings' && (
                            <div className="space-y-4">
                                <p className="text-default-500">
                                    Tenant-specific settings and configuration options.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border border-divider rounded-lg">
                                        <h5 className="font-medium mb-2">Modules Access</h5>
                                        <p className="text-sm text-default-500">
                                            Configure which modules this tenant can access.
                                        </p>
                                    </div>
                                    <div className="p-4 border border-divider rounded-lg">
                                        <h5 className="font-medium mb-2">Rate Limits</h5>
                                        <p className="text-sm text-default-500">
                                            Set API rate limits for this tenant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                                        </CardBody>
                                    </Card>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Show.layout = (page) => <App>{page}</App>;

export default Show;