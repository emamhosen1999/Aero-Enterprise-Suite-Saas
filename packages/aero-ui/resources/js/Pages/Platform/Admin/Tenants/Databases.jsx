import { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
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
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

const Databases = ({ auth, title }) => {
    // Theme radius helper (REQUIRED)
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

    const [databases, setDatabases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const statsData = useMemo(() => [
        {
            title: 'Total Databases',
            value: totalDatabases,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            icon: <CircleStackIcon className="w-5 h-5" />,
        },
        {
            title: 'Healthy',
            value: healthyDatabases,
            color: 'text-success',
            iconBg: 'bg-success/20',
            icon: <CheckCircleIcon className="w-5 h-5" />,
        },
        {
            title: 'Provisioning',
            value: pendingDatabases,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            icon: <ArrowPathIcon className="w-5 h-5" />,
        },
        {
            title: 'Issues',
            value: errorDatabases,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            icon: <ExclamationCircleIcon className="w-5 h-5" />,
        },
    ], [totalDatabases, healthyDatabases, pendingDatabases, errorDatabases]);

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
            <Head title={title || "Database Management"} />
            
            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Database Management"
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
                                                    <CircleStackIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4
                                                        className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Database Management
                                                    </h4>
                                                    <p
                                                        className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Monitor tenant databases and their status
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    variant="flat"
                                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                    radius={getThemeRadius()}
                                                    onPress={fetchDatabases}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Refresh
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards (we'll use StatsCards component) */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        {statsData.map((stat, idx) => (
                                            <ThemedCard key={idx}>
                                                <ThemedCardBody>
                                                    <div className="flex items-center gap-3">
                                                        <div className={stat.iconBg}>
                                                            {stat.icon}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-default-500">{stat.title}</p>
                                                            <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                                                        </div>
                                                    </div>
                                                </ThemedCardBody>
                                            </ThemedCard>
                                        ))}
                                    </div>
                                    
                                    {/* Filter Section */}
                                    <div className="mb-6">
                                        <Input
                                            placeholder="Search databases..."
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            radius={getThemeRadius()}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>
                                    
                                    {/* Database List */}
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
                                                wrapper: "shadow-none border border-divider rounded-lg",
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-3"
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
                                    
                                    {/* System Overview */}
                                    <ThemedCard className="mt-6">
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
                                                        radius={getThemeRadius()}
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
                                                        radius={getThemeRadius()}
                                                    />
                                                </div>
                                            </div>
                                        </ThemedCardBody>
                                    </ThemedCard>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Databases.layout = (page) => <App>{page}</App>;

export default Databases;
