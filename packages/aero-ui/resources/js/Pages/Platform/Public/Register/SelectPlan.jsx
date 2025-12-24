import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import SafeLink from '@/Components/Common/SafeLink';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { Button, Card, CardBody, CardHeader, Chip, Switch, Textarea, Divider, CheckboxGroup, Checkbox } from '@heroui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import { showToast } from '@/utils/toastUtils.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function SelectPlan({ steps = [], currentStep, savedData = {}, plans = [], modules = [], modulePricing = {} }) {
  const planData = savedData?.plan ?? {};
  const planList = Array.isArray(plans) ? plans : [];
  const moduleList = Array.isArray(modules) ? modules : [];

  const { data, setData, post, processing, errors } = useForm({
    billing_cycle: planData.billing_cycle ?? 'monthly',
    plan_id: planData.plan_id ?? null,
    modules: Array.isArray(planData.modules) ? planData.modules : [],
    notes: planData.notes ?? '',
  });

  const { siteName } = useBranding();

  const selectPlan = (planId) => {
    if (data.plan_id === planId) {
      // Deselect plan
      setData({ ...data, plan_id: null });
    } else {
      // Select plan and clear any individual modules
      setData({ ...data, plan_id: planId, modules: [] });
    }
  };

  const toggleModule = (id) => {
    // If a plan is selected, clear it when selecting modules
    const currentModules = Array.isArray(data.modules) ? data.modules : [];
    const newModules = currentModules.includes(id)
      ? currentModules.filter((item) => item !== id)
      : [...currentModules, id];
    setData({ ...data, modules: newModules, plan_id: null });
  };

  const isAnnual = data.billing_cycle === 'yearly';
  const selectedPlan = planList.find(p => p.id === data.plan_id);
  const modulesList = Array.isArray(data.modules) ? data.modules : [];
  
  // Calculate price: Either plan price OR modules price, not both
  const pricePerModule = isAnnual ? modulePricing.yearly ?? 200 : modulePricing.monthly ?? 20;
  const planPrice = selectedPlan ? (isAnnual ? selectedPlan.yearly_price : selectedPlan.monthly_price) : 0;
  const modulesOnlyPrice = !selectedPlan && modulesList.length > 0 ? modulesList.length * pricePerModule : 0;
  const estimated = selectedPlan ? planPrice : modulesOnlyPrice;

  const selectedModules = useMemo(
    () => moduleList.filter((module) => modulesList.includes(module.id)),
    [moduleList, modulesList]
  );

  // Check if any selection is made - ensure it's reactive to data changes
  const hasSelection = useMemo(() => {
    const hasPlan = Boolean(data.plan_id);
    const hasModules = Array.isArray(data.modules) && data.modules.length > 0;
    const result = hasPlan || hasModules;
    console.log('hasSelection check:', { hasPlan, hasModules, result, plan_id: data.plan_id, modules: data.modules });
    return result;
  }, [data.plan_id, data.modules]);

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Validate that at least one selection is made
    if (!hasSelection) {
      showToast.warning('Please select a plan or at least one module to continue.');
      return;
    }
    
    // Validate route exists before submission
    if (!hasRoute('platform.register.plan.store')) {
      console.error('Route platform.register.plan.store not found');
      showToast.error('Navigation route not found. Please contact support.');
      return;
    }
    
    const url = route('platform.register.plan.store');
    post(url);
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
      <Head title={`Choose modules - ${siteName || 'aeos365'}`} />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-2 sm:space-y-3 text-center">
          <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 4</p>
          <h1 className={`text-2xl sm:text-4xl font-semibold ${palette.heading} px-2`}>Choose Your Plan & Products</h1>
          <p className={`${palette.copy} text-sm sm:text-base px-2`}>Select a pre-configured plan or customize with individual products.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr,1fr]">
          {/* Mobile: Price Summary at Top */}
          <div className="lg:hidden order-first">
            <AuthCard>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className={`text-xs sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Total Estimate</p>
                  <h2 className={`text-2xl sm:text-3xl font-semibold ${palette.heading}`}>${estimated.toLocaleString()}</h2>
                </div>
                <p className={`text-xs sm:text-sm ${palette.copy}`}>Per {isAnnual ? 'year' : 'month'}</p>
                
                <Divider />
                
                {/* Breakdown */}
                <div className="space-y-2 text-xs sm:text-sm">
                  {selectedPlan ? (
                    <>
                      <div className="flex justify-between">
                        <span className={palette.copy}>{selectedPlan.name} Plan</span>
                        <span className={palette.heading}>${planPrice.toLocaleString()}</span>
                      </div>
                      <p className={`text-xs ${palette.muted}`}>Includes {selectedPlan.modules?.length || 0} modules</p>
                    </>
                  ) : modulesList.length > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className={palette.copy}>{modulesList.length} Custom Module{modulesList.length !== 1 ? 's' : ''}</span>
                        <span className={palette.heading}>${modulesOnlyPrice.toLocaleString()}</span>
                      </div>
                      <p className={`text-xs ${palette.muted}`}>Custom plan</p>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className={palette.copy}>No selection</span>
                      <span className={palette.muted}>$0</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className={palette.copy}>Core Platform</span>
                    <span className="text-emerald-500">Free</span>
                  </div>
                </div>
                
                <Divider />
                
                {/* Selected items */}
                {(selectedPlan || selectedModules.length > 0) && (
                  <div>
                    <p className={`text-xs font-semibold ${palette.muted} mb-2`}>YOUR SELECTION:</p>
                    <ul className={`text-xs space-y-1 ${palette.copy}`}>
                      {selectedPlan ? (
                        selectedPlan.modules && selectedPlan.modules.map((module) => (
                          <li key={module.id} className="flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                            {module.name}
                          </li>
                        ))
                      ) : (
                        selectedModules.map((module) => (
                          <li key={module.id} className="flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {module.name}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AuthCard>
          </div>

          <AuthCard>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Billing Cadence Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <p className={`text-xs sm:text-sm ${palette.muted}`}>Billing cadence</p>
                <div className={`flex items-center gap-2 text-xs sm:text-sm ${palette.copy}`}>
                  <span className={!isAnnual ? `font-semibold ${palette.heading}` : palette.muted}>Monthly</span>
                  <Switch isSelected={isAnnual} onChange={() => setData('billing_cycle', isAnnual ? 'monthly' : 'yearly')} color="secondary" aria-label="Toggle billing cycle" size="sm" />
                  <span className={isAnnual ? `font-semibold ${palette.heading}` : palette.muted}>Yearly <small className="text-emerald-500">(2 mo free)</small></span>
                </div>
              </div>

              <Divider className="my-4" />

              {/* Section 1: Pre-configured Plans */}
              <div className="space-y-3">
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold ${palette.heading}`}>1. Choose a Plan</h3>
                  <p className={`text-xs sm:text-sm ${palette.copy}`}>Pre-configured bundles with modules included</p>
                </div>
                
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  {planList.map((plan) => {
                    const selected = data.plan_id === plan.id;
                    const planPrice = isAnnual ? plan.yearly_price : plan.monthly_price;
                    return (
                      <Card
                        key={plan.id}
                        isPressable
                        onPress={() => selectPlan(plan.id)}
                        className={selected ? palette.selectedCard : palette.card}
                      >
                        <CardHeader className="flex-col items-start pb-2">
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <h2 className={`text-lg sm:text-xl font-bold ${palette.heading}`}>{plan.name}</h2>
                              {plan.badge && (
                                <Chip size="sm" color="primary" variant="flat" className="mt-1">
                                  {plan.badge}
                                </Chip>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`text-xl sm:text-2xl font-bold ${palette.heading}`}>${planPrice}</p>
                              <p className={`text-xs ${palette.muted}`}>/{isAnnual ? 'year' : 'month'}</p>
                            </div>
                          </div>
                          <p className={`text-xs sm:text-sm ${palette.copy} mt-2`}>{plan.description}</p>
                        </CardHeader>
                        <CardBody className="text-xs sm:text-sm space-y-3 pt-2">
                          {/* Included Modules */}
                          {plan.modules && plan.modules.length > 0 && (
                            <div>
                              <p className={`text-xs font-semibold ${palette.muted} mb-2`}>INCLUDED MODULES:</p>
                              <div className="space-y-2">
                                {plan.modules.map((module) => (
                                  <div key={module.id} className="flex items-start gap-2">
                                    <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-medium ${palette.heading} text-sm`}>{module.name}</p>
                                      {module.description && (
                                        <p className={`text-xs ${palette.muted} line-clamp-2`}>{module.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Features */}
                          {plan.features && plan.features.length > 0 && (
                            <div className="space-y-1">
                              {plan.features.slice(0, 3).map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className={palette.copy}>{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Selection indicator */}
                          <div className="pt-2">
                            <Chip size="sm" color={selected ? 'success' : 'default'} variant={selected ? 'solid' : 'flat'}>
                              {selected ? '✓ Selected' : 'Select Plan'}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Divider className="my-4" />

              {/* Section 2: Additional Modules */}
              <div className="space-y-3">
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold ${palette.heading}`}>2. Or Build Custom with Modules</h3>
                  <p className={`text-xs sm:text-sm ${palette.copy}`}>Select individual modules • ${pricePerModule}/{isAnnual ? 'year' : 'month'} per module</p>
                  <p className={`text-xs ${palette.muted} mt-1`}>💡 Selecting modules will deselect any plan • Core Platform is always included free</p>
                </div>
                
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  {moduleList.map((module) => {
                    const selected = modulesList.includes(module.id);
                    return (
                      <Card
                        key={module.id}
                        isPressable
                        onPress={() => toggleModule(module.id)}
                        className={selected ? palette.selectedCard : palette.card}
                      >
                        <CardHeader className="justify-between pb-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] sm:text-xs uppercase tracking-[0.4em] ${palette.muted}`}>{module.category}</p>
                            <h2 className={`text-base sm:text-xl font-semibold ${palette.heading} truncate`}>{module.name}</h2>
                          </div>
                          <Chip size="sm" color={selected ? 'success' : 'default'} variant="flat" className="text-[10px] sm:text-xs ml-2 shrink-0">
                            {selected ? '✓ Added' : 'Add'}
                          </Chip>
                        </CardHeader>
                        <CardBody className="text-xs sm:text-sm space-y-2 pt-2">
                          <p className={palette.copy}>{module.description}</p>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
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
                classNames={{
                  label: 'text-sm sm:text-base',
                  input: 'text-sm sm:text-base'
                }}
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <SafeLink route="platform.register.details" className={`text-xs sm:text-sm transition-colors text-center sm:text-left ${palette.link}`}>
                  ← Back to details
                </SafeLink>
                <Button 
                  type="submit" 
                  color="primary" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 w-full sm:w-auto" 
                  isLoading={processing}
                  isDisabled={processing || !hasSelection}
                >
                  Review & launch trial
                </Button>
              </div>
            </form>
          </AuthCard>

          {/* Desktop: Price Summary on Side */}
          <div className="hidden lg:block space-y-4">
            <AuthCard>
              <div className="space-y-3">
                <p className={`text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Total Estimate</p>
                <h2 className={`text-3xl font-semibold ${palette.heading}`}>${estimated.toLocaleString()}</h2>
                <p className={`text-sm ${palette.copy}`}>Per {isAnnual ? 'year' : 'month'}</p>
                
                <Divider />
                
                <div className="space-y-2 text-sm">
                  {selectedPlan ? (
                    <>
                      <div className="flex justify-between">
                        <span className={palette.copy}>{selectedPlan.name} Plan</span>
                        <span className={palette.heading}>${planPrice.toLocaleString()}</span>
                      </div>
                      <p className={`text-xs ${palette.muted}`}>Includes {selectedPlan.modules?.length || 0} modules</p>
                    </>
                  ) : modulesList.length > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className={palette.copy}>{modulesList.length} Module{modulesList.length !== 1 ? 's' : ''}</span>
                        <span className={palette.heading}>${modulesOnlyPrice.toLocaleString()}</span>
                      </div>
                      <p className={`text-xs ${palette.muted}`}>Custom plan</p>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className={palette.copy}>No selection</span>
                      <span className={palette.muted}>$0</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className={palette.copy}>Core Platform</span>
                    <span className="text-emerald-500">Free</span>
                  </div>
                </div>
                
                <Divider />
                
                {(selectedPlan || selectedModules.length > 0) && (
                  <div>
                    <p className={`text-xs font-semibold ${palette.muted} mb-2`}>YOUR SELECTION:</p>
                    <ul className={`text-sm space-y-1 ${palette.copy}`}>
                      {selectedPlan ? (
                        selectedPlan.modules && selectedPlan.modules.map((module) => (
                          <li key={module.id} className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                            {module.name}
                          </li>
                        ))
                      ) : (
                        selectedModules.map((module) => (
                          <li key={module.id} className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                            {module.name}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AuthCard>
            <Card className={`${palette.surface} text-sm`}>
              <CardBody className="space-y-2">
                <p className={`font-semibold ${palette.heading}`}>Flexible Pricing</p>
                <p className={palette.copy}>Choose a pre-configured plan OR build custom with individual modules. Pick what works best for your needs.</p>
                <p className="text-emerald-500">Core platform features (auth, users, settings) are always included at no extra cost.</p>
              </CardBody>
            </Card>
          </div>

          {/* Mobile: Info Card at Bottom */}
          <div className="lg:hidden">
            <Card className={`${palette.surface} text-xs sm:text-sm`}>
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
