import { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Card,
    CardBody,
    CardHeader,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Progress,
    Button,
    Input,
    Skeleton,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";
import {
    CircleStackIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    TrashIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

const Databases = ({ auth }) => {
    const [databases, setDatabases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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

    const fetchDatabases = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch tenants and map to database info
            const response = await axios.get(route('api.v1.tenants.index'), {
                params: { per_page: 100 },
            });
            
            // Map tenants to database records
            const dbList = (response.data.data || []).map(tenant => ({
                id: tenant.id,
                database: `tenant_${tenant.id}`,
                tenant_id: tenant.id,
                tenant_name: tenant.name,
                tenant_status: tenant.status,
                size: tenant.database_size || null,
                tables: tenant.table_count || null,
                status: tenant.status === 'active' ? 'healthy' : 
                        tenant.status === 'failed' ? 'error' : 'pending',
                created_at: tenant.created_at,
            }));
            
            setDatabases(dbList);
        } catch (error) {
            showToast.error('Failed to load databases');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDatabases();
    }, [fetchDatabases]);

    const filteredDatabases = databases.filter(db => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return db.database.toLowerCase().includes(query) ||
               db.tenant_name?.toLowerCase().includes(query);
    });

    // Calculate stats from actual data
    const totalDatabases = databases.length;
    const healthyDatabases = databases.filter(d => d.status === 'healthy').length;
    const pendingDatabases = databases.filter(d => d.status === 'pending').length;
    const errorDatabases = databases.filter(d => d.status === 'error').length;

    const statsData = [
        {
            label: 'Total Databases',
            value: totalDatabases,
            color: 'primary',
            icon: CircleStackIcon,
        },
        {
            label: 'Healthy',
            value: healthyDatabases,
            color: 'success',
            icon: CheckCircleIcon,
        },
        {
            label: 'Provisioning',
            value: pendingDatabases,
            color: 'warning',
            icon: ArrowPathIcon,
        },
        {
            label: 'Issues',
            value: errorDatabases,
            color: 'danger',
            icon: ExclamationCircleIcon,
        },
    ];

    const columns = [
        { uid: "database", name: "DATABASE" },
        { uid: "tenant", name: "TENANT" },
        { uid: "status", name: "STATUS" },
        { uid: "created", name: "CREATED" },
        { uid: "actions", name: "ACTIONS" },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'pending': return 'warning';
            case 'error': return 'danger';
            default: return 'default';
        }
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "database":
                return (
                    <div className="flex items-center gap-2">
                        <CircleStackIcon className="w-4 h-4 text-default-400" />
                        <span className="font-mono text-sm">{item.database}</span>
                    </div>
                );
            case "tenant":
                return (
                    <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.visit(route('admin.tenants.show', { tenant: item.tenant_id }))}
                    >
                        <span className="text-primary font-medium">{item.tenant_name}</span>
                        <p className="text-xs text-default-500 capitalize">{item.tenant_status}</p>
                    </div>
                );
            case "status":
                return (
                    <Chip 
                        size="sm" 
                        color={getStatusColor(item.status)}
                        variant="flat"
                        startContent={
                            item.status === 'healthy' 
                                ? <CheckCircleIcon className="w-3 h-3" />
                                : item.status === 'pending'
                                ? <ArrowPathIcon className="w-3 h-3" />
                                : <ExclamationCircleIcon className="w-3 h-3" />
                        }
                    >
                        {item.status}
                    </Chip>
                );
            case "created":
                return (
                    <span className="text-sm text-default-600">
                        {new Date(item.created_at).toLocaleDateString()}
                    </span>
                );
            case "actions":
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Database actions">
                            <DropdownItem 
                                key="view"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('admin.tenants.show', { tenant: item.tenant_id }))}
                            >
                                View Tenant
                            </DropdownItem>
                            <DropdownItem 
                                key="backup"
                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            >
                                Backup Database
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title="Database Management" />
            <PageHeader
                title="Database Management"
                subtitle="Monitor tenant databases and their status"
                icon={<CircleStackIcon className="w-8 h-8" />}
                actions={
                    <Button
                        variant="flat"
                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                        radius={themeRadius}
                        onPress={fetchDatabases}
                    >
                        Refresh
                    </Button>
                }
            />
            
            <div className="space-y-6">
                {/* Stats */}
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
                                        <p className="text-lg font-semibold">{stat.value}</p>
                                    </div>
                                </div>
                            </ThemedCardBody>
                        </ThemedCard>
                    ))}
                </div>

                {/* Database List */}
                <ThemedCard>
                    <ThemedCardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                            <h3 className="text-lg font-semibold">Tenant Databases</h3>
                            <Input
                                placeholder="Search databases..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                className="w-64"
                            />
                        </div>
                    </ThemedCardHeader>
                    <ThemedCardBody>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <Table
                                aria-label="Databases table"
                                classNames={{
                                    wrapper: "shadow-none",
                                    th: "bg-default-100 text-default-600 font-semibold",
                                }}
                            >
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn key={column.uid}>
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody items={filteredDatabases} emptyContent="No databases found">
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => (
                                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                                            )}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </ThemedCardBody>
                </ThemedCard>

                {/* System Overview */}
                <ThemedCard>
                    <ThemedCardHeader>
                        <h3 className="text-lg font-semibold">System Overview</h3>
                    </ThemedCardHeader>
                    <ThemedCardBody>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm">Healthy Databases</span>
                                    <span className="text-sm text-default-500">
                                        {healthyDatabases} / {totalDatabases}
                                    </span>
                                </div>
                                <Progress 
                                    value={totalDatabases > 0 ? (healthyDatabases / totalDatabases) * 100 : 0} 
                                    color="success" 
                                    size="sm"
                                    radius={themeRadius}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm">Active Tenants</span>
                                    <span className="text-sm text-default-500">
                                        {databases.filter(d => d.tenant_status === 'active').length} / {totalDatabases}
                                    </span>
                                </div>
                                <Progress 
                                    value={totalDatabases > 0 
                                        ? (databases.filter(d => d.tenant_status === 'active').length / totalDatabases) * 100 
                                        : 0
                                    } 
                                    color="primary" 
                                    size="sm"
                                    radius={themeRadius}
                                />
                            </div>
                        </div>
                    </ThemedCardBody>
                </ThemedCard>
            </div>
        </>
    );
};

Databases.layout = (page) => <App>{page}</App>;

export default Databases;
