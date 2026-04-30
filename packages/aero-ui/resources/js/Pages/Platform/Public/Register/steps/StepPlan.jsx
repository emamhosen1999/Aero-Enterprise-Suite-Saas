import { useState } from 'react';
import { router } from '@inertiajs/react';
import { VStack, HStack, Box, Text, Button, Badge, Toggle } from '@aero/ui';
import { SR } from '../signupRoutes.js';

/**
 * StepPlan — plan selection with billing toggle and optional module add-ons.
 *
 * Plans are displayed in a responsive grid of cards.
 * Modules not included in the selected plan are shown as optional add-ons.
 */
export default function StepPlan({ plans = [], modules = [], modulePricing = {}, savedData = {} }) {
  const [billing,         setBilling]         = useState(savedData?.plan?.billing ?? 'monthly');
  const [selectedPlanId,  setSelectedPlanId]  = useState(savedData?.plan?.plan_id ?? null);
  const [selectedModules, setSelectedModules] = useState(savedData?.plan?.modules ?? []);
  const [submitting,      setSubmitting]      = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Modules included in the currently selected plan
  const includedModuleCodes = selectedPlan?.included_modules ?? [];

  // Add-on modules = all modules minus those already included
  const addonModules = modules.filter(m => !includedModuleCodes.includes(m.code));

  function toggleModule(code) {
    setSelectedModules(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  }

  function proceed() {
    if (!selectedPlanId || submitting) return;
    setSubmitting(true);
    router.post(
      SR.storePlan,
      { plan_id: selectedPlanId, modules: selectedModules, billing },
      { onFinish: () => setSubmitting(false) },
    );
  }

  function getPrice(plan) {
    if (billing === 'yearly') {
      return plan.price_yearly ?? plan.price_monthly * 10; // typical 2-month discount
    }
    return plan.price_monthly ?? 0;
  }

  function formatPrice(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  return (
    <VStack gap={5}>
      {/* Billing toggle */}
      <HStack gap={3} align="center">
        <Button
          type="button"
          intent={billing === 'monthly' ? 'primary' : 'soft'}
          size="sm"
          onClick={() => setBilling('monthly')}
        >
          Monthly
        </Button>
        <Button
          type="button"
          intent={billing === 'yearly' ? 'primary' : 'soft'}
          size="sm"
          onClick={() => setBilling('yearly')}
        >
          Yearly
          {billing === 'yearly' && (
            <Badge intent="success">Save 2 months</Badge>
          )}
        </Button>
        {billing === 'monthly' && (
          <Text tone="secondary">Switch to yearly and save 2 months.</Text>
        )}
      </HStack>

      {/* Plan cards */}
      <div className="rl-plan-grid">
        {plans.map(plan => {
          const isSelected = plan.id === selectedPlanId;
          const price = getPrice(plan);
          return (
            <button
              key={plan.id}
              type="button"
              className={`rl-plan-card${isSelected ? ' rl-plan-card-selected' : ''}`}
              onClick={() => {
                setSelectedPlanId(plan.id);
                // Remove selected modules that are now included in new plan
                const newIncluded = plan.included_modules ?? [];
                setSelectedModules(prev => prev.filter(c => !newIncluded.includes(c)));
              }}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <div className="rl-plan-selected-badge">
                  <Badge intent="success">Selected</Badge>
                </div>
              )}
              {plan.popular && !isSelected && (
                <div className="rl-plan-selected-badge">
                  <Badge intent="amber">Most Popular</Badge>
                </div>
              )}

              <Text size="sm" tone="secondary">{plan.description ?? ''}</Text>
              <div className="rl-plan-name">{plan.name}</div>

              <div className="rl-plan-price">
                <span className="rl-plan-price-amount">{formatPrice(price)}</span>
                <span className="rl-plan-price-per">/{billing === 'yearly' ? 'yr' : 'mo'}</span>
              </div>

              {plan.features?.length > 0 && (
                <ul className="rl-plan-features" aria-label={`${plan.name} features`}>
                  {plan.features.map((feat, i) => (
                    <li key={i} className="rl-plan-feature">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      {/* Module add-ons */}
      {addonModules.length > 0 && (
        <VStack gap={3}>
          <div className="rl-section-label">Optional Add-ons</div>
          <div className="rl-addon-grid">
            {addonModules.map(mod => {
              const isChecked = selectedModules.includes(mod.code);
              const price     = modulePricing[mod.code];
              return (
                <button
                  key={mod.code}
                  type="button"
                  className={`rl-addon-card${isChecked ? ' rl-addon-card-active' : ''}`}
                  onClick={() => toggleModule(mod.code)}
                  aria-pressed={isChecked}
                >
                  <HStack gap={2} align="center">
                    <div className={`rl-addon-check${isChecked ? ' rl-addon-check-active' : ''}`}>
                      {isChecked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <Box grow>
                      <div className="rl-addon-name">{mod.name}</div>
                      {mod.description && (
                        <Text tone="tertiary" size="xs">{mod.description}</Text>
                      )}
                    </Box>
                    {price != null && (
                      <Text tone="secondary" size="sm">
                        +{formatPrice(price)}/mo
                      </Text>
                    )}
                  </HStack>
                </button>
              );
            })}
          </div>
        </VStack>
      )}

      {/* Navigation */}
      <div className="rl-nav">
        <Button
          type="button"
          intent="ghost"
          leftIcon="arrowLeft"
          onClick={() => router.get(SR.verifyPhone)}
        >
          Back
        </Button>
        <Button
          type="button"
          intent="primary"
          rightIcon="arrowRight"
          loading={submitting}
          disabled={!selectedPlanId}
          onClick={proceed}
        >
          Continue
        </Button>
      </div>

      <style>{`
        .rl-plan-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .rl-plan-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          padding: 1.5rem;
          background: var(--aeos-bg-surface);
          border: 1.5px solid var(--aeos-divider);
          border-radius: var(--aeos-r-xl);
          cursor: pointer;
          text-align: left;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }
        .rl-plan-card:hover:not(:disabled) {
          border-color: var(--aeos-primary);
          background: rgba(0,229,255,.03);
        }
        .rl-plan-card-selected {
          border-color: var(--aeos-primary) !important;
          background: rgba(0,229,255,.05) !important;
          box-shadow: 0 0 0 3px rgba(0,229,255,.12);
        }
        .rl-plan-selected-badge {
          position: absolute;
          top: 12px; right: 12px;
        }
        .rl-plan-name {
          font-family: var(--aeos-font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--aeos-text-primary);
          letter-spacing: -.01em;
        }
        .rl-plan-price {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .rl-plan-price-amount {
          font-family: var(--aeos-font-display);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--aeos-text-primary);
          letter-spacing: -.02em;
        }
        .rl-plan-price-per {
          font-size: .85rem;
          color: var(--aeos-text-tertiary);
        }
        .rl-plan-features {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .rl-plan-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: .85rem;
          color: var(--aeos-text-secondary);
        }
        .rl-plan-feature svg { color: var(--aeos-success); flex-shrink: 0; }

        /* Add-on modules */
        .rl-section-label {
          font-size: .7rem;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--aeos-text-tertiary);
          font-family: var(--aeos-font-mono);
        }
        .rl-addon-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rl-addon-card {
          width: 100%;
          padding: .875rem 1rem;
          background: var(--aeos-bg-surface);
          border: 1.5px solid var(--aeos-divider);
          border-radius: var(--aeos-r-lg);
          cursor: pointer;
          text-align: left;
          transition: border-color .15s, background .15s;
        }
        .rl-addon-card:hover {
          border-color: rgba(0,229,255,.4);
        }
        .rl-addon-card-active {
          border-color: var(--aeos-primary) !important;
          background: rgba(0,229,255,.04) !important;
        }
        .rl-addon-check {
          width: 18px; height: 18px;
          border-radius: 4px;
          border: 1.5px solid var(--aeos-divider);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all .15s;
        }
        .rl-addon-check-active {
          background: var(--aeos-primary);
          border-color: var(--aeos-primary);
          color: #0a0a0a;
        }
        .rl-addon-name {
          font-size: .9rem;
          font-weight: 600;
          color: var(--aeos-text-primary);
        }
      `}</style>
    </VStack>
  );
}
