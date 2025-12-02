import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, CardBody, Chip, Input } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import Checkbox from '@/Components/Checkbox.jsx';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Payment({ steps = [], currentStep, savedData = {}, trialDays = 14, baseDomain = 'platform.test', modulesCatalog = [], modulePricing = {} }) {
  const account = savedData.account ?? {};
  const details = savedData.details ?? {};
  const plan = savedData.plan ?? {};

  const catalogMap = useMemo(() => Object.fromEntries(modulesCatalog.map((module) => [module.code, module])), [modulesCatalog]);
  const selectedModules = (plan.modules ?? []).map((code) => catalogMap[code]?.name ?? code.toUpperCase());

  const { data, setData, post, processing, errors } = useForm({
    password: '',
    password_confirmation: '',
    accept_terms: false,
    notify_updates: true,
  });

  const { siteName } = useBranding();

  const pricePerModule = plan.billing_cycle === 'yearly' ? modulePricing.yearly ?? 200 : modulePricing.monthly ?? 20;
  const estimate = (plan.modules?.length || 1) * pricePerModule;

  const handleSubmit = (event) => {
    event.preventDefault();
    post(route('platform.register.trial.activate'));
  };

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const palette = {
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-slate-300' : 'text-slate-500',
    surface: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm',
    link: isDarkMode ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900',
  };

  return (
    <RegisterLayout>
      <Head title={`Review & launch - ${siteName || 'aeos365'}`} />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-2 sm:space-y-3 text-center">
          <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 4</p>
          <h1 className={`text-2xl sm:text-4xl font-semibold ${palette.heading} px-2`}>Review and start your trial.</h1>
          <p className={`${palette.copy} text-sm sm:text-base px-2`}>Payments go live later. Today we just launch your {trialDays}-day sandbox and wire up the modules you picked.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
              <Card className={`${palette.surface} text-xs sm:text-sm`}>
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={`uppercase tracking-[0.3em] text-[10px] sm:text-xs ${palette.badge}`}>Workspace</p>
                    <Chip size="sm" color="secondary" variant="flat" className="text-[10px] sm:text-xs">{account.type ?? 'company'}</Chip>
                  </div>
                  <p className={`text-base sm:text-lg font-semibold ${palette.heading} break-words`}>{details.name}</p>
                  <p className={`${palette.copy} break-all`}>{details.email}</p>
                  {details.phone && <p className={palette.copy}>{details.phone}</p>}
                  <p className={`text-xs sm:text-sm ${palette.copy} break-all`}>URL: <span className="font-mono">https://{details.subdomain}.{baseDomain}</span></p>
                </CardBody>
              </Card>

              <Card className={`${palette.surface} text-xs sm:text-sm`}>
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={`uppercase tracking-[0.3em] text-[10px] sm:text-xs ${palette.badge}`}>Activation</p>
                    <Chip size="sm" color="success" variant="flat" className="text-[10px] sm:text-xs">{trialDays}-day trial</Chip>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-semibold ${palette.heading}`}>${estimate.toLocaleString()}</p>
                  <p className={palette.copy}>Projected per {plan.billing_cycle === 'yearly' ? 'year' : 'month'} once billing is enabled.</p>
                  <ul className={`space-y-1 ${palette.copy}`}>
                    {selectedModules.map((module) => (
                      <li key={module} className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="break-words">{module}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>

            <Card className={`${palette.surface} text-xs sm:text-sm`}>
              <CardBody className="space-y-3 sm:space-y-4">
                <div>
                  <p className={`font-semibold ${palette.heading}`}>Set your admin password</p>
                  <p className={`text-xs sm:text-sm ${palette.copy} break-all`}>This will be your super-admin login for {details.subdomain}.{baseDomain}</p>
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  <Input
                    type="password"
                    label="Password"
                    placeholder="Create a secure password"
                    value={data.password}
                    onChange={(event) => setData('password', event.target.value)}
                    isInvalid={Boolean(errors.password)}
                    errorMessage={errors.password}
                    isRequired
                    classNames={{
                      label: 'text-xs sm:text-sm',
                      input: 'text-sm sm:text-base'
                    }}
                  />
                  <Input
                    type="password"
                    label="Confirm password"
                    placeholder="Repeat your password"
                    value={data.password_confirmation}
                    onChange={(event) => setData('password_confirmation', event.target.value)}
                    isInvalid={Boolean(errors.password_confirmation)}
                    errorMessage={errors.password_confirmation}
                    isRequired
                    classNames={{
                      label: 'text-xs sm:text-sm',
                      input: 'text-sm sm:text-base'
                    }}
                  />
                </div>
              </CardBody>
            </Card>

            <Card className={`${palette.surface} text-xs sm:text-sm`}>
              <CardBody className="space-y-2 sm:space-y-3">
                <p className={`font-semibold ${palette.heading}`}>What happens next?</p>
                <ol className={`list-decimal list-inside space-y-2 ${palette.copy}`}>
                  <li>We provision your isolated database + files.</li>
                  <li className="break-words">Workspace URL ({details.subdomain}.{baseDomain}) goes live with default themes.</li>
                  <li>Within 5 minutes you will be redirected to your new workspace.</li>
                  <li>At any time during the trial you can add payment details to continue seamlessly.</li>
                </ol>
              </CardBody>
            </Card>

            <div className="space-y-3 sm:space-y-4">
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <Link href={route('platform.register.plan')} className={`text-xs sm:text-sm transition-colors text-center sm:text-left ${palette.link}`}>
                ← Back to modules
              </Link>
              <Button type="submit" color="success" className="px-6 w-full sm:w-auto" isLoading={processing}>
                Launch trial workspace
              </Button>
            </div>
          </form>
        </AuthCard>
      </section>
    </RegisterLayout>
  );
}
