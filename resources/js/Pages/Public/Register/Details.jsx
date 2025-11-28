import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Input } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import PublicLayout from '@/Layouts/PublicLayout.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Details({ steps = [], currentStep, savedData = {}, accountType = 'company', baseDomain = 'platform.test' }) {
  const details = savedData?.details ?? {};
  const { data, setData, post, processing, errors } = useForm({
    name: details.name ?? '',
    email: details.email ?? '',
    phone: details.phone ?? '',
    subdomain: details.subdomain ?? '',
    team_size: details.team_size ?? '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    post(route('platform.register.details.store'));
  };

  const personaLabel = accountType === 'individual' ? 'Your name' : 'Organization name';

  return (
    <PublicLayout mainClassName="pt-28 pb-20">
      <Head title="Workspace details" />
      <section className="max-w-5xl mx-auto px-6 space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Step 2</p>
          <h1 className="text-4xl font-semibold text-white">Tell us about {accountType === 'individual' ? 'you' : 'your company'}.</h1>
          <p className="text-white/70">We will use this to pre-configure branding, subdomain, and trial communications.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={personaLabel}
              placeholder="Acme Manufacturing"
              value={data.name}
              onChange={(event) => setData('name', event.target.value)}
              isInvalid={Boolean(errors.name)}
              errorMessage={errors.name}
              isRequired
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="email"
                label="Work email"
                placeholder="ops@acme.com"
                value={data.email}
                onChange={(event) => setData('email', event.target.value)}
                isInvalid={Boolean(errors.email)}
                errorMessage={errors.email}
                isRequired
              />
              <Input
                label="Phone (optional)"
                placeholder="+1 415 555 0110"
                value={data.phone}
                onChange={(event) => setData('phone', event.target.value)}
                isInvalid={Boolean(errors.phone)}
                errorMessage={errors.phone}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              <Input
                label="Preferred subdomain"
                placeholder="acme"
                value={data.subdomain}
                onChange={(event) => setData('subdomain', event.target.value.toLowerCase())}
                isInvalid={Boolean(errors.subdomain)}
                errorMessage={errors.subdomain}
                description={`Your workspace URL will be https://${data.subdomain || 'team'}.${baseDomain}`}
                isRequired
              />
              <Input
                type="number"
                label="Team size"
                placeholder="120"
                value={data.team_size}
                onChange={(event) => setData('team_size', event.target.value)}
                isInvalid={Boolean(errors.team_size)}
                errorMessage={errors.team_size}
                min={1}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href={route('platform.register.index')} className="text-sm text-white/70 hover:text-white transition-colors">
                ← Back to account type
              </Link>
              <Button color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600" type="submit" isLoading={processing}>
                Continue to modules
              </Button>
            </div>
          </form>
        </AuthCard>
      </section>
    </PublicLayout>
  );
}
