import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Box, HStack, VStack, Card, Text, Eyebrow } from '@aero/ui';

/**
 * InstallLayout — wizard shell for all installation pages.
 *
 * Forces light theme on body and blocks ThemeProvider from interfering
 * via `data-no-theme`. Rebuilds using engine components exclusively.
 */
export default function InstallLayout({ title, step, steps = [], mode, children }) {
  useEffect(() => {
    const prev      = document.body.className;
    const prevAttr  = document.body.dataset.noTheme;

    document.body.dataset.noTheme = '1';
    document.body.className       = 'aeos aeos--light';
    document.body.removeAttribute('data-aeos-shell');

    return () => {
      delete document.body.dataset.noTheme;
      document.body.className = prev;
      if (prevAttr !== undefined) document.body.dataset.noTheme = prevAttr;
    };
  }, []);

  const totalSteps = steps.length;
  const pct = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0;

  return (
    <>
      <Head title={`${title} · AEOS365 Setup`} />

      {/* Root — full viewport, centred column */}
      <Box
        flex dir="column" align="center"
        style={{ minHeight: '100vh', background: 'var(--aeos-bg-page)', position: 'relative', overflow: 'hidden' }}
      >
        {/* Ambient mesh */}
        <div aria-hidden="true" style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% -5%, rgba(0,163,184,.08), transparent 65%),
            radial-gradient(ellipse 55% 50% at 90% 65%, rgba(99,102,241,.05), transparent 55%),
            radial-gradient(ellipse 40% 50% at 5%  75%, rgba(180,83,9,.04),   transparent 55%)`,
        }} />

        {/* Top bar */}
        <HStack
          justify="space-between"
          style={{ width: '100%', maxWidth: 800, padding: '1.5rem 1rem 0', position: 'relative', zIndex: 1 }}
        >
          <Link href="/" aria-label="AEOS365 home" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ filter: 'drop-shadow(0 0 10px rgba(0,163,184,.3))', display: 'flex' }}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <rect width="30" height="30" rx="8" fill="url(#il-grad)" />
                <path d="M9 21L15 9l6 12H9z" fill="white" fillOpacity=".92" />
                <defs>
                  <linearGradient id="il-grad" x1="0" y1="0" x2="30" y2="30">
                    <stop stopColor="var(--aeos-primary)" />
                    <stop offset="1" stopColor="var(--aeos-tertiary)" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="aeos-logo-text" style={{ fontSize: '0.95rem' }}>aeos365</span>
          </Link>
          {mode && (
            <span className="aeos-badge aeos-badge-mono">
              {mode === 'saas' ? 'SaaS Mode' : 'Standalone'}
            </span>
          )}
        </HStack>

        {/* Step progress */}
        {totalSteps > 0 && (
          <Box style={{ width: '100%', maxWidth: 800, padding: '1.25rem 1rem 0', position: 'relative', zIndex: 1 }}>
            {/* Step dots */}
            <Box flex align="center" gap={0} style={{ marginBottom: 10, overflowX: 'auto' }}>
              {steps.map((s, i) => {
                const done    = i + 1 < step;
                const current = i + 1 === step;
                return (
                  <Box key={i} flex align="center" grow style={{ minWidth: 0 }}>
                    <Box flex align="center" gap={1} style={{ flexShrink: 0 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${current ? 'var(--aeos-primary)' : done ? 'rgba(0,163,184,.3)' : 'var(--aeos-divider)'}`,
                        background: current ? 'var(--aeos-primary)' : done ? 'rgba(0,163,184,.08)' : 'var(--aeos-bg-card)',
                        color: current ? '#fff' : done ? 'var(--aeos-primary)' : 'var(--aeos-text-tertiary)',
                        fontSize: '.6rem', fontFamily: 'var(--aeos-font-mono)',
                        boxShadow: current ? '0 0 10px rgba(0,163,184,.3)' : 'none',
                        transition: 'all .2s',
                      }}>
                        {done
                          ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                          : i + 1
                        }
                      </div>
                      <Text
                        as="span" size="xs"
                        style={{
                          whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.06em', display: 'none',
                          color: current ? 'var(--aeos-primary)' : done ? 'var(--aeos-text-secondary)' : 'var(--aeos-text-tertiary)',
                        }}
                        className="il-step-lbl"
                      >
                        {s}
                      </Text>
                    </Box>
                    {i < steps.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: done ? 'rgba(0,163,184,.2)' : 'var(--aeos-divider)', margin: '0 6px' }} />
                    )}
                  </Box>
                );
              })}
            </Box>
            {/* Progress bar */}
            <div style={{ height: 3, background: 'var(--aeos-divider)', borderRadius: 2, overflow: 'hidden' }}
              role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--aeos-grad-cyan)', borderRadius: 2, transition: 'width .4s var(--aeos-ease-out)' }} />
            </div>
          </Box>
        )}

        {/* Wizard card */}
        <Box style={{ width: '100%', maxWidth: 800, padding: '1.5rem 1rem 3rem', position: 'relative', zIndex: 1 }}>
          <Card style={{
            borderRadius: 'var(--aeos-r-2xl)',
            padding: '2.5rem',
            boxShadow: '0 0 0 1px rgba(0,0,0,.06), 0 20px 48px rgba(0,0,0,.10)',
          }}>
            {children}
          </Card>
        </Box>

        {/* Footer */}
        <Text as="p" size="xs" tone="tertiary" style={{ paddingBottom: '2rem', position: 'relative', zIndex: 1 }}>
          AEOS365 Enterprise Suite · Setup Wizard
        </Text>
      </Box>

      <style>{`
        /* Kill shell grid; hide customizer */
        body[data-aeos-shell] { display: block !important; }
        .aeos-theme-drawer-trigger { display: none !important; }
        /* Show step labels on wider screens */
        @media (min-width: 560px) { .il-step-lbl { display: inline !important; } }
        /* Wizard typography */
        .il-title {
          font-family: var(--aeos-font-display);
          font-size: 1.5rem; font-weight: 700;
          letter-spacing: -.018em; color: var(--aeos-text-primary);
          margin: 0 0 .35rem;
        }
        .il-desc { font-size: .9rem; color: var(--aeos-text-secondary); margin: 0 0 2rem; line-height: 1.6; }
        .il-nav {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--aeos-divider);
        }
        /* Requirements check row */
        .il-check { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
        .il-check + .il-check { border-top: 1px solid var(--aeos-divider); }
        .il-check-icon { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .7rem; }
        .il-check-pass { background: rgba(34,197,94,.12); color: var(--aeos-success); }
        .il-check-fail { background: rgba(255,107,107,.12); color: var(--aeos-destructive); }
        .il-check-warn { background: rgba(255,179,71,.12); color: var(--aeos-secondary); }
        /* Review table */
        .il-review-section { margin-bottom: 1.5rem; }
        .il-review-label { font-size: .65rem; letter-spacing: .12em; text-transform: uppercase; color: var(--aeos-text-tertiary); margin-bottom: .5rem; }
        .il-review-row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--aeos-divider); font-size: .875rem; }
        .il-review-key { color: var(--aeos-text-secondary); flex: 0 0 160px; }
        .il-review-val { color: var(--aeos-text-primary); font-family: var(--aeos-font-mono); font-size: .82rem; word-break: break-all; }
        @media (max-width: 640px) {
          .il-nav { flex-direction: column; align-items: stretch; }
          .il-nav > * { width: 100%; justify-content: center; }
        }
      `}</style>
    </>
  );
}
