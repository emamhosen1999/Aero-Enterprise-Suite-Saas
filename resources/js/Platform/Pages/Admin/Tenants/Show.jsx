import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import AdminPage, { SectionCard, StatCard } from '@/Platform/Pages/Admin/components/AdminPage.jsx';
import { Button, Chip } from '@heroui/react';

const buildProfile = (tenantId) => ({
  id: tenantId,
  name: 'Waypoint Logistics',
  plan: 'Growth',
  status: 'Active',
  seats: 260,
  owner: 'Dana Kingsley',
  region: 'US-EAST',
  created_at: 'Mar 12, 2024',
  renewal: 'Mar 18, 2025',
  modules: [
    { name: 'Core HR', adoption: '95%', health: 'Healthy' },
    { name: 'Time & Attendance', adoption: '88%', health: 'Healthy' },
    { name: 'Payroll', adoption: '62%', health: 'Pilot' },
  ],
  automation: [
    { step: 'Tenant database', time: 'Completed · 2m', status: 'done' },
    { step: 'Branding assets', time: 'Completed · 4m', status: 'done' },
    { step: 'Integrations', time: 'Queued', status: 'pending' },
  ],
});

const TenantsShow = () => {
  const { tenant, tenantId } = usePage().props;
  const profile = tenant ?? buildProfile(tenantId);

  return (
    <>
      <Head title={profile.name} />
      <AdminPage
        title={profile.name}
        description="Live snapshot spanning contract terms, adoption trends, and provisioning log."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href={route('admin.tenants.edit', profile.id)} variant="flat">
              Edit tenant
            </Button>
            <Button color="primary">Impersonate</Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Plan" value={profile.plan} meta={`Renewal ${profile.renewal}`} />
          <StatCard label="Status" value={profile.status} meta={`Region · ${profile.region}`} />
          <StatCard label="Seats" value={profile.seats} meta="Licensed users" />
          <StatCard label="Owner" value={profile.owner} meta={`Since ${profile.created_at}`} />
        </div>

        <SectionCard
          title="Enabled modules"
          description="Each module reports adoption and health from telemetry."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {profile.modules.map((module) => (
              <div
                key={module.name}
                className="rounded-2xl border border-default-100 bg-white/70 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-default-900 dark:text-white">{module.name}</p>
                  <Chip color="success" variant="flat">
                    {module.health}
                  </Chip>
                </div>
                <p className="mt-2 text-sm text-default-500">Adoption {module.adoption}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Provisioning timeline"
          description="Output from the automation pipeline."
        >
          <div className="space-y-4">
            {profile.automation.map((step) => (
              <div key={step.step} className="flex items-center justify-between rounded-2xl bg-default-50 px-4 py-3">
                <div>
                  <p className="font-medium text-default-900 dark:text-white">{step.step}</p>
                  <p className="text-sm text-default-500">{step.time}</p>
                </div>
                <Chip color={step.status === 'done' ? 'success' : 'warning'} variant="flat">
                  {step.status === 'done' ? 'Completed' : 'Pending'}
                </Chip>
              </div>
            ))}
          </div>
        </SectionCard>
      </AdminPage>
    </>
  );
};

TenantsShow.layout = (page) => <App>{page}</App>;

export default TenantsShow;
