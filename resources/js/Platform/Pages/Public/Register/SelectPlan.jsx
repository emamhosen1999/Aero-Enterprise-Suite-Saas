import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Chip, Switch, Textarea } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function SelectPlan({ steps = [], currentStep, savedData = {}, modules = [], modulePricing = {}, defaultModules = [] }) {
  const plan = savedData?.plan ?? {};
  const moduleList = Array.isArray(modules) ? modules : [];
  const normalizedDefaults = defaultModules.length ? defaultModules : moduleList.slice(0, 2).map((module) => module.code);

  const { data, setData, post, processing, errors } = useForm({
    billing_cycle: plan.billing_cycle ?? 'monthly',
    modules: plan.modules ?? normalizedDefaults,
    notes: plan.notes ?? '',
  });

  const toggleModule = (code) => {
    setData('modules', (current) => (
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    ));
  };

  const isAnnual = data.billing_cycle === 'yearly';
  const pricePerModule = isAnnual ? modulePricing.yearly ?? 200 : modulePricing.monthly ?? 20;
  const estimated = (data.modules.length || 1) * pricePerModule;

  const selectedModules = useMemo(
    () => moduleList.filter((module) => data.modules.includes(module.code)),
    [moduleList, data.modules]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    post(route('platform.register.plan.store'));
  };

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const palette = useMemo(() => ({
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-slate-300' : 'text-slate-500',
    card: isDarkMode ? 'border border-white/10 bg-white/5' : 'border border-slate-200 bg-white shadow-sm',
    selectedCard: isDarkMode ? 'border border-emerald-400/60 bg-emerald-500/10' : 'border border-emerald-200 bg-emerald-50',
    surface: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm',
    link: isDarkMode ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    accent: isDarkMode ? 'text-white' : 'text-slate-900',
  }), [isDarkMode]);

  return (
    <RegisterLayout>
      <Head title="Choose modules" />
      <section className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-3 text-center">
          <p className={`text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 3</p>
          <h1 className={`text-4xl font-semibold ${palette.heading}`}>Bundle the modules you need right now.</h1>
          <p className={palette.copy}>You can update this list anytime from the billing console. We price per active module.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <AuthCard>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className={`text-sm ${palette.muted}`}>Billing cadence</p>
                <div className={`flex items-center gap-2 text-sm ${palette.copy}`}>
                  <span className={!isAnnual ? `font-semibold ${palette.heading}` : palette.muted}>Monthly</span>
                  <Switch isSelected={isAnnual} onChange={() => setData('billing_cycle', isAnnual ? 'monthly' : 'yearly')} color="secondary" aria-label="Toggle billing cycle" />
                  <span className={isAnnual ? `font-semibold ${palette.heading}` : palette.muted}>Yearly <small className="text-emerald-500">(2 mo free)</small></span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {moduleList.map((module) => {
                  const selected = data.modules.includes(module.code);
                  return (
                    <Card
                      key={module.code}
                      isPressable
                      onPress={() => toggleModule(module.code)}
                      className={selected ? palette.selectedCard : palette.card}
                    >
                      <CardHeader className="justify-between">
                        <div>
                          <p className={`text-xs uppercase tracking-[0.4em] ${palette.muted}`}>{module.category}</p>
                          <h2 className={`text-xl font-semibold ${palette.heading}`}>{module.name}</h2>
                        </div>
                        <Chip size="sm" color={selected ? 'success' : 'default'} variant="flat">
                          {selected ? 'Added' : 'Tap to add'}
                        </Chip>
                      </CardHeader>
                      <CardBody className="text-sm space-y-3">
                        <p className={palette.copy}>{module.description}</p>
                        <p className={`font-semibold ${palette.heading}`}>${pricePerModule}/{isAnnual ? 'yr' : 'mo'} per module</p>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>

              {errors.modules && <p className="text-sm text-red-400">{errors.modules}</p>}

              <Textarea
                label="Implementation notes (optional)"
                placeholder="Tell us about integrations, compliance packs, or migration timelines."
                minRows={3}
                value={data.notes}
                onChange={(event) => setData('notes', event.target.value)}
                isInvalid={Boolean(errors.notes)}
                errorMessage={errors.notes}
              />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link href={route('platform.register.details')} className={`text-sm transition-colors ${palette.link}`}>
                  ← Back to details
                </Link>
                <Button type="submit" color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600" isLoading={processing}>
                  Review & launch trial
                </Button>
              </div>
            </form>
          </AuthCard>

          <div className="space-y-4">
            <AuthCard>
              <div className="space-y-3">
                <p className={`text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Estimate</p>
                <h2 className={`text-3xl font-semibold ${palette.heading}`}>${estimated.toLocaleString()}</h2>
                <p className={`text-sm ${palette.copy}`}>Per {isAnnual ? 'year' : 'month'}, billed for {data.modules.length || 1} module{data.modules.length === 1 ? '' : 's'}.</p>
                <ul className={`text-sm space-y-1 ${palette.copy}`}>
                  {selectedModules.map((module) => (
                    <li key={module.code} className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      {module.name}
                    </li>
                  ))}
                </ul>
              </div>
            </AuthCard>
            <Card className={`${palette.surface} text-sm`}>
              <CardBody className="space-y-2">
                <p className={`font-semibold ${palette.heading}`}>Why modules?</p>
                <p className={palette.copy}>Rolling modules lets finance teams align spend with adoption milestones. You can pause any module in 1 click.</p>
                <p className="text-emerald-500">Payment collection happens later. Right now we only need your wish list.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </RegisterLayout>
  );
}
