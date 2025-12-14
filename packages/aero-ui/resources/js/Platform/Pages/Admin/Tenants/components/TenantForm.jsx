import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button, Input, Textarea, Checkbox, CheckboxGroup } from '@heroui/react';
import { showToast } from '@/utils/toastUtils';

const plans = [
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'enterprise', label: 'Enterprise' },
];

const moduleOptions = [
  'Core HR',
  'Time & Attendance',
  'Payroll',
  'Compliance',
  'Analytics',
  'Support Desk',
];

const statuses = [
  { value: 'trialing', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'churned', label: 'Churned' },
];

const TenantForm = ({ tenant = null, mode = 'create' }) => {
  const form = useForm({
    name: tenant?.name ?? '',
    subdomain: tenant?.subdomain ?? '',
    contact_name: tenant?.contact_name ?? '',
    contact_email: tenant?.contact_email ?? '',
    plan: tenant?.plan ?? 'enterprise',
    status: tenant?.status ?? 'active',
    seats: tenant?.seats ?? 50,
    modules: tenant?.modules ?? ['Core HR', 'Analytics'],
    notes: tenant?.notes ?? '',
  });

  const { data, setData, reset } = form;

  const handleSubmit = (event) => {
    event.preventDefault();
    console.table(data);
    showToast.success(mode === 'create' ? 'Provisioning request drafted.' : 'Tenant changes staged.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Input
            label="Legal name"
            value={data.name}
            onChange={(event) => setData('name', event.target.value)}
            isRequired
          />
          <Input
            label="Primary contact"
            value={data.contact_name}
            onChange={(event) => setData('contact_name', event.target.value)}
          />
          <Input
            label="Contact email"
            type="email"
            value={data.contact_email}
            onChange={(event) => setData('contact_email', event.target.value)}
          />
        </div>
        <div className="space-y-4">
          <Input
            label="Subdomain"
            description="Used for login (e.g. tenant.example.com)"
            value={data.subdomain}
            onChange={(event) => setData('subdomain', event.target.value.replace(/\s+/g, '-').toLowerCase())}
          />
          <label className="block text-sm font-medium text-default-600 dark:text-default-300">
            Plan
            <select
              value={data.plan}
              onChange={(event) => setData('plan', event.target.value)}
              className="mt-1 w-full rounded-xl border border-default-200 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {plans.map((plan) => (
                <option key={plan.value} value={plan.value}>
                  {plan.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-default-600 dark:text-default-300">
            Status
            <select
              value={data.status}
              onChange={(event) => setData('status', event.target.value)}
              className="mt-1 w-full rounded-xl border border-default-200 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Input
          type="number"
          label="Licensed seats"
          value={data.seats}
          onChange={(event) => setData('seats', Number(event.target.value))}
          min={1}
        />
        <CheckboxGroup
          label="Enabled modules"
          orientation="horizontal"
          value={data.modules}
          onChange={(value) => setData('modules', value)}
        >
          {moduleOptions.map((module) => (
            <Checkbox key={module} value={module}>
              {module}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>

      <Textarea
        label="Internal notes"
        minRows={3}
        value={data.notes}
        onChange={(event) => setData('notes', event.target.value)}
        placeholder="Procurement constraints, rollout timeline, or SLAs."
      />

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          variant="light"
          onPress={() => {
            reset();
            showToast.info('Form reset to defaults.');
          }}
        >
          Reset
        </Button>
        <Button color="primary" type="submit">
          {mode === 'create' ? 'Provision tenant' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
};

export default TenantForm;
