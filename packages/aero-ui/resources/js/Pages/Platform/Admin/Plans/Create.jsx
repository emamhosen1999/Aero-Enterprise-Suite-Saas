import React from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import { Card, CardHeader, CardBody } from '@heroui/react';
import { CubeIcon } from '@heroicons/react/24/outline';
import PlanForm from '@/Pages/Platform/Admin/Plans/components/PlanForm.jsx';

const mainCardStyle = {
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
};

const headerStyle = {
  borderColor: `var(--theme-divider, #E4E4E7)`,
  background: `linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
};

const PlansCreate = () => (
  <>
    <Head title="Create Plan - Admin" />
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <Card className="transition-all duration-200" style={mainCardStyle}>
        <CardHeader className="border-b p-0" style={headerStyle}>
          <div className="p-6 w-full">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                  borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                  borderWidth: `var(--borderWidth, 2px)`,
                  borderRadius: `var(--borderRadius, 12px)`,
                }}
              >
                <CubeIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-foreground">Design Plan</h4>
                <p className="text-sm text-default-500">
                  Codify pricing guardrails, provisioning automation, and go-to-market narratives in one place.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6">
          <div className="mb-4">
            <h5 className="text-base font-semibold text-foreground">Plan Blueprint</h5>
            <p className="text-xs text-default-500">
              Every field syncs to provisioning pipelines and billing catalogs.
            </p>
          </div>
          <PlanForm mode="create" />
        </CardBody>
      </Card>
    </div>
  </>
);

PlansCreate.layout = (page) => <App>{page}</App>;

export default PlansCreate;
