import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import App from '@/Layouts/App';
import {
  Button,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Input,
  Progress,
  Skeleton,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  UsersIcon,
  CloudIcon,
  CpuChipIcon,
  BriefcaseIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════════════════════
// THEME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const getThemeRadius = () => {
  if (typeof window === 'undefined') return 'lg';
  const rootStyles = getComputedStyle(document.documentElement);
  const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
  const radiusValue = parseInt(borderRadius);
  if (radiusValue === 0) return 'none';
  if (radiusValue <= 4) return 'sm';
  if (radiusValue <= 8) return 'md';
  if (radiusValue <= 12) return 'lg';
  return 'xl';
};

const getCardStyle = () => ({
  background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 0%, var(--theme-content2, #F4F4F5) 100%)`,
  borderColor: `var(--theme-divider, #E4E4E7)`,
  borderWidth: `var(--borderWidth, 2px)`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTA ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const quotaIcons = {
  users: UsersIcon,
  storage: ServerIcon,
  api_calls: CpuChipIcon,
  employees: BriefcaseIcon,
  projects: FolderIcon,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function QuotaDashboard({ auth, tenants: initialTenants, statistics }) {
  const [tenants, setTenants] = useState(initialTenants?.data || []);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [themeRadius, setThemeRadius] = useState('lg');

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quotaTypeFilter, setQuotaTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(initialTenants?.current_page || 1);
  const [perPage, setPerPage] = useState(10);

  // Statistics state
  const [stats, setStats] = useState(statistics || {
    total_tenants: 0,
    tenants_at_risk: 0,
    tenants_over_quota: 0,
    total_warnings: 0,
    quota_types: {},
  });

  useEffect(() => {
    setThemeRadius(getThemeRadius());
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════════════

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(route('admin.quotas.index'), {
        params: {
          search: searchQuery,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          quota_type: quotaTypeFilter !== 'all' ? quotaTypeFilter : undefined,
          page: currentPage,
          per_page: perPage,
        },
      });
      setTenants(response.data.data);
    } catch (error) {
      showToast.error('Failed to fetch tenant data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get(route('admin.quotas.statistics'));
      setStats(response.data);
    } catch (error) {
      showToast.error('Failed to fetch statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [searchQuery, statusFilter, quotaTypeFilter, currentPage, perPage]);

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleDismissWarning = async (tenantId, quotaType) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('admin.quotas.dismiss-warning', tenantId), {
          quota_type: quotaType,
        });
        resolve([response.data.message || 'Warning dismissed']);
        fetchTenants();
        fetchStatistics();
      } catch (error) {
        reject(error.response?.data?.errors || ['Failed to dismiss warning']);
      }
    });

    showToast.promise(promise, {
      loading: 'Dismissing warning...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  const handleViewDetails = (tenantId) => {
    router.visit(route('admin.quotas.show', tenantId));
  };

  const handleConfigureQuota = (tenantId) => {
    router.visit(route('admin.quotas.configure', tenantId));
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  const getQuotaColor = (percentage) => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 90) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const getStatusChip = (percentage) => {
    if (percentage >= 100) {
      return <Chip color="danger" size="sm" variant="flat">Over Quota</Chip>;
    }
    if (percentage >= 90) {
      return <Chip color="danger" size="sm" variant="flat">Critical</Chip>;
    }
    if (percentage >= 80) {
      return <Chip color="warning" size="sm" variant="flat">Warning</Chip>;
    }
    return <Chip color="success" size="sm" variant="flat">Healthy</Chip>;
  };

  const renderQuotaProgress = (quota) => {
    const percentage = Math.min(100, Math.round((quota.current / quota.limit) * 100));
    const color = getQuotaColor(percentage);
    const Icon = quotaIcons[quota.type] || ChartBarIcon;

    return (
      <div key={quota.type} className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-default-500" />
            <span className="font-medium capitalize">{quota.type.replace('_', ' ')}</span>
          </div>
          <span className="text-default-500">
            {quota.current} / {quota.limit}
          </span>
        </div>
        <Progress
          value={percentage}
          color={color}
          size="sm"
          radius={themeRadius}
          classNames={{
            track: "bg-default-200",
            indicator: `${color === 'danger' ? 'bg-danger' : color === 'warning' ? 'bg-warning' : 'bg-success'}`,
          }}
        />
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATS CARDS
  // ═══════════════════════════════════════════════════════════════════════════════

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="transition-all duration-200" style={getCardStyle()}>
        <CardBody className="p-4">
          {statsLoading ? (
            <Skeleton className="h-16 rounded" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-default-500">Total Tenants</span>
                <ChartBarIcon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{stats.total_tenants}</p>
              <p className="text-xs text-default-400 mt-1">Active tenants monitored</p>
            </>
          )}
        </CardBody>
      </Card>

      <Card className="transition-all duration-200" style={getCardStyle()}>
        <CardBody className="p-4">
          {statsLoading ? (
            <Skeleton className="h-16 rounded" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-default-500">At Risk</span>
                <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
              </div>
              <p className="text-2xl font-bold text-warning">{stats.tenants_at_risk}</p>
              <p className="text-xs text-default-400 mt-1">80%+ quota usage</p>
            </>
          )}
        </CardBody>
      </Card>

      <Card className="transition-all duration-200" style={getCardStyle()}>
        <CardBody className="p-4">
          {statsLoading ? (
            <Skeleton className="h-16 rounded" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-default-500">Over Quota</span>
                <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
              </div>
              <p className="text-2xl font-bold text-danger">{stats.tenants_over_quota}</p>
              <p className="text-xs text-default-400 mt-1">Exceeded limits</p>
            </>
          )}
        </CardBody>
      </Card>

      <Card className="transition-all duration-200" style={getCardStyle()}>
        <CardBody className="p-4">
          {statsLoading ? (
            <Skeleton className="h-16 rounded" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-default-500">Active Warnings</span>
                <ClockIcon className="w-5 h-5 text-warning" />
              </div>
              <p className="text-2xl font-bold">{stats.total_warnings}</p>
              <p className="text-xs text-default-400 mt-1">Pending dismissal</p>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // TABLE RENDERING
  // ═══════════════════════════════════════════════════════════════════════════════

  const columns = [
    { key: 'tenant', label: 'TENANT' },
    { key: 'quotas', label: 'QUOTA USAGE' },
    { key: 'status', label: 'STATUS' },
    { key: 'warnings', label: 'WARNINGS' },
    { key: 'actions', label: 'ACTIONS' },
  ];

  const renderCell = (tenant, columnKey) => {
    switch (columnKey) {
      case 'tenant':
        return (
          <div>
            <p className="font-semibold">{tenant.name}</p>
            <p className="text-xs text-default-400">{tenant.domain}</p>
          </div>
        );

      case 'quotas':
        return (
          <div className="space-y-2 min-w-[200px]">
            {tenant.quotas && tenant.quotas.slice(0, 2).map(renderQuotaProgress)}
            {tenant.quotas && tenant.quotas.length > 2 && (
              <p className="text-xs text-default-400">+{tenant.quotas.length - 2} more</p>
            )}
          </div>
        );

      case 'status':
        const maxPercentage = Math.max(...(tenant.quotas?.map(q => (q.current / q.limit) * 100) || [0]));
        return getStatusChip(maxPercentage);

      case 'warnings':
        return (
          <div className="flex items-center gap-2">
            {tenant.active_warnings > 0 ? (
              <Chip color="warning" size="sm" variant="dot">
                {tenant.active_warnings} active
              </Chip>
            ) : (
              <Chip color="success" size="sm" variant="dot">
                None
              </Chip>
            )}
          </div>
        );

      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Tenant Actions">
              <DropdownItem
                key="view"
                onPress={() => handleViewDetails(tenant.id)}
              >
                View Details
              </DropdownItem>
              <DropdownItem
                key="configure"
                onPress={() => handleConfigureQuota(tenant.id)}
              >
                Configure Quotas
              </DropdownItem>
              {tenant.active_warnings > 0 && (
                <DropdownItem
                  key="dismiss"
                  className="text-warning"
                  color="warning"
                  onPress={() => handleDismissWarning(tenant.id, 'all')}
                >
                  Dismiss All Warnings
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        );

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <App user={auth.user} header="Quota Management">
      <Head title="Quota Management" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <StatsCards />

          {/* Filters */}
          <Card className="mb-6 transition-all duration-200" style={getCardStyle()}>
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  radius={themeRadius}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                  className="flex-1"
                />

                <Select
                  placeholder="Status"
                  selectedKeys={[statusFilter]}
                  onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
                  radius={themeRadius}
                  className="w-full sm:w-[180px]"
                  classNames={{ trigger: "bg-default-100" }}
                >
                  <SelectItem key="all">All Status</SelectItem>
                  <SelectItem key="healthy">Healthy</SelectItem>
                  <SelectItem key="warning">Warning</SelectItem>
                  <SelectItem key="critical">Critical</SelectItem>
                  <SelectItem key="over_quota">Over Quota</SelectItem>
                </Select>

                <Select
                  placeholder="Quota Type"
                  selectedKeys={[quotaTypeFilter]}
                  onSelectionChange={(keys) => setQuotaTypeFilter(Array.from(keys)[0])}
                  radius={themeRadius}
                  className="w-full sm:w-[180px]"
                  classNames={{ trigger: "bg-default-100" }}
                >
                  <SelectItem key="all">All Types</SelectItem>
                  <SelectItem key="users">Users</SelectItem>
                  <SelectItem key="storage">Storage</SelectItem>
                  <SelectItem key="api_calls">API Calls</SelectItem>
                  <SelectItem key="employees">Employees</SelectItem>
                  <SelectItem key="projects">Projects</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>

          {/* Table */}
          <Card className="transition-all duration-200" style={getCardStyle()}>
            <CardBody className="p-0">
              <Table
                aria-label="Quota management table"
                isHeaderSticky
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-default-100 text-default-600 font-semibold",
                  td: "py-4"
                }}
              >
                <TableHeader columns={columns}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody
                  items={tenants}
                  isLoading={loading}
                  loadingContent={<Skeleton className="h-12 rounded" />}
                  emptyContent="No tenants found"
                >
                  {(tenant) => (
                    <TableRow key={tenant.id}>
                      {(columnKey) => <TableCell>{renderCell(tenant, columnKey)}</TableCell>}
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {initialTenants?.last_page > 1 && (
                <div className="flex justify-center p-4 border-t border-divider">
                  <Pagination
                    total={initialTenants.last_page}
                    page={currentPage}
                    onChange={setCurrentPage}
                    showControls
                    radius={themeRadius}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </App>
  );
}
