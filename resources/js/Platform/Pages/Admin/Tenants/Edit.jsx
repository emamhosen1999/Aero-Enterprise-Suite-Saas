import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import AdminPage, { SectionCard, StatCard } from '@/Platform/Pages/Admin/components/AdminPage.jsx';
import TenantForm from '@/Platform/Pages/Admin/Tenants/components/TenantForm.jsx';
import { Button } from '@heroui/react';

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

  return (
    <>
      <Head title={`Edit ${currentTenant.name}`} />
      <AdminPage
        title={`Edit ${currentTenant.name}`}
        description="Update plan assignments, provisioning details, or internal documentation before syncing with automation."
        actions={<Button color="primary">Sync preview</Button>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {editStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <SectionCard
          title="Tenant metadata"
          description="Changes are saved once the platform workflow runs."
        >
          <TenantForm tenant={currentTenant} mode="edit" />
        </SectionCard>
      </AdminPage>
    </>
  );
};

TenantsEdit.layout = (page) => <App>{page}</App>;

export default TenantsEdit;
