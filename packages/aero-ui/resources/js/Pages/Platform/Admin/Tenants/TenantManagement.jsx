import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Checkbox,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Skeleton,
} from '@heroui/react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    EllipsisVerticalIcon,
    CheckIcon,
    XMarkIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import App from '@/Layouts/App';
import PageHeader from '@/Components/PageHeader';
import StatsCards from '@/Components/StatsCards';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

const TenantManagement = ({ auth }) => {
    const [tenants, setTenants] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [selectedTenants, setSelectedTenants] = useState(new Set());
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        plan: 'all',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
    });
    const [bulkOperation, setBulkOperation] = useState(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
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

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/tenants', {
                params: {
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    search: filters.search || undefined,
                    status: filters.status !== 'all' ? filters.status : undefined,
                    plan: filters.plan !== 'all' ? filters.plan : undefined,
                },
            });
            setTenants(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.meta?.total || 0,
                lastPage: response.data.meta?.last_page || 1,
            }));
        } catch (error) {
            showToast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.perPage, filters]);

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
        fetchTenants();
    }, [fetchTenants]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleSelectAll = () => {
        if (selectedTenants.size === tenants.length) {
            setSelectedTenants(new Set());
        } else {
            setSelectedTenants(new Set(tenants.map(t => t.id)));
        }
    };

    const handleSelectTenant = (tenantId) => {
        const newSelection = new Set(selectedTenants);
        if (newSelection.has(tenantId)) {
            newSelection.delete(tenantId);
        } else {
            newSelection.add(tenantId);
        }
        setSelectedTenants(newSelection);
    };

    const handleBulkOperation = (operation) => {
        if (selectedTenants.size === 0) {
            showToast.error('Please select at least one tenant');
            return;
        }
        setBulkOperation(operation);
        setIsBulkModalOpen(true);
    };

    const executeBulkOperation = async () => {
        const tenantIds = Array.from(selectedTenants);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/api/v1/admin/bulk-tenant-operations', {
                    tenant_ids: tenantIds,
                    operation: bulkOperation,
                    async: true,
                });
                
                setIsBulkModalOpen(false);
                setSelectedTenants(new Set());
                await fetchTenants();
                resolve([response.data.message]);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to execute bulk operation']);
            }
        });

        showToast.promise(promise, {
            loading: `Executing ${bulkOperation} operation...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const statusColorMap = {
        active: 'success',
        suspended: 'warning',
        inactive: 'default',
        pending: 'primary',
    };

    const renderCell = (tenant, columnKey) => {
        switch (columnKey) {
            case 'select':
                return (
                    <Checkbox
                        isSelected={selectedTenants.has(tenant.id)}
                        onValueChange={() => handleSelectTenant(tenant.id)}
                        radius={themeRadius}
                    />
                );
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold">{tenant.name}</span>
                        <span className="text-xs text-default-500">{tenant.domain}</span>
                    </div>
                );
            case 'status':
                return (
                    <Chip
                        color={statusColorMap[tenant.status] || 'default'}
                        size="sm"
                        variant="flat"
                        radius={themeRadius}
                    >
                        {tenant.status}
                    </Chip>
                );
            case 'plan':
                return tenant.plan?.name || 'No Plan';
            case 'users':
                return `${tenant.current_users || 0} / ${tenant.max_users || '∞'}`;
            case 'created_at':
                return new Date(tenant.created_at).toLocaleDateString();
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Tenant actions">
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="suspend">Suspend</DropdownItem>
                            <DropdownItem key="activate">Activate</DropdownItem>
                            <DropdownItem key="delete" className="text-danger" color="danger">
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return tenant[columnKey];
        }
    };

    const columns = [
        { key: 'select', label: <Checkbox isSelected={selectedTenants.size === tenants.length} onValueChange={handleSelectAll} radius={themeRadius} /> },
        { key: 'name', label: 'Tenant' },
        { key: 'status', label: 'Status' },
        { key: 'plan', label: 'Plan' },
        { key: 'users', label: 'Users' },
        { key: 'created_at', label: 'Created' },
        { key: 'actions', label: 'Actions' },
    ];

    const statsData = stats ? [
        { label: 'Total Tenants', value: stats.total || 0, color: 'primary' },
        { label: 'Active', value: stats.active || 0, color: 'success' },
        { label: 'Suspended', value: stats.suspended || 0, color: 'warning' },
        { label: 'This Month', value: stats.this_month || 0, color: 'secondary' },
    ] : [];

    return (
        <App>
            <Head title="Tenant Management" />
            
            <div className="space-y-6">
                <PageHeader
                    title="Tenant Management"
                    description="Manage all tenants and perform bulk operations"
                />

                <StatsCards stats={statsData} isLoading={statsLoading} />

                <Card className="transition-all duration-200" style={{
                    background: `var(--theme-content1, #FAFAFA)`,
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                }}>
                    <ThemedCardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                            <div className="flex gap-3 flex-1 w-full sm:w-auto">
                                <Input
                                    placeholder="Search tenants..."
                                    value={filters.search}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Select
                                    placeholder="Status"
                                    selectedKeys={[filters.status]}
                                    onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] }))}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                    className="w-32"
                                >
                                    <SelectItem key="all">All</SelectItem>
                                    <SelectItem key="active">Active</SelectItem>
                                    <SelectItem key="suspended">Suspended</SelectItem>
                                    <SelectItem key="pending">Pending</SelectItem>
                                </Select>
                            </div>
                            {selectedTenants.size > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        color="success"
                                        variant="flat"
                                        onPress={() => handleBulkOperation('activate')}
                                        startContent={<PlayIcon className="w-4 h-4" />}
                                        radius={themeRadius}
                                    >
                                        Activate
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="warning"
                                        variant="flat"
                                        onPress={() => handleBulkOperation('suspend')}
                                        startContent={<PauseIcon className="w-4 h-4" />}
                                        radius={themeRadius}
                                    >
                                        Suspend
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        onPress={() => handleBulkOperation('delete')}
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        radius={themeRadius}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ThemedCardHeader>
                    <ThemedCardBody>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <Table
                                    aria-label="Tenant management table"
                                    classNames={{
                                        wrapper: "shadow-none",
                                        th: "bg-default-100 text-default-600 font-semibold",
                                    }}
                                >
                                    <TableHeader columns={columns}>
                                        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                    </TableHeader>
                                    <TableBody items={tenants} emptyContent="No tenants found">
                                        {(tenant) => (
                                            <TableRow key={tenant.id}>
                                                {(columnKey) => <TableCell>{renderCell(tenant, columnKey)}</TableCell>}
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
                                            radius={themeRadius}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </ThemedCardBody>
                </Card>
            </div>

            {/* Bulk Operation Confirmation Modal */}
            <Modal
                isOpen={isBulkModalOpen}
                onOpenChange={setIsBulkModalOpen}
                size="md"
                radius={themeRadius}
            >
                <ModalContent>
                    <ModalHeader>Confirm Bulk Operation</ModalHeader>
                    <ModalBody>
                        <p>
                            Are you sure you want to {bulkOperation} {selectedTenants.size} tenant(s)?
                        </p>
                        {bulkOperation === 'delete' && (
                            <p className="text-warning text-sm mt-2">
                                This will soft delete the tenants. They can be recovered within 30 days.
                            </p>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsBulkModalOpen(false)} radius={themeRadius}>
                            Cancel
                        </Button>
                        <Button
                            color={bulkOperation === 'delete' ? 'danger' : 'primary'}
                            onPress={executeBulkOperation}
                            radius={themeRadius}
                        >
                            Confirm
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </App>
    );
};

export default TenantManagement;
