import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import TenantForm from '@/Platform/Pages/Admin/Tenants/components/TenantForm.jsx';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';

const buildMockTenant = (id) => ({
  id,
  name: 'Waypoint Logistics',
  contact_name: 'Dana Kingsley',
  contact_email: 'dana@waypointlogistics.com',
  subdomain: 'waypoint',
  plan: 'growth',
  status: 'active',
  seats: 260,
  modules: ['Core HR', 'Time & Attendance', 'Analytics'],
  notes: 'Rolling out payroll after compliance approval.',
});

const editStats = [
  { label: 'Usage last 30d', value: '92%', change: '+8 pts', trend: 'up' },
  { label: 'Support tickets', value: '3 open', change: '0 P1', trend: 'up' },
];

const TenantsEdit = () => {
  const { tenant, tenantId } = usePage().props;
  const currentTenant = tenant ?? buildMockTenant(tenantId);
  const stats = editStats.map((stat) => ({
    title: stat.label,
    value: stat.value,
    description: stat.change,
  }));

  return (
    <>
      <Head title={`Edit ${currentTenant.name} - Admin`} />
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-default-100/70 bg-white/85 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-default-400">Tenant</p>
            <h1 className="text-2xl font-semibold text-foreground">{`Edit ${currentTenant.name}`}</h1>
            <p className="text-sm text-default-500">
              Update plan assignments, provisioning details, or internal documentation before syncing with automation.
            </p>
          </div>
          <Button color="primary" className="self-start">Sync preview</Button>
        </div>

        <StatsCards stats={stats} />

        <Card
          shadow="none"
          className="border border-default-100/70 bg-white/95 shadow-2xl"
          style={{ borderRadius: 'var(--borderRadius, 24px)' }}
        >
          <CardHeader className="flex flex-col gap-1 border-b border-default-100/60 px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">Tenant metadata</h2>
            <p className="text-sm text-default-500">Changes are saved once the platform workflow runs.</p>
          </CardHeader>
          <CardBody className="p-6">
            <TenantForm tenant={currentTenant} mode="edit" />
          </CardBody>
        </Card>
      </div>
    </>
  );
};

TenantsEdit.layout = (page) => <App>{page}</App>;

export default TenantsEdit;
