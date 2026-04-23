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
    Button,
    Input,
    Select,
    SelectItem,
    Skeleton,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";
import {
    GlobeAltIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/ui/toastUtils';
import App from "@/Layouts/App.jsx";
import StatsCards from '@/Components/UI/StatsCards';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const Domains = ({ auth, title }) => {
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

    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        custom: 0,
        subdomains: 0,
        verified: 0,
        pending: 0,
        ssl_active: 0,
        ssl_pending: 0,
    });
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        ssl_status: 'all',
    });
    
    // Debounced search value for API calls (prevents excessive requests)
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Debounce search input (300ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.search]);
    
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 30,
        total: 0,
        lastPage: 1,
    });

    const fetchDomains = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.v1.domains.index'), {
                params: { 
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    search: debouncedSearch || undefined,
                    type: filters.type !== 'all' ? filters.type : undefined,
                    ssl_status: filters.ssl_status !== 'all' ? filters.ssl_status : undefined,
                },
            });
            
            setDomains(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.meta?.total || 0,
                lastPage: response.data.meta?.last_page || 1,
            }));
        } catch (error) {
            showToast.error('Failed to load domains');
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.perPage, debouncedSearch, filters.type, filters.ssl_status]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('api.v1.domains.stats'));
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch domain stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Filter change handler
    const handleFilterChange = useCallback((filterKey, filterValue) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: filterValue
        }));
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    }, []);

    const statsData = useMemo(() => [
        { 
            title: 'Total Domains', 
            value: stats.total, 
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            icon: <GlobeAltIcon className="w-5 h-5" />,
        },
        { 
            title: 'SSL Active', 
            value: stats.ssl_active, 
            color: 'text-success',
            iconBg: 'bg-success/20',
            icon: <ShieldCheckIcon className="w-5 h-5" />,
        },
        { 
            title: 'Custom Domains', 
            value: stats.custom, 
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
            icon: <GlobeAltIcon className="w-5 h-5" />,
        },
        { 
            title: 'Pending Verification', 
            value: stats.pending, 
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            icon: <ClockIcon className="w-5 h-5" />,
        },
    ], [stats]);

    const columns = [
        { uid: "domain", name: "DOMAIN" },
        { uid: "tenant", name: "TENANT" },
        { uid: "type", name: "TYPE" },
        { uid: "dns", name: "DNS" },
        { uid: "ssl", name: "SSL" },
        { uid: "actions", name: "ACTIONS" },
    ];

    const getSslStatusColor = (domain) => {
        if (domain.ssl_enabled || domain.ssl_status === 'valid') return 'success';
        if (domain.ssl_status === 'pending') return 'warning';
        if (domain.ssl_status === 'failed' || domain.ssl_status === 'expired') return 'danger';
        return 'default';
    };

    const getDnsStatusColor = (domain) => {
        if (domain.dns_verified || domain.verification_status === 'verified') return 'success';
        if (domain.verification_status === 'pending' || domain.dns_status === 'pending') return 'warning';
        if (domain.verification_status === 'failed') return 'danger';
        return 'default';
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "domain":
                return (
                    <div className="flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-default-400" />
                        <span className="font-medium">{item.domain}</span>
                        {item.is_primary && (
                            <Chip size="sm" color="primary" variant="flat">Primary</Chip>
                        )}
                    </div>
                );
            case "tenant":
                return (
                    <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.visit(route('admin.tenants.show', { tenant: item.tenant_id }))}
                    >
                        <span className="text-primary font-medium">{item.tenant_name}</span>
                    </div>
                );
            case "type":
                return (
                    <Chip 
                        size="sm" 
                        variant="flat"
                        color={item.is_custom ? 'secondary' : 'default'}
                    >
                        {item.is_custom ? 'Custom' : 'Subdomain'}
                    </Chip>
                );
            case "dns":
                return (
                    <Chip 
                        size="sm" 
                        color={getDnsStatusColor(item)}
                        variant="flat"
                        startContent={
                            getDnsStatusColor(item) === 'success' 
                                ? <CheckCircleIcon className="w-3 h-3" />
                                : getDnsStatusColor(item) === 'warning'
                                ? <ClockIcon className="w-3 h-3" />
                                : <ExclamationCircleIcon className="w-3 h-3" />
                        }
                    >
                        {item.dns_verified || item.verification_status === 'verified' 
                            ? 'Verified' 
                            : item.verification_status || 'Pending'}
                    </Chip>
                );
            case "ssl":
                return (
                    <Chip 
                        size="sm" 
                        color={getSslStatusColor(item)}
                        variant="flat"
                        startContent={<ShieldCheckIcon className="w-3 h-3" />}
                    >
                        {item.ssl_enabled || item.ssl_status === 'valid' 
                            ? 'Valid' 
                            : item.ssl_status || 'Pending'}
                    </Chip>
                );
            case "actions":
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Domain actions">
                            <DropdownItem 
                                key="view"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('admin.tenants.show', { tenant: item.tenant_id }))}
                            >
                                View Tenant
                            </DropdownItem>
                            <DropdownItem 
                                key="verify"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                            >
                                Verify DNS
                            </DropdownItem>
                            <DropdownItem 
                                key="renew"
                                startContent={<ShieldCheckIcon className="w-4 h-4" />}
                            >
                                Renew SSL
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
            <Head title={title || "Domain Management"} />
            
            {/* Main content wrapper */}
            <div
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Domain Management"
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
                                                    <GlobeAltIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4
                                                        className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Domain Management
                                                    </h4>
                                                    <p
                                                        className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500 ${isMobile ? 'truncate' : ''}`}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Manage tenant domains, custom domains, and SSL certificates
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    variant="flat"
                                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                    radius={themeRadius}
                                                    onPress={fetchDomains}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Refresh
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    {/* Filters Section */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                        <Input
                                            placeholder="Search domains..."
                                            value={filters.search}
                                            onValueChange={(v) => handleFilterChange('search', v)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                            className="flex-1"
                                        />
                                        <Select
                                            placeholder="All Types"
                                            selectedKeys={[filters.type]}
                                            onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || 'all')}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                            className="w-full sm:w-36"
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="subdomain">Subdomain</SelectItem>
                                            <SelectItem key="custom">Custom</SelectItem>
                                        </Select>
                                        <Select
                                            placeholder="SSL Status"
                                            selectedKeys={[filters.ssl_status]}
                                            onSelectionChange={(keys) => handleFilterChange('ssl_status', Array.from(keys)[0] || 'all')}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                            className="w-full sm:w-36"
                                        >
                                            <SelectItem key="all">All SSL</SelectItem>
                                            <SelectItem key="active">SSL Active</SelectItem>
                                            <SelectItem key="pending">SSL Pending</SelectItem>
                                            <SelectItem key="failed">SSL Failed</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {/* Domains Table */}
                                    {loading ? (
                                        <div className="space-y-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Skeleton key={i} className="h-12 rounded-lg" />
                                            ))}
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Domains table"
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
                                            <TableBody items={domains} emptyContent="No domains found">
                                                {(item) => (
                                                    <TableRow key={item.id || item.domain}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}

                                    {/* Pagination */}
                                    {!loading && pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-4">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                                color="primary"
                                                showControls
                                                radius={themeRadius}
                                            />
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

Domains.layout = (page) => <App>{page}</App>;

export default Domains;