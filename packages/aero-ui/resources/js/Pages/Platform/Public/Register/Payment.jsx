import React, { useMemo, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, Chip, Input } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import Checkbox from '@/Components/Checkbox.jsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import { showToast } from '@/utils/toastUtils.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Payment({ steps = [], currentStep, savedData = {}, trialDays = 14, baseDomain = 'platform.test', plans = [], modules = [], modulePricing = {} }) {
  const account = savedData.account ?? {};
  const details = savedData.details ?? {};
  const admin = savedData.admin ?? {};
  const plan = savedData.plan ?? {};

  // Find selected plan
  const selectedPlan = plans.find(p => p.id === plan.plan_id);
  
  // Get selected module IDs (could be array of IDs or array of objects)
  const selectedModuleIds = Array.isArray(plan.modules) ? plan.modules : [];
  
  // Filter modules to get selected ones
  const selectedModules = modules.filter(m => selectedModuleIds.includes(m.id));
  
  // Calculate pricing
  const isAnnual = plan.billing_cycle === 'yearly';
  const pricePerModule = isAnnual ? modulePricing.yearly ?? 200 : modulePricing.monthly ?? 20;
  
  let estimate = 0;
  let selectedItems = [];
  let selectionType = '';
  
  if (selectedPlan) {
    // User selected a plan
    const planPrice = isAnnual ? (selectedPlan.yearly_price || 0) : (selectedPlan.monthly_price || 0);
    estimate = parseFloat(planPrice) || 0;
    selectedItems = Array.isArray(selectedPlan.modules) ? selectedPlan.modules.map(m => m.name || m) : [];
    selectionType = 'plan';
    
    console.log('Plan pricing:', { selectedPlan, isAnnual, planPrice, estimate });
  } else if (selectedModules.length > 0) {
    // User selected individual modules
    estimate = selectedModules.length * pricePerModule;
    selectedItems = selectedModules.map(m => m.name);
    selectionType = 'custom';
  }

  const { data, setData, post, processing, errors } = useForm({
    accept_terms: false,
    notify_updates: true,
  });

  const { siteName } = useBranding();
  const { flash } = usePage().props;

  // Show flash messages as toasts
  useEffect(() => {
    if (flash?.error) {
      showToast.error(flash.error);
    }
    if (flash?.success) {
      showToast.success(flash.success);
    }
  }, [flash]);

  const handleSubmit = (event) => {
    event.preventDefault();
    post(route('platform.register.trial.activate'), {
      onError: (errors) => {
        console.error('Activation failed:', errors);
        
        // Show specific error messages as toast
        if (errors.subdomain) {
          showToast.error(errors.subdomain);
        } else if (errors.email) {
          showToast.error(errors.email);
        } else if (errors.error) {
          showToast.error(errors.error);
        } else {
          showToast.error('Please check the form and try again.');
        }
      },
    });
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
          <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 5</p>
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
                  <p className={palette.copy}>Projected per {isAnnual ? 'year' : 'month'} once billing is enabled.</p>
                  {selectionType === 'plan' && selectedPlan && (
                    <p className={`text-xs ${palette.badge}`}>
                      <strong>{selectedPlan.name} Plan</strong> • {selectedItems.length} module{selectedItems.length !== 1 ? 's' : ''} included
                    </p>
                  )}
                  {selectionType === 'custom' && selectedItems.length > 0 && (
                    <p className={`text-xs ${palette.badge}`}>
                      <strong>Custom Selection</strong> • {selectedItems.length} module{selectedItems.length !== 1 ? 's' : ''} at ${pricePerModule}/{isAnnual ? 'year' : 'month'} each
                    </p>
                  )}
                  <ul className={`space-y-1 ${palette.copy}`}>
                    {selectedItems.map((module, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="break-words">{module}</span>
                      </li>
                    ))}
                    {selectedItems.length === 0 && (
                      <li className={`text-xs ${palette.badge}`}>No modules selected</li>
                    )}
                  </ul>
                </CardBody>
              </Card>
            </div>

            <Card className={`${palette.surface} text-xs sm:text-sm`}>
              <CardBody className="space-y-3 sm:space-y-4">
                <div>
                  <p className={`font-semibold ${palette.heading}`}>Administrator Login</p>
                  <p className={`text-xs sm:text-sm ${palette.copy} break-all`}>
                    <strong>{admin.name}</strong> ({admin.username}) will be able to login at {details.subdomain}.{baseDomain}
                  </p>
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
