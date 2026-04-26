import React from 'react';

/**
 * AeosPanel — workhorse content panel for app shells (matches `.panel` in
 * preview/app-shell.html). Renders title + mono kicker + body, no decoration.
 *
 *   <AeosPanel title="Activity" kicker="REAL-TIME · LAST 24 HOURS">
 *     <AeosFeedRow ... />
 *   </AeosPanel>
 *
 * @see aeos365-design-system/project/preview/app-shell.html (.panel)
 */
const AeosPanel = React.forwardRef(function AeosPanel(
  { title, kicker, actions, children, className = '', style, ...rest },
  ref
) {
  return (
    <section
      ref={ref}
      className={`aeos-panel ${className}`.trim()}
      style={{
        padding: 22,
        borderRadius: 'var(--aeos-r-lg, 14px)',
        background: 'rgba(13, 17, 32, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        ...style,
      }}
      {...rest}
    >
      {(title || kicker || actions) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: kicker ? 18 : 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title && (
              <h3
                style={{
                  fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  margin: 0,
                  color: 'var(--aeos-ink, #E8EDF5)',
                }}
              >
                {title}
              </h3>
            )}
            {kicker && (
              <div
                style={{
                  fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--aeos-ink-muted, #8892A4)',
                  marginTop: 4,
                }}
              >
                {kicker}
              </div>
            )}
          </div>
          {actions && <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
});

export default AeosPanel;
