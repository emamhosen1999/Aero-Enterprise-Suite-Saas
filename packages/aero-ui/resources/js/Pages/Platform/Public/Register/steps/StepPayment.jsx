import { useState } from 'react';
import { router } from '@inertiajs/react';
import { VStack, HStack, Box, Text, Mono, Button, Alert } from '@aero/ui';
import { SR } from '../signupRoutes.js';

/**
 * StepPayment — trial activation review & summary.
 *
 * Derives selected plan and modules from savedData.
 * No payment details required — pure trial activation.
 */
export default function StepPayment({
  trialDays    = 14,
  baseDomain   = '',
  plans        = [],
  modules      = [],
  modulePricing = {},
  savedData    = {},
}) {
  const [submitting, setSubmitting] = useState(false);

  const planData = savedData?.plan ?? {};
  const details  = savedData?.details ?? {};

  const companyName   = details.name      ?? '';
  const email         = details.email     ?? '';
  const subdomain     = details.subdomain ?? '';
  const billing       = planData.billing  ?? 'monthly';
  const selectedMods  = planData.modules  ?? [];

  // Find selected plan object
  const selectedPlan = plans.find(p => p.id === planData.plan_id);

  // Find selected module objects
  const selectedModuleObjects = modules.filter(m => selectedMods.includes(m.code));

  function getPrice(plan) {
    if (!plan) return 0;
    return billing === 'yearly' ? (plan.price_yearly ?? plan.price_monthly * 10) : (plan.price_monthly ?? 0);
  }

  function formatPrice(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  function formatDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function activate() {
    if (submitting) return;
    setSubmitting(true);
    router.post(SR.activateTrial, {}, { onFinish: () => setSubmitting(false) });
  }

  const planPrice     = getPrice(selectedPlan);
  const moduleTotal   = selectedMods.reduce((sum, code) => sum + (modulePricing[code] ?? 0), 0);
  const totalMonthly  = planPrice + moduleTotal;
  const trialEndDate  = formatDate(trialDays);

  return (
    <VStack gap={5}>
      <Alert intent="info" title="No credit card required">
        Your {trialDays}-day free trial starts today. You won&apos;t be charged until your trial ends.
      </Alert>

      {/* Summary card */}
      <div className="rl-summary">
        {/* Company row */}
        <div className="rl-summary-section-label">Workspace</div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">Company</span>
          <span className="rl-summary-value">{companyName || '—'}</span>
        </div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">Email</span>
          <span className="rl-summary-value">{email || '—'}</span>
        </div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">URL</span>
          <Mono size="sm">{subdomain ? `${subdomain}.${baseDomain}` : '—'}</Mono>
        </div>

        <div className="rl-summary-divider" />

        {/* Plan row */}
        <div className="rl-summary-section-label">Plan</div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">Plan</span>
          <span className="rl-summary-value">{selectedPlan?.name ?? '—'}</span>
        </div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">Billing</span>
          <span className="rl-summary-value">
            {billing === 'yearly' ? 'Yearly' : 'Monthly'}
          </span>
        </div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">Plan price</span>
          <span className="rl-summary-value">
            {selectedPlan ? `${formatPrice(planPrice)}/${billing === 'yearly' ? 'yr' : 'mo'}` : '—'}
          </span>
        </div>

        {/* Selected modules */}
        {selectedModuleObjects.length > 0 && (
          <>
            <div className="rl-summary-divider" />
            <div className="rl-summary-section-label">Add-ons</div>
            {selectedModuleObjects.map(mod => (
              <div key={mod.code} className="rl-summary-row">
                <span className="rl-summary-label">{mod.name}</span>
                <span className="rl-summary-value">
                  {modulePricing[mod.code] != null ? `+${formatPrice(modulePricing[mod.code])}/mo` : 'Included'}
                </span>
              </div>
            ))}
          </>
        )}

        <div className="rl-summary-divider" />

        {/* Trial summary */}
        <div className="rl-summary-section-label">Trial</div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">Free trial</span>
          <span className="rl-summary-value rl-summary-value-highlight">{trialDays} days</span>
        </div>
        <div className="rl-summary-row">
          <span className="rl-summary-label">Trial ends</span>
          <span className="rl-summary-value">{trialEndDate}</span>
        </div>
        <div className="rl-summary-row rl-summary-total">
          <span className="rl-summary-label">After trial</span>
          <span className="rl-summary-value">
            {selectedPlan ? `${formatPrice(totalMonthly)}/mo` : '—'}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Button
        type="button"
        intent="primary"
        fullWidth
        size="lg"
        loading={submitting}
        rightIcon="arrowRight"
        onClick={activate}
      >
        Start Free Trial
      </Button>

      {/* Back navigation */}
      <div className="rl-nav">
        <Button
          type="button"
          intent="ghost"
          leftIcon="arrowLeft"
          onClick={() => router.get(SR.plan)}
        >
          Back to plans
        </Button>
      </div>

      <style>{`
        .rl-summary {
          background: var(--aeos-bg-page);
          border: 1px solid var(--aeos-divider);
          border-radius: var(--aeos-r-xl);
          overflow: hidden;
        }
        .rl-summary-section-label {
          font-size: .65rem;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--aeos-text-tertiary);
          font-family: var(--aeos-font-mono);
          padding: .75rem 1.25rem .35rem;
        }
        .rl-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: .5rem 1.25rem;
          font-size: .875rem;
          border-bottom: 1px solid var(--aeos-divider);
        }
        .rl-summary-row:last-child { border-bottom: none; }
        .rl-summary-label {
          color: var(--aeos-text-secondary);
          flex-shrink: 0;
        }
        .rl-summary-value {
          color: var(--aeos-text-primary);
          font-weight: 500;
          text-align: right;
          word-break: break-all;
        }
        .rl-summary-value-highlight {
          color: var(--aeos-primary);
        }
        .rl-summary-total {
          background: rgba(0,229,255,.03);
          font-weight: 600;
        }
        .rl-summary-divider {
          height: 1px;
          background: var(--aeos-divider);
          margin: 0;
        }
      `}</style>
    </VStack>
  );
}
