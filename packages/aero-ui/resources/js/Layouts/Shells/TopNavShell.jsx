import React from 'react';
import { Link } from '@inertiajs/react';
import { useBranding } from '@/Hooks/theme/useBranding';
import { AeosButton } from '@/Components/aeos';

/**
 * TopNavShell — full-width top-nav layout for marketing / public / docs pages.
 * No sidebar. Centered content. Token-driven background.
 *
 *   <TopNavShell
 *     navItems={[{label:'Features',href:'/features'}, ...]}
 *     ctaLabel="Start trial"
 *     ctaHref="/register"
 *   >
 *     {children}
 *   </TopNavShell>
 *
 * @see aeos365-design-system/project/preview/landing.html
 */
const TopNavShell = ({
  navItems = [],
  ctaLabel,
  ctaHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  maxWidth = 'screen-2xl',
  showFooter = true,
  children,
}) => {
  const { siteName } = useBranding();

  const containerWidth = maxWidth === 'screen-xl' ? 1280 : 1536;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--aeos-grad-mesh), var(--aeos-obsidian, #03040A)',
        color: 'var(--aeos-ink, #E8EDF5)',
        fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(7, 11, 20, 0.65)',
          borderBottom: '1px solid var(--aeos-divider)',
        }}
      >
        <div
          style={{
            maxWidth: containerWidth,
            margin: '0 auto',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'var(--aeos-ink)',
              letterSpacing: '-0.025em',
              textDecoration: 'none',
            }}
          >
            <span style={{ textTransform: 'lowercase' }}>{(siteName || 'aeos').replace(/365$/, '')}</span>
            <sup style={{ color: 'var(--aeos-cyan, #00E5FF)', fontSize: '0.55rem', fontFamily: 'var(--aeos-font-mono)' }}>365</sup>
          </Link>

          <nav style={{ display: 'flex', gap: 24, marginLeft: 8 }} className="hidden md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--aeos-ink-muted, #8892A4)',
                  textDecoration: 'none',
                  transition: 'color 180ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--aeos-ink)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--aeos-ink-muted)'; }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {ctaSecondaryLabel && (
              <AeosButton as={Link} href={ctaSecondaryHref} variant="ghost" size="sm">
                {ctaSecondaryLabel}
              </AeosButton>
            )}
            {ctaLabel && (
              <AeosButton as={Link} href={ctaHref} variant="primary" size="sm">
                {ctaLabel}
              </AeosButton>
            )}
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: containerWidth,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(1rem, 2vw, 2rem)',
        }}
      >
        {children}
      </main>

      {showFooter && (
        <footer
          style={{
            borderTop: '1px solid var(--aeos-divider)',
            padding: '32px 28px',
            color: 'var(--aeos-ink-muted)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ maxWidth: containerWidth, margin: '0 auto' }}>
            © {new Date().getFullYear()} {siteName || 'aeos365'}.
          </div>
        </footer>
      )}
    </div>
  );
};

export default TopNavShell;
