import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import AdminPage, { SectionCard, StatCard } from '@/Platform/Pages/Admin/components/AdminPage.jsx';
import { Button, Chip, Input } from '@heroui/react';
import {
  BuildingOffice2Icon,
  CircleStackIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const segmentStats = [
  { label: 'Enterprise', value: '68 tenants', change: '+3 this week', icon: BuildingOffice2Icon },
  { label: 'Growth', value: '42 tenants', change: '+1', icon: RocketLaunchIcon },
  { label: 'Trials', value: '18 live evaluations', change: '54% win rate', icon: CircleStackIcon },
  { label: 'At risk', value: '4 accounts', change: 'Need QBR', icon: ExclamationTriangleIcon, trend: 'down' },
];

const fallbackTenants = [
  {
    id: 1,
    name: 'Northwind Retail',
    segment: 'Enterprise',
    owner: 'Avery Holt',
    plan: 'Enterprise',
    seats: 820,
    status: 'Active',
    renewal: 'Oct 4, 2025',
  },
  {
    id: 2,
    name: 'Waypoint Logistics',
    segment: 'Growth',
    owner: 'Dana Kingsley',
    plan: 'Growth',
    seats: 260,
    status: 'Go-live',
    renewal: 'Mar 18, 2025',
  },
  {
    id: 3,
    name: 'Aero Health',
    segment: 'Enterprise',
    owner: 'Priya Patel',
    plan: 'Enterprise',
    seats: 1340,
    status: 'Expansion',
    renewal: 'Jan 12, 2026',
  },
  {
    id: 4,
    name: 'Summit Manufacturing',
    segment: 'Growth',
    owner: 'Luca Romero',
    plan: 'Growth',
    seats: 410,
    status: 'At risk',
    renewal: 'Aug 2, 2025',
  },
];

const statusColor = {
  Active: 'success',
  'Go-live': 'warning',
  Expansion: 'primary',
  'At risk': 'danger',
};

const TenantsIndex = () => {
  const { tenants = [] } = usePage().props;
  const rows = tenants.length ? tenants : fallbackTenants;

  return (
    <>
      <Head title="Tenant Directory" />
      <AdminPage
        title="Tenant directory"
        description="Unified view of every company onboarded onto the platform. Filter by lifecycle, plan, or health signal."
        actions={
          <Button as={Link} color="primary" href={route('admin.tenants.create')}>
            New tenant
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {segmentStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <SectionCard
          title="Live tenants"
          description="Search across plan tiers, statuses, and account owners."
          actions={<Input placeholder="Search tenants" size="sm" className="min-w-[220px]" />}
          bleed
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-default-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-default-500">
                  <th className="px-6 py-3">Tenant</th>
                  <th className="px-6">Segment</th>
                  <th className="px-6">Plan</th>
                  <th className="px-6">Seats</th>
                  <th className="px-6">Owner</th>
                  <th className="px-6">Renewal</th>
                  <th className="px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {rows.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-6 py-4 font-semibold text-default-900 dark:text-white">
                      <Link href={route('admin.tenants.show', tenant.id)} className="hover:underline">
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="px-6">{tenant.segment}</td>
                    <td className="px-6">{tenant.plan}</td>
                    <td className="px-6">{tenant.seats.toLocaleString()}</td>
                    <td className="px-6">{tenant.owner}</td>
                    <td className="px-6">{tenant.renewal}</td>
                    <td className="px-6 text-right">
                      <Chip color={statusColor[tenant.status] ?? 'default'} size="sm" variant="flat">
                        {tenant.status}
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </AdminPage>
    </>
  );
};

TenantsIndex.layout = (page) => <App>{page}</App>;

export default TenantsIndex;
