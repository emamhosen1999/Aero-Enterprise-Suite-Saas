import { VStack, HStack, Text, Mono, Button } from '@aero/ui';

/**
 * StepSuccess — workspace provisioned successfully.
 *
 * Shows the workspace URL, trial end date, and CTAs to complete setup
 * or sign in later.
 */
export default function StepSuccess({ result = {}, baseDomain = '' }) {
  const { name = '', subdomain = '', trial_ends_at = null } = result;

  const workspaceUrl   = `https://${subdomain}.${baseDomain}`;
  const adminSetupUrl  = `${workspaceUrl}/admin-setup`;
  const loginUrl       = `${workspaceUrl}/login`;

  function formatTrialDate(isoDate) {
    if (!isoDate) return null;
    try {
      return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return isoDate;
    }
  }

  const trialEndFormatted = formatTrialDate(trial_ends_at);

  return (
    <VStack gap={5} align="center">
      {/* Large checkmark icon */}
      <div className="rl-success-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="rgba(34,197,94,.12)" stroke="rgba(34,197,94,.35)" strokeWidth="2" />
          <path d="M20 32l9 9 15-18" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Heading */}
      <VStack gap={2} align="center">
        <h1 className="rl-success-title">Welcome to AEOS365, {name}!</h1>
        <Text tone="secondary">
          Your workspace has been provisioned and is ready to use.
        </Text>
      </VStack>

      {/* Workspace URL badge */}
      <a
        href={workspaceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rl-success-url"
        aria-label={`Open workspace at ${workspaceUrl}`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 1c-1.5 1.5-2.5 3.2-2.5 6s1 4.5 2.5 6M7 1c1.5 1.5 2.5 3.2 2.5 6s-1 4.5-2.5 6M1 7h12" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <Mono size="sm">{subdomain}.{baseDomain}</Mono>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 9L9 3M9 3H5M9 3v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </a>

      {/* Trial info */}
      {trialEndFormatted && (
        <div className="rl-success-trial">
          <Text tone="secondary" size="sm">
            Free trial active &mdash; ends on{' '}
            <strong className="rl-success-trial-date">{trialEndFormatted}</strong>.
            No credit card required.
          </Text>
        </div>
      )}

      {/* Primary CTA */}
      <a
        href={adminSetupUrl}
        className="rl-success-cta-primary"
        rel="noopener noreferrer"
      >
        Complete Your Setup
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      {/* Secondary link */}
      <a
        href={loginUrl}
        className="rl-success-cta-secondary"
        rel="noopener noreferrer"
      >
        Sign in later
      </a>

      <style>{`
        .rl-success-icon {
          filter: drop-shadow(0 0 20px rgba(34,197,94,.25));
        }

        .rl-success-title {
          font-family: var(--aeos-font-display);
          font-size: 1.55rem;
          font-weight: 700;
          color: var(--aeos-text-primary);
          letter-spacing: -.02em;
          text-align: center;
          margin: 0;
          line-height: 1.2;
        }

        .rl-success-url {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: .5rem 1.25rem;
          background: rgba(0,229,255,.06);
          border: 1px solid rgba(0,229,255,.25);
          border-radius: var(--aeos-r-xl);
          color: var(--aeos-primary);
          text-decoration: none;
          transition: background .15s, box-shadow .15s;
        }
        .rl-success-url:hover {
          background: rgba(0,229,255,.1);
          box-shadow: 0 0 0 3px rgba(0,229,255,.12);
        }

        .rl-success-trial {
          text-align: center;
        }
        .rl-success-trial-date {
          color: var(--aeos-text-primary);
        }

        .rl-success-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: .875rem 2rem;
          background: var(--aeos-primary);
          color: #0a0a0a;
          font-weight: 700;
          font-size: .95rem;
          border-radius: var(--aeos-r-xl);
          text-decoration: none;
          transition: opacity .15s, box-shadow .15s;
          box-shadow: 0 0 20px rgba(0,229,255,.25);
          width: 100%;
          justify-content: center;
        }
        .rl-success-cta-primary:hover {
          opacity: .9;
          box-shadow: 0 0 28px rgba(0,229,255,.35);
        }

        .rl-success-cta-secondary {
          font-size: .875rem;
          color: var(--aeos-text-secondary);
          text-decoration: none;
          transition: color .15s;
        }
        .rl-success-cta-secondary:hover {
          color: var(--aeos-text-primary);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </VStack>
  );
}
