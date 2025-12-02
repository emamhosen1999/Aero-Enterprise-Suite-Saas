import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import TenantStatusBadge from '@/Components/Admin/TenantStatusBadge.jsx';
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import {
  BuildingOffice2Icon,
  CircleStackIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const segmentStats = [
  { label: 'Enterprise', value: '68 tenants', change: '+3 this week', icon: BuildingOffice2Icon, trend: 'up' },
  { label: 'Growth', value: '42 tenants', change: '+1', icon: RocketLaunchIcon, trend: 'up' },
  { label: 'Trials', value: '18 live evaluations', change: '54% win rate', icon: CircleStackIcon, trend: 'up' },
  { label: 'At risk', value: '4 accounts', change: 'Need QBR', icon: ExclamationTriangleIcon, trend: 'down' },
];

const mainCardStyle = {
  border: 'var(--borderWidth, 2px) solid transparent',
  borderRadius: 'var(--borderRadius, 12px)',
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
};

const statCardStyle = {
  background: 'var(--theme-content1, #FAFAFA)',
  borderColor: 'var(--theme-divider, #E4E4E7)',
  borderWidth: 'var(--borderWidth, 2px)',
  borderRadius: 'var(--borderRadius, 12px)',
};

const fallbackTenants = [
  {
    id: 1,
    name: 'Northwind Retail',
    segment: 'Enterprise',
    owner: 'Avery Holt',
    plan: 'Enterprise',
    seats: 820,
    status: 'active',
    maintenance_mode: false,
    renewal: 'Oct 4, 2025',
  },
  {
    id: 2,
    name: 'Waypoint Logistics',
    segment: 'Growth',
    owner: 'Dana Kingsley',
    plan: 'Growth',
    seats: 260,
    status: 'active',
    maintenance_mode: true,
    renewal: 'Mar 18, 2025',
  },
  {
    id: 3,
    name: 'Aero Health',
    segment: 'Enterprise',
    owner: 'Priya Patel',
    plan: 'Enterprise',
    seats: 1340,
    status: 'active',
    maintenance_mode: false,
    renewal: 'Jan 12, 2026',
  },
  {
    id: 4,
    name: 'Summit Manufacturing',
    segment: 'Growth',
    owner: 'Luca Romero',
    plan: 'Growth',
    seats: 410,
    status: 'suspended',
    maintenance_mode: false,
    renewal: 'Aug 2, 2025',
  },
];

const columns = [
  { uid: 'tenant', name: 'Tenant' },
  { uid: 'segment', name: 'Segment' },
  { uid: 'plan', name: 'Plan' },
  { uid: 'seats', name: 'Seats' },
  { uid: 'owner', name: 'Owner' },
  { uid: 'renewal', name: 'Renewal' },
  { uid: 'status', name: 'Status' },
];

const TenantsIndex = () => {
  const { tenants = [] } = usePage().props;
  const rows = tenants.length ? tenants : fallbackTenants;

  return (
    <>
      <Head title="Tenants - Admin" />
      <div className="flex flex-col w-full h-full p-4">
        <div className="space-y-4">
          {/* Single Parent Card - matching tenant Employee page structure */}
          <Card style={mainCardStyle} shadow="none" className="transition-all duration-200">
            <CardHeader 
              className="border-b p-0"
              style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
            >
              <div className="p-6 w-full">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                        borderWidth: 'var(--borderWidth, 2px)',
                        borderRadius: 'var(--borderRadius, 12px)',
                      }}
                    >
                      <UsersIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">Tenant directory</h1>
                      <p className="text-sm text-default-500">
                        Unified view of every company onboarded onto the platform. Filter by lifecycle, plan, or health signal.
                      </p>
                    </div>
                  </div>
                  <Button 
                    as={Link} 
                    color="primary" 
                    href={route('admin.tenants.create')}
                    className="text-white font-medium"
                    style={{
                      background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 80%, var(--theme-secondary)))',
                    }}
                  >
                    New tenant
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardBody className="p-6">
              {/* Stats Grid - icons on RIGHT like tenant Employee page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {segmentStats.map((stat, index) => (
                  <Card key={index} style={statCardStyle} className="transition-all duration-200 min-h-[120px]">
                    <CardBody className="p-4 flex flex-row items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-default-400">
                          {stat.label}
                        </span>
                        <span className="text-2xl font-bold text-foreground mt-1">
                          {stat.value}
                        </span>
                        <span className={`text-sm mt-1 ${stat.trend === 'down' ? 'text-danger' : 'text-success'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <div 
                        className="p-3 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                        }}
                      >
                        <stat.icon className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Live Tenants Section Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">Live tenants</p>
                  <p className="text-sm text-default-500">Search across plan tiers, statuses, and account owners.</p>
                </div>
                <Input 
                  placeholder="Search tenants" 
                  size="sm" 
                  className="min-w-[220px]" 
                  variant="bordered" 
                  startContent={<span className="text-default-400">⌕</span>} 
                />
              </div>

              {/* Table - using HeroUI Table like Employee page */}
              <div className="overflow-auto">
                <Table
                  aria-label="Tenants table"
                  removeWrapper
                  classNames={{
                    base: "bg-transparent min-w-[800px]",
                    th: "backdrop-blur-md font-medium text-xs sticky top-0 z-10 whitespace-nowrap",
                    td: "py-3 whitespace-nowrap",
                    table: "border-collapse table-auto",
                    tr: "hover:opacity-80 transition-all duration-200"
                  }}
                  style={{
                    '--table-header-bg': 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
                    '--table-row-hover': 'color-mix(in srgb, var(--theme-content2) 30%, transparent)',
                    '--table-border': 'color-mix(in srgb, var(--theme-content3) 30%, transparent)',
                  }}
                  isHeaderSticky
                >
                  <TableHeader columns={columns}>
                    {(column) => (
                      <TableColumn 
                        key={column.uid} 
                        align={column.uid === "status" ? "end" : "start"}
                        className="backdrop-blur-md"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
                          color: 'var(--theme-foreground)',
                          borderBottom: '1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)',
                        }}
                      >
                        {column.name}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody 
                    items={rows}
                    emptyContent={
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <UsersIcon className="w-12 h-12 mb-4 opacity-40" style={{ color: 'var(--theme-foreground)' }} />
                        <h6 className="text-lg font-semibold mb-2" style={{ color: 'var(--theme-foreground)' }}>
                          No tenants found
                        </h6>
                        <p className="text-sm opacity-70" style={{ color: 'var(--theme-foreground)' }}>
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    }
                  >
                    {(tenant) => (
                      <TableRow 
                        key={tenant.id}
                        className="transition-all duration-200"
                        style={{
                          color: 'var(--theme-foreground)',
                          borderBottom: '1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)',
                        }}
                      >
                        <TableCell>
                          <Link 
                            href={route('admin.tenants.show', tenant.id)} 
                            className="font-semibold text-foreground hover:underline"
                          >
                            {tenant.name}
                          </Link>
                        </TableCell>
                        <TableCell>{tenant.segment}</TableCell>
                        <TableCell>{tenant.plan}</TableCell>
                        <TableCell>{tenant.seats.toLocaleString()}</TableCell>
                        <TableCell>{tenant.owner}</TableCell>
                        <TableCell>{tenant.renewal}</TableCell>
                        <TableCell>
                          <TenantStatusBadge 
                            status={tenant.status} 
                            maintenanceMode={tenant.maintenance_mode}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 text-xs text-default-500">
                <span>Showing {rows.length} tenants</span>
                <span className="text-default-400">Synced {new Date().toLocaleDateString()}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

TenantsIndex.layout = (page) => <App>{page}</App>;

export default TenantsIndex;
