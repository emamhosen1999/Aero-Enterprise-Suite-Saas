import { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
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
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import StatsCards from '@/Components/StatsCards';

const Show = ({ auth, tenantId }) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [actionModal, setActionModal] = useState({ open: false, action: null });
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
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                let response;
                if (action === 'suspend') {
                    response = await axios.post(route('api.v1.tenants.suspend', { tenant: tenantId }));
                } else if (action === 'activate') {
                    response = await axios.post(route('api.v1.tenants.activate', { tenant: tenantId }));
                } else if (action === 'archive') {
                    response = await axios.post(route('api.v1.tenants.archive', { tenant: tenantId }));
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

    if (loading) {
        return (
            <>
                <Head title="Tenant Details" />
                <PageHeader
                    title="Loading..."
                    subtitle="Fetching tenant details"
                    icon={<BuildingOfficeIcon className="w-8 h-8" />}
                />
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <ThemedCard key={i}>
                                <ThemedCardBody>
                                    <Skeleton className="h-6 w-24 mb-2 rounded" />
                                    <Skeleton className="h-8 w-32 rounded" />
                                </ThemedCardBody>
                            </ThemedCard>
                        ))}
                    </div>
                    <ThemedCard>
                        <ThemedCardBody>
                            <Skeleton className="h-64 rounded-lg" />
                        </ThemedCardBody>
                    </ThemedCard>
                </div>
            </>
        );
    }

    const statsData = [
        { 
            label: 'Plan', 
            value: tenant?.plan?.name || 'No Plan', 
            color: 'primary',
            icon: CreditCardIcon,
        },
        { 
            label: 'Status', 
            value: tenant?.status, 
            color: statusColorMap[tenant?.status] || 'default',
            icon: statusIconMap[tenant?.status] || CheckCircleIcon,
        },
        { 
            label: 'Users', 
            value: `${tenant?.current_users || 0} / ${tenant?.max_users || '∞'}`, 
            color: 'secondary',
            icon: UsersIcon,
        },
        { 
            label: 'Domains', 
            value: tenant?.domains?.length || 0, 
            color: 'success',
            icon: GlobeAltIcon,
        },
    ];

    const StatusIcon = statusIconMap[tenant?.status] || CheckCircleIcon;

    return (
        <>
            <Head title={`Tenant: ${tenant?.name}`} />
            <PageHeader
                title={tenant?.name}
                subtitle={
                    <div className="flex items-center gap-2">
                        <span>{tenant?.subdomain}.{window.location.hostname.split('.').slice(-2).join('.')}</span>
                        <Chip 
                            color={statusColorMap[tenant?.status]} 
                            variant="flat" 
                            size="sm"
                            startContent={<StatusIcon className="w-3 h-3" />}
                        >
                            {tenant?.status}
                        </Chip>
                    </div>
                }
                icon={<BuildingOfficeIcon className="w-8 h-8" />}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            radius={themeRadius}
                            onPress={() => router.visit(route('admin.tenants.index'))}
                        >
                            Back
                        </Button>
                        <Button
                            color="primary"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => router.visit(route('admin.tenants.edit', { tenant: tenantId }))}
                            radius={themeRadius}
                        >
                            Edit
                        </Button>
                    </div>
                }
            />
            
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {statsData.map((stat, idx) => (
                        <ThemedCard key={idx}>
                            <ThemedCardBody>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                                        <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">{stat.label}</p>
                                        <p className="text-lg font-semibold capitalize">{stat.value}</p>
                                    </div>
                                </div>
                            </ThemedCardBody>
                        </ThemedCard>
                    ))}
                </div>

                {/* Quick Actions */}
                <ThemedCard>
                    <ThemedCardHeader>
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                    </ThemedCardHeader>
                    <ThemedCardBody>
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
                            <Button
                                variant="flat"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                radius={themeRadius}
                                onPress={fetchTenant}
                            >
                                Refresh Data
                            </Button>
                        </div>
                    </ThemedCardBody>
                </ThemedCard>

                {/* Tabs Content */}
                <ThemedCard>
                    <ThemedCardHeader>
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
                    </ThemedCardHeader>
                    <ThemedCardBody>
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
                    </ThemedCardBody>
                </ThemedCard>
            </div>

            {/* Action Confirmation Modal */}
            <Modal
                isOpen={actionModal.open}
                onOpenChange={(open) => !open && setActionModal({ open: false, action: null })}
                size="md"
                radius={themeRadius}
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
                            color={actionModal.action === 'activate' ? 'success' : 'warning'}
                            onPress={() => handleAction(actionModal.action)}
                            radius={themeRadius}
                        >
                            {actionModal.action?.charAt(0).toUpperCase() + actionModal.action?.slice(1)}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

Show.layout = (page) => <App>{page}</App>;

export default Show;
