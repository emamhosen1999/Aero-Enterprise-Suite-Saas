import React from 'react';
import { AeosKicker } from './AeosTypography';

/**
 * AeosPageHeader — title + lede + actions row (matches `.page-h` in
 * preview/app-shell.html).
 *
 *   <AeosPageHeader
 *     kicker="/ workforce"
 *     title="Workforce overview"
 *     subtitle="Mercury Logistics · 12,847 employees across 47 countries"
 *     actions={
 *       <>
 *         <AeosButton variant="ghost" size="sm">Export CSV</AeosButton>
 *         <AeosButton variant="primary" size="sm">+ Add employee</AeosButton>
 *       </>
 *     }
 *   />
 *
 * @see aeos365-design-system/project/preview/app-shell.html (.page-h)
 */
const AeosPageHeader = React.forwardRef(function AeosPageHeader(
  { kicker, title, subtitle, actions, className = '', style, ...rest },
  ref
) {
  return (
    <header
      ref={ref}
      className={`aeos-page-header ${className}`.trim()}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 24,
        marginBottom: 24,
        flexWrap: 'wrap',
        ...style,
      }}
      {...rest}
    >
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        {kicker && <AeosKicker style={{ marginBottom: 8 }}>{kicker}</AeosKicker>}
        {title && (
          <h1
            style={{
              fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '1.8rem',
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--aeos-ink, #E8EDF5)',
              textWrap: 'balance',
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p
            style={{
              color: 'var(--aeos-ink-muted, #8892A4)',
              fontSize: '0.88rem',
              margin: '4px 0 0',
              maxWidth: '70ch',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>{actions}</div>
      )}
    </header>
  );
});

export default AeosPageHeader;
