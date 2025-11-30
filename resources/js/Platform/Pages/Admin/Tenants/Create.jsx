import React from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import { Card, CardBody, CardHeader } from '@heroui/react';
import TenantForm from '@/Platform/Pages/Admin/Tenants/components/TenantForm.jsx';

const TenantsCreate = () => (
  <>
    <Head title="Create Tenant" />
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div className="rounded-3xl border border-default-100/70 bg-white/80 p-6 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-semibold text-foreground">Provision new tenant</h1>
        <p className="mt-2 text-sm text-default-500">
          Kick off the automation workflow that prepares infrastructure, billing, and starter content for a customer.
        </p>
      </div>

      <Card
        shadow="none"
        className="border border-default-100/70 bg-white/90 shadow-2xl"
        style={{ borderRadius: 'var(--borderRadius, 24px)' }}
      >
        <CardHeader className="flex flex-col gap-1 border-b border-default-100/60 px-6 py-5">
          <h2 className="text-lg font-semibold text-foreground">Tenant details</h2>
          <p className="text-sm text-default-500">Provide the basics and let the provisioning pipeline handle the rest.</p>
        </CardHeader>
        <CardBody className="p-6">
          <TenantForm mode="create" />
        </CardBody>
      </Card>
    </div>
  </>
);

TenantsCreate.layout = (page) => <App>{page}</App>;

export default TenantsCreate;
