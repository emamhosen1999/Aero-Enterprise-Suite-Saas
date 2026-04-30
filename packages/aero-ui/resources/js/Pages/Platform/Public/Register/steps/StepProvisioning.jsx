import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { VStack, HStack, Box, Text, Mono, Alert, Button } from '@aero/ui';
import { SR } from '../signupRoutes.js';

const POLL_MS = 1500;

const STEP_KEYS   = ['creating_db', 'migrating', 'seeding', 'creating_admin'];
const STEP_LABELS = {
  creating_db:    'Creating database',
  migrating:      'Running migrations',
  seeding:        'Setting up roles & data',
  creating_admin: 'Creating admin account',
};

/**
 * StepProvisioning — polls tenant provisioning status and shows progress.
 *
 * Redirects on completion. Shows retry on failure.
 */
export default function StepProvisioning({ tenant = {}, baseDomain = '' }) {
  const tenantId = tenant?.id;

  const [pollData,   setPollData]   = useState(null);
  const [error,      setError]      = useState(null);
  const [retrying,   setRetrying]   = useState(false);

  const status     = pollData?.status       ?? tenant?.status       ?? 'pending';
  const stepKey    = pollData?.step         ?? tenant?.provisioning_step ?? null;
  const isFailed   = pollData?.has_failed   ?? false;
  const isReady    = pollData?.is_ready     ?? false;

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const { data } = await axios.get(SR.provisioningStatus(tenantId));
        if (!active) return;

        setPollData(data);

        if (data.is_ready) {
          if (data.needs_admin_setup) {
            window.location.href = `https://${tenant.subdomain}.${baseDomain}/admin-setup`;
          } else {
            router.get(SR.success);
          }
          return;
        }

        if (data.has_failed) {
          setError(data.error ?? 'Provisioning failed. Please retry.');
          return;
        }

        setTimeout(poll, POLL_MS);
      } catch (err) {
        if (!active) return;
        setError('Lost connection to the server. Please retry.');
      }
    }

    poll();
    return () => { active = false; };
  }, [tenantId]);

  async function retry() {
    setRetrying(true);
    setError(null);
    try {
      await axios.post(SR.retryProvisioning(tenantId));
      setPollData(null);
      // Re-mount polling
      window.location.reload();
    } catch {
      setError('Retry request failed. Please refresh the page.');
    } finally {
      setRetrying(false);
    }
  }

  // Compute step statuses
  function getStepStatus(key) {
    if (!stepKey) return 'pending';
    const cur = STEP_KEYS.indexOf(stepKey);
    const idx = STEP_KEYS.indexOf(key);
    if (isFailed && idx === cur) return 'failed';
    if (idx < cur)               return 'done';
    if (idx === cur)             return isReady ? 'done' : 'running';
    return 'pending';
  }

  // Progress percentage based on current step
  const stepIndex  = stepKey ? STEP_KEYS.indexOf(stepKey) : 0;
  const percentage = isReady
    ? 100
    : Math.round(((stepIndex + (isFailed ? 0 : 0.5)) / STEP_KEYS.length) * 100);

  const displayStatus = isReady ? 'completed' : isFailed ? 'failed' : 'running';

  return (
    <VStack gap={5} align="center">
      {/* Spinner / status icon */}
      <div className="rl-prov-icon-wrap">
        <div className={`rl-prov-icon-bg rl-prov-icon-bg--${displayStatus}`}>
          {displayStatus === 'completed' ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M8 16l6 6 10-12" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : displayStatus === 'failed' ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M10 10l12 12M22 10L10 22" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="url(#prov-grad)" />
              <path d="M8 20L14 9l6 11H8z" fill="white" fillOpacity=".9" />
              <defs>
                <linearGradient id="prov-grad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="var(--aeos-primary)" />
                  <stop offset="1" stopColor="var(--aeos-tertiary)" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>
        {displayStatus === 'running' && (
          <div className="rl-prov-spinner" aria-label="Loading" />
        )}
      </div>

      {/* Heading */}
      <VStack gap={1} align="center">
        <div className="rl-prov-title">
          {displayStatus === 'completed'
            ? 'Workspace ready!'
            : displayStatus === 'failed'
            ? 'Provisioning failed'
            : 'Setting up your workspace…'}
        </div>
        <Text tone="secondary">
          {displayStatus === 'running' && stepKey
            ? STEP_LABELS[stepKey] ?? 'Working…'
            : displayStatus === 'completed'
            ? 'Redirecting you now…'
            : 'An error occurred during setup.'}
        </Text>
      </VStack>

      {/* Progress bar */}
      <div className="rl-prov-bar-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`rl-prov-bar-fill${isFailed ? ' rl-prov-bar-fill--failed' : ''}`}
          style={{ width: `${Math.max(percentage, displayStatus === 'running' ? 5 : 0)}%` }}
        />
      </div>

      {/* Step list */}
      <div className="rl-prov-steps">
        {STEP_KEYS.map((key, i) => {
          const st = getStepStatus(key);
          return (
            <div key={key} className={`rl-prov-step rl-prov-step--${st}`}>
              <HStack gap={3} align="center">
                <div className="rl-prov-step-icon">
                  {st === 'done'    && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                  {st === 'running' && <div className="rl-prov-step-spinner" />}
                  {st === 'failed'  && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  {st === 'pending' && <div className="rl-prov-step-dot" />}
                </div>
                <Mono size="sm">{STEP_LABELS[key]}</Mono>
                <Box grow />
                {st === 'done'    && <Text tone="secondary" size="xs">done</Text>}
                {st === 'running' && <Text size="xs">running…</Text>}
                {st === 'failed'  && <Text tone="secondary" size="xs">failed</Text>}
              </HStack>
            </div>
          );
        })}
      </div>

      {/* Error + retry */}
      {error && (
        <Alert intent="danger" title="Provisioning error">
          {error}
          <div className="rl-prov-retry">
            <Button intent="ghost" size="sm" loading={retrying} onClick={retry}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <style>{`
        @keyframes rl-spin { to { transform: rotate(360deg); } }
        @keyframes rl-step-spin { to { transform: rotate(360deg); } }

        .rl-prov-icon-wrap {
          position: relative;
          width: 80px; height: 80px;
        }
        .rl-prov-icon-bg {
          position: absolute; inset: 0;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background .3s, border-color .3s;
        }
        .rl-prov-icon-bg--running {
          background: rgba(0,229,255,.08);
          border: 2px solid rgba(0,229,255,.15);
        }
        .rl-prov-icon-bg--completed {
          background: rgba(34,197,94,.10);
          border: 2px solid rgba(34,197,94,.25);
        }
        .rl-prov-icon-bg--failed {
          background: rgba(255,107,107,.10);
          border: 2px solid rgba(255,107,107,.25);
        }
        .rl-prov-spinner {
          position: absolute; inset: -2px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: var(--aeos-primary);
          animation: rl-spin .8s linear infinite;
        }

        .rl-prov-title {
          font-family: var(--aeos-font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--aeos-text-primary);
          text-align: center;
          letter-spacing: -.01em;
        }

        .rl-prov-bar-track {
          width: 100%;
          height: 6px;
          background: var(--aeos-divider);
          border-radius: 4px;
          overflow: hidden;
        }
        .rl-prov-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: var(--aeos-grad-cyan);
          transition: width .5s ease;
        }
        .rl-prov-bar-fill--failed {
          background: rgba(255,107,107,.6);
        }

        .rl-prov-steps {
          width: 100%;
          background: rgba(0,0,0,.02);
          border: 1px solid var(--aeos-divider);
          border-radius: var(--aeos-r-lg);
          overflow: hidden;
        }
        .rl-prov-step {
          padding: .6rem 1rem;
          border-bottom: 1px solid var(--aeos-divider);
        }
        .rl-prov-step:last-child { border-bottom: none; }

        .rl-prov-step-icon {
          width: 16px; height: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Step icon colors by state */
        .rl-prov-step--done    .rl-prov-step-icon { color: var(--aeos-success); }
        .rl-prov-step--running .rl-prov-step-icon { color: var(--aeos-primary); }
        .rl-prov-step--failed  .rl-prov-step-icon { color: var(--aeos-destructive); }
        .rl-prov-step--pending .rl-prov-step-icon { color: var(--aeos-text-tertiary); }

        /* Step text colors */
        .rl-prov-step--done    { opacity: .85; }
        .rl-prov-step--pending { opacity: .5; }

        .rl-prov-step-spinner {
          width: 10px; height: 10px;
          border: 1.5px solid transparent;
          border-top-color: var(--aeos-primary);
          border-radius: 50%;
          animation: rl-step-spin .6s linear infinite;
        }
        .rl-prov-step-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--aeos-text-tertiary);
        }

        .rl-prov-retry { margin-top: 10px; }
      `}</style>
    </VStack>
  );
}
