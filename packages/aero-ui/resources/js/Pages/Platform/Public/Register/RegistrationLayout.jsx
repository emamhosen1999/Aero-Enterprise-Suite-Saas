import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';

const STEP_LABELS = {
  account:       'Account',
  details:       'Details',
  'verify-email': 'Verify Email',
  'verify-phone': 'Verify Phone',
  plan:          'Plan',
  payment:       'Payment',
  provisioning:  'Setting Up',
  success:       'Complete',
};

/**
 * RegistrationLayout — wizard shell for the tenant signup flow.
 *
 * Forces light theme on body, hides ThemeDrawer. Renders a brand bar,
 * horizontal step progress indicator, a centred card, and a footer.
 *
 * @param {object}          props
 * @param {string}          props.title       - Heading inside the card
 * @param {string}          props.currentStep - Active step key
 * @param {string[]}        props.steps       - Ordered array of step keys
 * @param {boolean}         [props.wide]      - 900px card for plan/payment
 * @param {React.ReactNode} props.children
 */
export default function RegistrationLayout({ title, currentStep, steps = [], wide = false, children }) {
  useEffect(() => {
    const prev = document.body.className;
    document.body.dataset.noTheme = '1';
    document.body.className = 'aeos aeos--light';
    document.body.removeAttribute('data-aeos-shell');
    return () => {
      delete document.body.dataset.noTheme;
      document.body.className = prev;
    };
  }, []);

  const currentIndex = steps.indexOf(currentStep);

  return (
    <>
      <Head title={`${title} · AEOS365`} />

      <div className="rl-root">
        {/* Ambient gradient mesh */}
        <div className="rl-mesh" aria-hidden="true" />

        {/* Brand bar */}
        <header className="rl-brand">
          <Link href="/" className="rl-brand-link" aria-label="AEOS365 home">
            <span className="rl-logo-mark">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <rect width="30" height="30" rx="8" fill="url(#rl-grad)" />
                <path d="M9 21L15 9l6 12H9z" fill="white" fillOpacity=".92" />
                <defs>
                  <linearGradient id="rl-grad" x1="0" y1="0" x2="30" y2="30">
                    <stop stopColor="var(--aeos-primary, #00E5FF)" />
                    <stop offset="1" stopColor="var(--aeos-tertiary, #6366F1)" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="aeos-logo-text">aeos365</span>
          </Link>
        </header>

        {/* Step progress indicator */}
        {steps.length > 0 && (
          <nav className="rl-steps" aria-label="Signup progress">
            {steps.map((stepKey, i) => {
              const isDone    = i < currentIndex;
              const isCurrent = i === currentIndex;
              const stateClass = isDone ? 'rl-step-done' : isCurrent ? 'rl-step-current' : 'rl-step-pending';

              return (
                <div key={stepKey} className={`rl-step ${stateClass}`}>
                  {/* Connector line before (not on first) */}
                  {i > 0 && <div className="rl-step-line" aria-hidden="true" />}

                  <div className="rl-step-dot" aria-current={isCurrent ? 'step' : undefined}>
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                        <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>

                  <span className="rl-step-label">
                    {STEP_LABELS[stepKey] ?? stepKey}
                  </span>
                </div>
              );
            })}
          </nav>
        )}

        {/* Main content card */}
        <main className="rl-main">
          <div className={`rl-card${wide ? ' rl-card-wide' : ''}`}>
            {title && <h1 className="rl-title">{title}</h1>}
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="rl-footer">
          <span className="aeos-text-xs aeos-text-tertiary">
            &copy; {new Date().getFullYear()} AEOS365 &middot; Enterprise Edition
          </span>
        </footer>
      </div>

      <style>{`
        /* ── RegistrationLayout scoped styles ───────────────────── */

        /* Kill shell grid; hide customizer toggle */
        body[data-aeos-shell] { display: block !important; }
        .aeos-theme-drawer-trigger { display: none !important; }

        .rl-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--aeos-bg-page);
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient gradient mesh background */
        .rl-mesh {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,229,255,.10), transparent 65%),
            radial-gradient(ellipse 55% 50% at 90% 60%, rgba(99,102,241,.07), transparent 55%),
            radial-gradient(ellipse 40% 50% at 5%  75%, rgba(255,179,71,.04), transparent 55%);
        }

        /* Brand bar */
        .rl-brand {
          width: 100%; max-width: 900px;
          padding: 2rem 1.5rem 0;
          position: relative; z-index: 1;
        }
        .rl-brand-link {
          display: inline-flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .rl-logo-mark {
          display: flex; align-items: center;
          filter: drop-shadow(0 0 14px rgba(0,229,255,.35));
        }

        /* Step progress strip */
        .rl-steps {
          display: flex;
          align-items: center;
          width: 100%; max-width: 900px;
          padding: 1.5rem 1.5rem 0;
          position: relative; z-index: 1;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .rl-steps::-webkit-scrollbar { display: none; }

        .rl-step {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 6px;
        }

        /* Connector line between steps */
        .rl-step-line {
          flex: 1;
          height: 1px;
          min-width: 16px;
          max-width: 48px;
          background: var(--aeos-divider);
          margin-right: 6px;
          transition: background .2s;
        }
        .rl-step-done .rl-step-line { background: rgba(0,229,255,.3); }

        /* Step dot */
        .rl-step-dot {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: .65rem;
          font-family: var(--aeos-font-mono);
          flex-shrink: 0;
          transition: all .2s;
        }

        /* Step label */
        .rl-step-label {
          font-size: .7rem;
          letter-spacing: .05em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: color .2s;
          display: none;
        }
        @media (min-width: 600px) {
          .rl-step-label { display: inline; }
        }

        /* Done state */
        .rl-step-done .rl-step-dot {
          background: rgba(0,229,255,.12);
          border: 1px solid rgba(0,229,255,.35);
          color: var(--aeos-primary);
        }
        .rl-step-done .rl-step-label { color: var(--aeos-text-secondary); }

        /* Current state */
        .rl-step-current .rl-step-dot {
          background: var(--aeos-primary);
          border: 1px solid var(--aeos-primary);
          color: #0a0a0a;
          box-shadow: 0 0 12px rgba(0,229,255,.45);
        }
        .rl-step-current .rl-step-label { color: var(--aeos-primary); font-weight: 600; }

        /* Pending state */
        .rl-step-pending .rl-step-dot {
          background: var(--aeos-bg-surface);
          border: 1px solid var(--aeos-divider);
          color: var(--aeos-text-tertiary);
        }
        .rl-step-pending .rl-step-label { color: var(--aeos-text-tertiary); }

        /* Main card area */
        .rl-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 1.5rem 1rem 3rem;
          width: 100%;
          position: relative; z-index: 1;
        }

        .rl-card {
          width: 100%; max-width: 640px;
          background: var(--aeos-bg-surface);
          border-radius: var(--aeos-r-2xl);
          padding: 2.5rem;
          box-shadow:
            0 0 0 1px rgba(0,229,255,.08),
            0 24px 64px rgba(0,0,0,.10),
            0 0 60px rgba(0,229,255,.03);
        }
        .rl-card-wide { max-width: 900px; }

        /* Card title */
        .rl-title {
          font-family: var(--aeos-font-display);
          font-size: 1.55rem; font-weight: 700;
          letter-spacing: -.02em;
          color: var(--aeos-text-primary);
          margin: 0 0 1.75rem;
          line-height: 1.15;
        }

        /* Eyebrow / overline */
        .rl-eyebrow {
          font-size: .68rem;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--aeos-primary);
          font-family: var(--aeos-font-mono);
          margin-bottom: .4rem;
        }

        /* Description text under title */
        .rl-desc {
          font-size: .9rem;
          color: var(--aeos-text-secondary);
          margin: -.75rem 0 1.5rem;
          line-height: 1.6;
        }

        /* Bottom nav row (back / continue) */
        .rl-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--aeos-divider);
        }

        /* Footer */
        .rl-footer {
          padding: 1.5rem 0 2rem;
          position: relative; z-index: 1;
        }

        /* Mobile adjustments */
        @media (max-width: 640px) {
          .rl-card { padding: 2rem 1.25rem; border-radius: var(--aeos-r-xl); }
          .rl-brand { padding: 1.5rem 1rem 0; }
          .rl-nav { flex-direction: column; align-items: stretch; }
          .rl-nav > * { width: 100%; justify-content: center; }
        }
      `}</style>
    </>
  );
}
