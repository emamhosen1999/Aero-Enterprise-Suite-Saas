import { useState } from 'react';
import { router } from '@inertiajs/react';
import { VStack, Text } from '@aero/ui';
import { SR } from '../signupRoutes.js';

/** SVG: office building icon for Company type */
function IconBuilding() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="24" height="26" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <rect x="28" y="18" width="8" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <rect x="9"  y="15" width="4" height="4" rx=".8" fill="currentColor" />
      <rect x="17" y="15" width="4" height="4" rx=".8" fill="currentColor" />
      <rect x="9"  y="23" width="4" height="4" rx=".8" fill="currentColor" />
      <rect x="17" y="23" width="4" height="4" rx=".8" fill="currentColor" />
      <rect x="13" y="30" width="6" height="6" rx=".8" fill="currentColor" />
    </svg>
  );
}

/** SVG: person/individual icon */
function IconPerson() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="13" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * StepAccount — account type selection step.
 *
 * Renders two clickable card buttons (Company / Individual).
 * Immediately POSTs on click — no separate submit button needed.
 */
export default function StepAccount({ trialDays = 14, savedData = {} }) {
  const preSelected = savedData?.account?.type ?? null;
  const [selected, setSelected]     = useState(preSelected);
  const [submitting, setSubmitting] = useState(false);

  function choose(type) {
    if (submitting) return;
    setSelected(type);
    setSubmitting(true);
    router.post(
      SR.storeAccount,
      { type },
      { onFinish: () => setSubmitting(false) },
    );
  }

  return (
    <>
      <Text tone="secondary">
        Start your {trialDays}-day free trial. No credit card required.
      </Text>

      <VStack gap={3}>
        {/* Company card */}
        <button
          type="button"
          className={`rl-type-card${selected === 'company' ? ' rl-type-card-active' : ''}`}
          onClick={() => choose('company')}
          disabled={submitting}
          aria-pressed={selected === 'company'}
        >
          <span className="rl-type-icon">
            <IconBuilding />
          </span>
          <span className="rl-type-name">Company</span>
          <span className="rl-type-desc">
            For teams and businesses. Includes team management, roles, and multi-user access.
          </span>
        </button>

        {/* Individual card */}
        <button
          type="button"
          className={`rl-type-card${selected === 'individual' ? ' rl-type-card-active' : ''}`}
          onClick={() => choose('individual')}
          disabled={submitting}
          aria-pressed={selected === 'individual'}
        >
          <span className="rl-type-icon">
            <IconPerson />
          </span>
          <span className="rl-type-name">Individual</span>
          <span className="rl-type-desc">
            For freelancers and solo operators. Full platform access, personal workspace.
          </span>
        </button>
      </VStack>

      <style>{`
        .rl-type-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          padding: 1.5rem;
          background: var(--aeos-bg-surface);
          border: 1.5px solid var(--aeos-divider);
          border-radius: var(--aeos-r-xl);
          cursor: pointer;
          transition: border-color .15s, background .15s, box-shadow .15s;
          text-align: left;
        }
        .rl-type-card:hover:not(:disabled) {
          border-color: var(--aeos-primary);
          background: rgba(0,229,255,.03);
        }
        .rl-type-card:disabled {
          cursor: wait;
          opacity: .7;
        }
        .rl-type-card-active {
          border-color: var(--aeos-primary) !important;
          background: rgba(0,229,255,.06) !important;
          box-shadow: 0 0 0 3px rgba(0,229,255,.12);
        }
        .rl-type-icon {
          color: var(--aeos-primary);
          display: flex;
          margin-bottom: 4px;
        }
        .rl-type-name {
          font-family: var(--aeos-font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--aeos-text-primary);
          letter-spacing: -.01em;
        }
        .rl-type-desc {
          font-size: .875rem;
          color: var(--aeos-text-secondary);
          line-height: 1.55;
        }
      `}</style>
    </>
  );
}
