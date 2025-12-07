import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input } from "@heroui/react";
import { BuildingOfficeIcon, PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Index = ({ auth, tenants }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const tenantStats = [
        {
            title: "Total Tenants",
            value: "245",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "All registered",
        },
        {
            title: "Active",
            value: "218",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Currently active",
        },
        {
            title: "Trial",
            value: "27",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "In trial period",
        },
        {
            title: "Suspended",
            value: "5",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-red-400",
            iconBg: "bg-red-500/20",
            description: "Needs attention",
        },
    ];

    const columns = [
        { uid: "name", name: "TENANT" },
        { uid: "subdomain", name: "SUBDOMAIN" },
        { uid: "plan", name: "PLAN" },
        { uid: "status", name: "STATUS" },
        { uid: "users", name: "USERS" },
        { uid: "created", name: "CREATED" },
    ];

    const mockTenants = [
        { id: '1', name: "Acme Corp", subdomain: "acme", plan: "Professional", status: "active", users: 45, created: "2024-11-15" },
        { id: '2', name: "Tech Solutions", subdomain: "techsol", plan: "Enterprise", status: "active", users: 120, created: "2024-10-22" },
        { id: '3', name: "Startup Inc", subdomain: "startup", plan: "Basic", status: "trial", users: 8, created: "2024-12-01" },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "name":
                return <span className="font-medium">{item.name}</span>;
            case "subdomain":
                return <span className="text-sm text-default-500">{item.subdomain}.domain.com</span>;
            case "plan":
                return <span>{item.plan}</span>;
            case "status":
                const statusColors = {
                    active: 'success',
                    trial: 'warning',
                    suspended: 'danger',
                };
                return (
                    <Chip 
                        size="sm" 
                        color={statusColors[item.status]} 
                        variant="flat"
                    >
                        {item.status}
                    </Chip>
                );
            case "users":
                return <span>{item.users}</span>;
            case "created":
                return <span className="text-sm text-default-500">{item.created}</span>;
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title="Tenant Management" />
            <PageHeader
                title="Tenant Management"
                subtitle="Manage all tenants, subscriptions, and configurations"
                icon={<BuildingOfficeIcon className="w-8 h-8" />}
                action={
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => router.visit(route('admin.tenants.create'))}
                        radius={getThemeRadius()}
                    >
                        Create Tenant
                    </Button>
                }
            />
            
            <div className="space-y-6">
                <StatsCards stats={tenantStats} />

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <div className="flex justify-between items-center w-full">
                            <h3 className="text-lg font-semibold">All Tenants</h3>
                            <Input
                                placeholder="Search tenants..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                className="max-w-xs"
                                size="sm"
                                radius={getThemeRadius()}
                            />
                        </div>
                    </CardHeader>
                    <CardBody>
                        <Table
                            aria-label="Tenants table"
                            classNames={{
                                wrapper: "shadow-none",
                            }}
                            selectionMode="single"
                            onRowAction={(key) => router.visit(route('admin.tenants.show', key))}
                        >
                            <TableHeader columns={columns}>
                                {(column) => (
                                    <TableColumn key={column.uid}>
                                        {column.name}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody items={mockTenants}>
                                {(item) => (
                                    <TableRow key={item.id} className="cursor-pointer hover:bg-default-100">
                                        {(columnKey) => (
                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                        )}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Index.layout = (page) => <App>{page}</App>;

export default Index;
