import React from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import AdminPage, { SectionCard } from '@/Platform/Pages/Admin/components/AdminPage.jsx';
import TenantForm from '@/Platform/Pages/Admin/Tenants/components/TenantForm.jsx';

const TenantsCreate = () => (
  <>
    <Head title="Create Tenant" />
    <AdminPage
      title="Provision new tenant"
      description="Kick off the automation workflow that prepares infrastructure, billing, and starter content for a customer."
    >
      <SectionCard
        title="Tenant details"
        description="Provide the basics and let the provisioning pipeline handle the rest."
      >
        <TenantForm mode="create" />
      </SectionCard>
    </AdminPage>
  </>
);

TenantsCreate.layout = (page) => <App>{page}</App>;

export default TenantsCreate;
