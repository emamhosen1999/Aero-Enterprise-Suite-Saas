import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import PublicLayout from '@/Layouts/PublicLayout.jsx';
import Checkbox from '@/Components/Checkbox.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Payment({ steps = [], currentStep, savedData = {}, trialDays = 14, baseDomain = 'platform.test', modulesCatalog = [], modulePricing = {} }) {
  const account = savedData.account ?? {};
  const details = savedData.details ?? {};
  const plan = savedData.plan ?? {};

  const catalogMap = useMemo(() => Object.fromEntries(modulesCatalog.map((module) => [module.code, module])), [modulesCatalog]);
  const selectedModules = (plan.modules ?? []).map((code) => catalogMap[code]?.name ?? code.toUpperCase());

  const { data, setData, post, processing, errors } = useForm({
    accept_terms: false,
    notify_updates: true,
  });

  const pricePerModule = plan.billing_cycle === 'yearly' ? modulePricing.yearly ?? 200 : modulePricing.monthly ?? 20;
  const estimate = (plan.modules?.length || 1) * pricePerModule;

  const handleSubmit = (event) => {
    event.preventDefault();
    post(route('platform.register.trial.activate'));
  };

  return (
    <PublicLayout mainClassName="pt-28 pb-20">
      <Head title="Review & launch" />
      <section className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Step 4</p>
          <h1 className="text-4xl font-semibold text-white">Review and start your trial.</h1>
          <p className="text-white/70">Payments go live later. Today we just launch your {trialDays}-day sandbox and wire up the modules you picked.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Card className="bg-white/5 border border-white/10 text-white/80">
                <CardBody className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="uppercase tracking-[0.3em] text-white/50 text-xs">Workspace</p>
                    <Chip size="sm" color="secondary" variant="flat">{account.type ?? 'company'}</Chip>
                  </div>
                  <p className="text-lg font-semibold text-white">{details.name}</p>
                  <p className="text-white/70">{details.email}</p>
                  {details.phone && <p className="text-white/60">{details.phone}</p>}
                  <p className="text-sm text-white/80">URL: <span className="font-mono text-white">https://{details.subdomain}.{baseDomain}</span></p>
                </CardBody>
              </Card>

              <Card className="bg-white/5 border border-white/10 text-white/80">
                <CardBody className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="uppercase tracking-[0.3em] text-white/50 text-xs">Activation</p>
                    <Chip size="sm" color="success" variant="flat">{trialDays}-day trial</Chip>
                  </div>
                  <p className="text-3xl font-semibold text-white">${estimate.toLocaleString()}</p>
                  <p className="text-white/60">Projected per {plan.billing_cycle === 'yearly' ? 'year' : 'month'} once billing is enabled.</p>
                  <ul className="space-y-1 text-white/70">
                    {selectedModules.map((module) => (
                      <li key={module} className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                        {module}
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>

            <Card className="bg-white/5 border border-white/10 text-sm text-white/70">
              <CardBody className="space-y-3">
                <p className="font-semibold text-white">What happens next?</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>We provision your isolated database + files.</li>
                  <li>Workspace URL ({details.subdomain}.{baseDomain}) goes live with default themes.</li>
                  <li>Within 5 minutes you receive super-admin credentials + onboarding playlist.</li>
                  <li>At any time during the trial you can add payment details to continue seamlessly.</li>
                </ol>
              </CardBody>
            </Card>

            <div className="space-y-4">
              <Checkbox
                checked={data.accept_terms}
                onChange={(event) => setData('accept_terms', event.target.checked)}
                error={errors.accept_terms}
                label="I agree to the Terms of Service and Privacy Policy."
                description="Required before spinning up the workspace."
              />
              <Checkbox
                checked={data.notify_updates}
                onChange={(event) => setData('notify_updates', event.target.checked)}
                label="Keep me posted about rollout templates and module launches."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href={route('platform.register.plan')} className="text-sm text-white/70 hover:text-white transition-colors">
                ← Back to modules
              </Link>
              <Button type="submit" color="success" className="px-6" isLoading={processing}>
                Launch trial workspace
              </Button>
            </div>
          </form>
        </AuthCard>
      </section>
    </PublicLayout>
  );
}
