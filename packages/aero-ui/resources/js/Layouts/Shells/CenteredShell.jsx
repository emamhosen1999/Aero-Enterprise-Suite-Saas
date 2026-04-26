import React from 'react';
import { motion } from 'framer-motion';
import { useBranding } from '@/Hooks/theme/useBranding';
import { AeosCard, AeosKicker } from '@/Components/aeos';

/**
 * CenteredShell — for auth, onboarding, single-task flows.
 *
 *   <CenteredShell title="Welcome back" subtitle="Sign in to your workspace">
 *     <LoginForm />
 *   </CenteredShell>
 *
 * Page background: mesh + obsidian. Card: cta-glass (default) or glass-strong.
 *
 * @see aeos365-design-system/project/preview/cards.html (.aeos-cta-glass)
 */
const CenteredShell = ({
  title,
  subtitle,
  kicker,
  cardVariant = 'cta',
  width = 460,
  showBrand = true,
  children,
}) => {
  const { siteName, logo } = useBranding();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--aeos-grad-mesh), var(--aeos-obsidian, #03040A)',
        color: 'var(--aeos-ink, #E8EDF5)',
        fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
        padding: 24,
      }}
      className="aeos-grid-bg"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: width }}
      >
        <AeosCard variant={cardVariant} pad="lg" style={{ position: 'relative' }}>
          {showBrand && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              {logo ? (
                <img src={logo} alt={siteName || 'aeos365'} style={{ height: 48, objectFit: 'contain' }} />
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--aeos-font-display)',
                    fontWeight: 800,
                    fontSize: '1.6rem',
                    letterSpacing: '-0.03em',
                    textTransform: 'lowercase',
                  }}
                >
                  {(siteName || 'aeos').replace(/365$/, '')}
                  <sup style={{ color: 'var(--aeos-cyan)', fontSize: '0.5em', fontFamily: 'var(--aeos-font-mono)' }}>365</sup>
                </span>
              )}
            </div>
          )}

          {kicker && (
            <AeosKicker style={{ textAlign: 'center', marginBottom: 12 }}>{kicker}</AeosKicker>
          )}
          {title && (
            <h1
              style={{
                fontFamily: 'var(--aeos-font-display, "Syne")',
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                letterSpacing: '-0.02em',
                margin: 0,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              style={{
                color: 'var(--aeos-ink-muted, #8892A4)',
                margin: '0 0 24px',
                textAlign: 'center',
                fontSize: '0.95rem',
              }}
            >
              {subtitle}
            </p>
          )}
          {children}
        </AeosCard>
      </motion.div>
    </div>
  );
};

export default CenteredShell;
