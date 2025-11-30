import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button, Checkbox, CheckboxGroup, Input, Switch, Textarea, Chip } from '@heroui/react';
import { moduleCatalog, addOnCatalog } from '@/Platform/Pages/Admin/data/mockData.js';
import { showToast } from '@/utils/toastUtils';

const moduleOptions = moduleCatalog.map((module) => module.name);
const addOnOptions = addOnCatalog.map((addon) => addon.name);
const launchChannels = ['Marketplace', 'Sales playbook', 'Beta cohort', 'Landing page'];

const PlanForm = ({ plan = null, mode = 'create' }) => {
  const form = useForm({
    name: plan?.name ?? '',
    headline: plan?.headline ?? '',
    price: plan?.price ?? 2000,
    currency: plan?.currency ?? 'USD',
    cadence: plan?.cadence ?? 'month',
    seatsIncluded: plan?.seatsIncluded ?? 100,
    storage: plan?.storage ?? '1 TB',
    trialDays: plan?.trialDays ?? 14,
    provisioningSla: plan?.provisioningSla ?? '24 hours',
    modules: plan?.modules ?? [moduleOptions[0]],
    addOns: plan?.addOns ?? [],
    targetProfile: plan?.target ?? 'Operations + HR partnership',
    rolloutChannels: plan?.rolloutChannels ?? ['Sales playbook'],
    description: plan?.description ?? '',
    availability: plan?.availability ?? true,
    features: plan?.features ?? ['AI assisted onboarding', 'Compliance-ready automation templates'],
  });

  const { data, setData, reset } = form;
  const [featureDraft, setFeatureDraft] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    console.table(data);
    showToast.success(mode === 'create' ? 'Plan draft stored locally.' : 'Plan update staged.');
  };

  const addFeature = () => {
    if (!featureDraft.trim()) {
      return;
    }
    setData('features', [...data.features, featureDraft.trim()]);
    setFeatureDraft('');
  };

  const removeFeature = (feature) => {
    setData('features', data.features.filter((entry) => entry !== feature));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Input
            label="Plan name"
            value={data.name}
            onChange={(event) => setData('name', event.target.value)}
            isRequired
          />
          <Input
            label="Narrative headline"
            description="Used on landing pages and procurement decks."
            value={data.headline}
            onChange={(event) => setData('headline', event.target.value)}
          />
          <Textarea
            label="Value promise"
            minRows={3}
            value={data.description}
            onChange={(event) => setData('description', event.target.value)}
            placeholder="How this plan solves pains for specific personas."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Price"
            startContent={<span className="text-sm text-default-500">{data.currency}</span>}
            value={data.price}
            onChange={(event) => setData('price', Number(event.target.value))}
            min={0}
          />
          <label className="text-sm font-medium text-default-600 dark:text-default-300">
            Cadence
            <select
              value={data.cadence}
              onChange={(event) => setData('cadence', event.target.value)}
              className="mt-1 w-full rounded-xl border border-default-200 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="month">Monthly</option>
              <option value="year">Annual</option>
            </select>
          </label>
          <Input
            type="number"
            label="Seats included"
            value={data.seatsIncluded}
            onChange={(event) => setData('seatsIncluded', Number(event.target.value))}
            min={1}
          />
          <Input
            label="Storage allocation"
            value={data.storage}
            onChange={(event) => setData('storage', event.target.value)}
          />
          <Input
            type="number"
            label="Trial days"
            value={data.trialDays}
            onChange={(event) => setData('trialDays', Number(event.target.value))}
            min={0}
          />
          <Input
            label="Provisioning SLA"
            value={data.provisioningSla}
            onChange={(event) => setData('provisioningSla', event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CheckboxGroup
          label="Included modules"
          value={data.modules}
          onChange={(value) => setData('modules', value)}
        >
          {moduleOptions.map((module) => (
            <Checkbox key={module} value={module}>
              {module}
            </Checkbox>
          ))}
        </CheckboxGroup>
        <CheckboxGroup
          label="Bundled add-ons"
          value={data.addOns}
          onChange={(value) => setData('addOns', value)}
        >
          {addOnOptions.map((addon) => (
            <Checkbox key={addon} value={addon}>
              {addon}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Textarea
          label="Target profile"
          description="Capture persona/job-to-be-done context."
          minRows={3}
          value={data.targetProfile}
          onChange={(event) => setData('targetProfile', event.target.value)}
        />
        <CheckboxGroup
          label="Launch channels"
          value={data.rolloutChannels}
          onChange={(value) => setData('rolloutChannels', value)}
        >
          {launchChannels.map((channel) => (
            <Checkbox key={channel} value={channel}>
              {channel}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-default-600 dark:text-default-300">
          Signature capabilities
        </label>
        <div className="flex flex-wrap gap-2">
          {data.features.map((feature) => (
            <Chip key={feature} color="primary" variant="flat" onClose={() => removeFeature(feature)}>
              {feature}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            label="Add capability"
            placeholder="Describe the promise (press add)"
            value={featureDraft}
            onChange={(event) => setFeatureDraft(event.target.value)}
            className="flex-1 min-w-[220px]"
          />
          <Button variant="flat" color="primary" onPress={addFeature}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-dashed border-default-200 p-4">
        <div>
          <p className="text-sm font-medium text-default-900 dark:text-white">Public availability</p>
          <p className="text-xs text-default-500">Toggle when the plan should appear in platform checkout.</p>
        </div>
        <Switch isSelected={data.availability} onValueChange={(value) => setData('availability', value)}>
          {data.availability ? 'Listed' : 'Hidden'}
        </Switch>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          variant="light"
          onPress={() => {
            reset();
            showToast.info('Plan form reset.');
          }}
        >
          Reset
        </Button>
        <Button color="primary" type="submit">
          {mode === 'create' ? 'Save draft' : 'Update plan'}
        </Button>
      </div>
    </form>
  );
};

export default PlanForm;
