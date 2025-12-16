import { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { 
    Card, CardBody, CardHeader, Button, Chip, Table, TableHeader, 
    TableColumn, TableBody, TableRow, TableCell, Input, Dropdown,
    DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Skeleton
} from "@heroui/react";
import { 
    BuildingOfficeIcon, PlusIcon, MagnifyingGlassIcon, EllipsisVerticalIcon,
    EyeIcon, PencilIcon, NoSymbolIcon, PlayIcon, ArchiveBoxIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import { showToast } from '@/utils/toastUtils';

const Index = ({ auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tenants, setTenants] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
    });

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const fetchTenants = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/tenants', {
                params: {
                    page,
                    per_page: pagination.perPage,
                    search: searchQuery || undefined,
                },
            });
            setTenants(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                currentPage: response.data.meta?.current_page || 1,
                total: response.data.meta?.total || 0,
                lastPage: response.data.meta?.last_page || 1,
            }));
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
            showToast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get('/api/v1/tenants/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTenants(pagination.currentPage);
    }, [fetchTenants, pagination.currentPage]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchTenants(1);
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleAction = async (action, tenant) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                let response;
                switch (action) {
                    case 'view':
                        router.visit(route('admin.tenants.show', tenant.id));
                        resolve(['Navigating...']);
                        return;
                    case 'edit':
                        router.visit(route('admin.tenants.edit', tenant.id));
                        resolve(['Navigating...']);
                        return;
                    case 'suspend':
                        response = await axios.post(`/api/v1/tenants/${tenant.id}/suspend`);
                        break;
                    case 'activate':
                        response = await axios.post(`/api/v1/tenants/${tenant.id}/activate`);
                        break;
                    case 'archive':
                        response = await axios.post(`/api/v1/tenants/${tenant.id}/archive`);
                        break;
                }
                resolve([response.data.message || 'Action completed']);
                fetchTenants(pagination.currentPage);
            } catch (error) {
                reject([error.response?.data?.message || 'Action failed']);
            }
        });

        if (action !== 'view' && action !== 'edit') {
            showToast.promise(promise, {
                loading: `Processing ${action}...`,
                success: (data) => data[0],
                error: (data) => data[0],
            });
        }
    };

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
            value: stats?.total ?? 0,
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "All registered",
        },
        {
            title: "Active",
            value: stats?.active ?? 0,
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Currently active",
        },
        {
            title: "On Trial",
            value: stats?.on_trial ?? 0,
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "In trial period",
        },
        {
            title: "Suspended",
            value: stats?.suspended ?? 0,
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
        { uid: "created_at", name: "CREATED" },
        { uid: "actions", name: "ACTIONS" },
    ];

    const statusColors = {
        active: 'success',
        pending: 'warning',
        provisioning: 'primary',
        suspended: 'danger',
        archived: 'default',
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "name":
                return <span className="font-medium">{item.name}</span>;
            case "subdomain":
                return <span className="text-sm text-default-500">{item.subdomain}.{item.domains?.[0]?.domain?.split('.').slice(1).join('.') || 'domain.com'}</span>;
            case "plan":
                return <span>{item.plan?.name || 'No Plan'}</span>;
            case "status":
                return (
                    <Chip 
                        size="sm" 
                        color={statusColors[item.status] || 'default'} 
                        variant="flat"
                    >
                        {item.status}
                    </Chip>
                );
            case "created_at":
                return <span className="text-sm text-default-500">{new Date(item.created_at).toLocaleDateString()}</span>;
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Tenant actions">
                                <DropdownItem 
                                    key="view" 
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                    onPress={() => handleAction('view', item)}
                                >
                                    View Details
                                </DropdownItem>
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => handleAction('edit', item)}
                                >
                                    Edit
                                </DropdownItem>
                                {item.status === 'active' && (
                                    <DropdownItem 
                                        key="suspend" 
                                        className="text-warning" 
                                        color="warning"
                                        startContent={<NoSymbolIcon className="w-4 h-4" />}
                                        onPress={() => handleAction('suspend', item)}
                                    >
                                        Suspend
                                    </DropdownItem>
                                )}
                                {item.status === 'suspended' && (
                                    <DropdownItem 
                                        key="activate" 
                                        className="text-success" 
                                        color="success"
                                        startContent={<PlayIcon className="w-4 h-4" />}
                                        onPress={() => handleAction('activate', item)}
                                    >
                                        Activate
                                    </DropdownItem>
                                )}
                                <DropdownItem 
                                    key="archive" 
                                    className="text-danger" 
                                    color="danger"
                                    startContent={<ArchiveBoxIcon className="w-4 h-4" />}
                                    onPress={() => handleAction('archive', item)}
                                >
                                    Archive
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <>
            <Head title="Tenant Management" />
            <PageHeader
                title="Tenant Management"
                subtitle="Manage all tenants, subscriptions, and configurations"
                icon={<BuildingOfficeIcon className="w-8 h-8" />}
                actions={
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
                <StatsCards stats={tenantStats} isLoading={statsLoading} />

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
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex gap-4 items-center">
                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4 rounded" />
                                            <Skeleton className="h-3 w-1/2 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <Table
                                    aria-label="Tenants table"
                                    classNames={{
                                        wrapper: "shadow-none",
                                        th: "bg-default-100 text-default-600 font-semibold",
                                        td: "py-3",
                                    }}
                                >
                                    <TableHeader columns={columns}>
                                        {(column) => (
                                            <TableColumn key={column.uid} align={column.uid === 'actions' ? 'end' : 'start'}>
                                                {column.name}
                                            </TableColumn>
                                        )}
                                    </TableHeader>
                                    <TableBody items={tenants} emptyContent="No tenants found">
                                        {(item) => (
                                            <TableRow key={item.id} className="hover:bg-default-100">
                                                {(columnKey) => (
                                                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                                                )}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                {pagination.lastPage > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            total={pagination.lastPage}
                                            page={pagination.currentPage}
                                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                            showControls
                                            radius={getThemeRadius()}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Index.layout = (page) => <App>{page}</App>;

export default Index;