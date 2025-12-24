import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { Card, CardBody, CardHeader, Button, Chip, Tabs, Tab } from "@heroui/react";
import { BuildingOfficeIcon, PencilIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const Show = ({ auth, tenantId }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [selectedTab, setSelectedTab] = useState('overview');

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        transform: `scale(var(--scale, 1))`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    });

    // Mock data
    const tenant = {
        id: tenantId,
        name: "Acme Corp",
        subdomain: "acme",
        plan: "Professional",
        status: "active",
        users: 45,
        created: "2024-11-15",
        database: "tenant_" + tenantId,
    };

    return (
        <>
            <Head title={`Tenant: ${tenant.name}`} />
            <PageHeader
                title={tenant.name}
                subtitle={`${tenant.subdomain}.domain.com`}
                icon={<BuildingOfficeIcon className="w-8 h-8" />}
                action={
                    <Button
                        color="primary"
                        startContent={<PencilIcon className="w-4 h-4" />}
                        onPress={() => safeNavigate('admin.tenants.edit', tenantId)}
                        radius={getThemeRadius()}
                    >
                        Edit Tenant
                    </Button>
                }
            />
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card style={getCardStyle()}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Plan</p>
                            <p className="text-lg font-semibold">{tenant.plan}</p>
                        </CardBody>
                    </Card>
                    <Card style={getCardStyle()}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Status</p>
                            <Chip color="success" variant="flat" size="sm">{tenant.status}</Chip>
                        </CardBody>
                    </Card>
                    <Card style={getCardStyle()}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Users</p>
                            <p className="text-lg font-semibold">{tenant.users}</p>
                        </CardBody>
                    </Card>
                    <Card style={getCardStyle()}>
                        <CardBody className="p-4">
                            <p className="text-sm text-default-500">Database</p>
                            <p className="text-sm font-mono">{tenant.database}</p>
                        </CardBody>
                    </Card>
                </div>

                <Card style={getCardStyle()}>
                    <CardHeader style={getCardHeaderStyle()}>
                        <Tabs selectedKey={selectedTab} onSelectionChange={setSelectedTab}>
                            <Tab key="overview" title="Overview" />
                            <Tab key="users" title="Users" />
                            <Tab key="subscription" title="Subscription" />
                            <Tab key="settings" title="Settings" />
                        </Tabs>
                    </CardHeader>
                    <CardBody>
                        {selectedTab === 'overview' && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Tenant Information</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-default-500">Name:</span>
                                            <span className="ml-2 font-medium">{tenant.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Subdomain:</span>
                                            <span className="ml-2 font-medium">{tenant.subdomain}</span>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Created:</span>
                                            <span className="ml-2 font-medium">{tenant.created}</span>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Database:</span>
                                            <span className="ml-2 font-mono text-xs">{tenant.database}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {selectedTab === 'users' && (
                            <p className="text-default-600">User management interface coming soon.</p>
                        )}
                        {selectedTab === 'subscription' && (
                            <p className="text-default-600">Subscription details coming soon.</p>
                        )}
                        {selectedTab === 'settings' && (
                            <p className="text-default-600">Tenant settings coming soon.</p>
                        )}
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Show.layout = (page) => <App>{page}</App>;

export default Show;
