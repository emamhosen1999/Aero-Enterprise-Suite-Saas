import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import TenantStatusBadge from '@/Components/Admin/TenantStatusBadge.jsx';
import { Button, Card, CardBody, CardHeader, Chip, Tooltip } from '@heroui/react';

const buildProfile = (tenantId) => ({
  id: tenantId,
  name: 'Waypoint Logistics',
  plan: 'Growth',
  status: 'active',
  maintenance_mode: false,
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
  const { tenant, tenantId, platformSettings = {} } = usePage().props;
  const profile = tenant ?? buildProfile(tenantId);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Check if impersonation is enabled
  const adminPreferences = platformSettings.admin_preferences ?? {};
  const impersonationEnabled = Boolean(adminPreferences.enable_impersonation);
  const canImpersonate = profile.status === 'active' && impersonationEnabled;

  const handleImpersonate = () => {
    if (!canImpersonate) return;

    setIsImpersonating(true);
    router.post(
      route('admin.tenants.impersonate', profile.id),
      {},
      {
        onError: () => {
          setIsImpersonating(false);
        },
        // Don't reset on success since we'll be redirected
      }
    );
  };

  const getImpersonateTooltip = () => {
    if (!impersonationEnabled) {
      return 'Impersonation is disabled in platform settings';
    }
    if (profile.status !== 'active') {
      return 'Cannot impersonate inactive or suspended tenants';
    }
    return 'Log in as the tenant admin';
  };

  return (
    <>
      <Head title={profile.name} />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-default-100/70 bg-white/85 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-default-400">Tenant</p>
            <h1 className="text-2xl font-semibold text-foreground">{profile.name}</h1>
            <p className="text-sm text-default-500">Live snapshot spanning contract terms, adoption trends, and provisioning log.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href={route('admin.tenants.edit', profile.id)} variant="bordered">
              Edit tenant
            </Button>
            <Tooltip content={getImpersonateTooltip()} isDisabled={canImpersonate}>
              <Button
                color="primary"
                isDisabled={!canImpersonate}
                isLoading={isImpersonating}
                onPress={handleImpersonate}
              >
                {isImpersonating ? 'Redirecting...' : 'Impersonate'}
              </Button>
            </Tooltip>
          </div>
        </div>

        <StatsCards
          stats={[
            { title: 'Plan', value: profile.plan, description: `Renewal ${profile.renewal}` },
            { 
              title: 'Status', 
              value: <TenantStatusBadge status={profile.status} maintenanceMode={profile.maintenance_mode} />, 
              description: `Region · ${profile.region}` 
            },
            { title: 'Seats', value: profile.seats, description: 'Licensed users' },
            { title: 'Owner', value: profile.owner, description: `Since ${profile.created_at}` },
          ]}
        />

        <Card shadow="none" className="border border-default-100/70 bg-white/95 shadow-2xl" style={{ borderRadius: 'var(--borderRadius, 24px)' }}>
          <CardHeader className="flex flex-col gap-1 border-b border-default-100/60 px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">Enabled modules</h2>
            <p className="text-sm text-default-500">Each module reports adoption and health from telemetry.</p>
          </CardHeader>
          <CardBody className="grid gap-4 p-6 md:grid-cols-2">
            {profile.modules.map((module) => (
              <div key={module.name} className="rounded-2xl border border-default-100 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-default-900 dark:text-white">{module.name}</p>
                  <Chip color="success" variant="flat">
                    {module.health}
                  </Chip>
                </div>
                <p className="mt-2 text-sm text-default-500">Adoption {module.adoption}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-100/70 bg-white/95 shadow-2xl" style={{ borderRadius: 'var(--borderRadius, 24px)' }}>
          <CardHeader className="flex flex-col gap-1 border-b border-default-100/60 px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">Provisioning timeline</h2>
            <p className="text-sm text-default-500">Output from the automation pipeline.</p>
          </CardHeader>
          <CardBody className="space-y-4 p-6">
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
          </CardBody>
        </Card>
      </div>
    </>
  );
};

TenantsShow.layout = (page) => <App>{page}</App>;

export default TenantsShow;
