import React from 'react';

/**
 * AeosBadge — token-driven badge.
 *
 *   <AeosBadge variant="cyan">Active</AeosBadge>
 *   <AeosBadge variant="mono" dot>LIVE</AeosBadge>
 *
 * Variants: 'cyan' | 'amber' | 'indigo' | 'success' | 'danger' | 'mono'
 * dot: bool — adds the pulsing-glow leading dot (UPPERCASE mono recommended)
 *
 * @see aeos365-design-system/project/preview/badges.html
 */
const VARIANT_CSS = {
  cyan:    { bg: 'rgba(0, 229, 255, 0.08)',   br: 'rgba(0, 229, 255, 0.20)',   fg: 'var(--aeos-int-cyan, var(--aeos-cyan, #00E5FF))' },
  amber:   { bg: 'rgba(255, 179, 71, 0.08)',  br: 'rgba(255, 179, 71, 0.22)',  fg: 'var(--aeos-int-amber, var(--aeos-amber, #FFB347))' },
  indigo:  { bg: 'rgba(99, 102, 241, 0.10)',  br: 'rgba(99, 102, 241, 0.25)',  fg: 'var(--aeos-int-indigo, var(--aeos-indigo, #6366F1))' },
  success: { bg: 'rgba(34, 197, 94, 0.10)',   br: 'rgba(34, 197, 94, 0.25)',   fg: 'var(--aeos-success, #22C55E)' },
  danger:  { bg: 'rgba(255, 107, 107, 0.10)', br: 'rgba(255, 107, 107, 0.25)', fg: 'var(--aeos-danger, #FF6B6B)' },
  mono:    { bg: 'rgba(0, 229, 255, 0.08)',   br: 'rgba(0, 229, 255, 0.20)',   fg: 'var(--aeos-int-cyan, var(--aeos-cyan, #00E5FF))' },
};

const AeosBadge = React.forwardRef(function AeosBadge(
  { variant = 'cyan', dot = false, children, className = '', style, ...rest },
  ref
) {
  const v = VARIANT_CSS[variant] ?? VARIANT_CSS.cyan;
  const isMono = variant === 'mono';

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: isMono ? '0.2rem 0.55rem' : '0.25rem 0.65rem',
    borderRadius: 'var(--aeos-r-full, 9999px)',
    fontFamily: isMono
      ? 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace'
      : 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
    fontSize: isMono ? '0.65rem' : '0.72rem',
    fontWeight: 500,
    letterSpacing: isMono ? '0.15em' : '0.02em',
    textTransform: isMono ? 'uppercase' : undefined,
    background: v.bg,
    border: `1px solid ${v.br}`,
    color: v.fg,
    lineHeight: 1,
    ...style,
  };

  return (
    <span ref={ref} className={`aeos-badge ${className}`.trim()} style={baseStyle} {...rest}>
      {dot && (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            boxShadow: '0 0 6px currentColor',
            animation: 'aeos-pulse 2s ease-in-out infinite',
          }}
        />
      )}
      {children}
    </span>
  );
});

export default AeosBadge;
