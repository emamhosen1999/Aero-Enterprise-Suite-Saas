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
import { showToast } from '@/utils/toastUtils';
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import StatsCards from '@/Components/StatsCards';

const Domains = ({ auth }) => {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        ssl_status: 'all',
    });
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

    const fetchDomains = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all tenants with their domains
            const response = await axios.get(route('api.v1.tenants.index'), {
                params: { per_page: 100, with_domains: true },
            });
            
            // Flatten domains from all tenants
            const allDomains = [];
            (response.data.data || []).forEach(tenant => {
                (tenant.domains || []).forEach(domain => {
                    allDomains.push({
                        ...domain,
                        tenant_id: tenant.id,
                        tenant_name: tenant.name,
                        tenant_status: tenant.status,
                    });
                });
            });
            
            setDomains(allDomains);
        } catch (error) {
            showToast.error('Failed to load domains');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    const filteredDomains = domains.filter(domain => {
        if (filters.search && !domain.domain.toLowerCase().includes(filters.search.toLowerCase()) &&
            !domain.tenant_name?.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.type !== 'all') {
            const isCustom = !domain.domain.includes('.') || domain.is_custom;
            if (filters.type === 'custom' && !isCustom) return false;
            if (filters.type === 'subdomain' && isCustom) return false;
        }
        if (filters.ssl_status !== 'all' && domain.ssl_status !== filters.ssl_status) {
            return false;
        }
        return true;
    });

    const statsData = [
        { 
            label: 'Total Domains', 
            value: domains.length, 
            color: 'primary',
            icon: GlobeAltIcon,
        },
        { 
            label: 'SSL Active', 
            value: domains.filter(d => d.ssl_enabled || d.ssl_status === 'valid').length, 
            color: 'success',
            icon: ShieldCheckIcon,
        },
        { 
            label: 'Custom Domains', 
            value: domains.filter(d => d.is_custom || d.is_primary === false).length, 
            color: 'secondary',
            icon: GlobeAltIcon,
        },
        { 
            label: 'Pending DNS', 
            value: domains.filter(d => d.dns_status === 'pending' || d.verification_status === 'pending').length, 
            color: 'warning',
            icon: ClockIcon,
        },
    ];

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
            <Head title="Domain Management" />
            <PageHeader
                title="Domain Management"
                subtitle="Manage tenant domains, custom domains, and SSL certificates"
                icon={<GlobeAltIcon className="w-8 h-8" />}
                actions={
                    <Button
                        variant="flat"
                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                        radius={themeRadius}
                        onPress={fetchDomains}
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

                {/* Domains Table */}
                <ThemedCard>
                    <ThemedCardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                            <h3 className="text-lg font-semibold">All Domains</h3>
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Search domains..."
                                    value={filters.search}
                                    onValueChange={(v) => setFilters(prev => ({ ...prev, search: v }))}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    className="w-64"
                                />
                                <Select
                                    placeholder="Type"
                                    selectedKeys={[filters.type]}
                                    onSelectionChange={(keys) => setFilters(prev => ({ ...prev, type: Array.from(keys)[0] }))}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                    className="w-36"
                                >
                                    <SelectItem key="all">All Types</SelectItem>
                                    <SelectItem key="subdomain">Subdomain</SelectItem>
                                    <SelectItem key="custom">Custom</SelectItem>
                                </Select>
                            </div>
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
                                aria-label="Domains table"
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
                                <TableBody items={filteredDomains} emptyContent="No domains found">
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
                    </ThemedCardBody>
                </ThemedCard>
            </div>
        </>
    );
};

Domains.layout = (page) => <App>{page}</App>;

export default Domains;
