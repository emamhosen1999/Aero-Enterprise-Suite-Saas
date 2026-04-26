import React from 'react';

/**
 * AeosIconTile — soft tinted square that wraps a Heroicon.
 *
 *   <AeosIconTile size={44} color="amber"><CurrencyDollarIcon /></AeosIconTile>
 *
 * @see aeos365-design-system/project/preview/cards.html (.icon-tile)
 */
const COLOR_MAP = {
  cyan:    { bg: 'rgba(0, 229, 255, 0.10)',   br: 'rgba(0, 229, 255, 0.22)',  fg: 'var(--aeos-int-cyan, var(--aeos-cyan, #00E5FF))' },
  amber:   { bg: 'rgba(255, 179, 71, 0.10)',  br: 'rgba(255, 179, 71, 0.22)', fg: 'var(--aeos-int-amber, var(--aeos-amber, #FFB347))' },
  indigo:  { bg: 'rgba(99, 102, 241, 0.12)',  br: 'rgba(99, 102, 241, 0.28)', fg: 'var(--aeos-int-indigo, var(--aeos-indigo, #6366F1))' },
  success: { bg: 'rgba(34, 197, 94, 0.10)',   br: 'rgba(34, 197, 94, 0.25)',  fg: 'var(--aeos-success, #22C55E)' },
  danger:  { bg: 'rgba(255, 107, 107, 0.10)', br: 'rgba(255, 107, 107, 0.25)', fg: 'var(--aeos-danger, #FF6B6B)' },
};

const AeosIconTile = React.forwardRef(function AeosIconTile(
  { children, color = 'cyan', size = 44, radius = 10, className = '', style, ...rest },
  ref
) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.cyan;
  const iconSize = Math.round(size * 0.5);

  return (
    <span
      ref={ref}
      className={`aeos-icon-tile ${className}`.trim()}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: c.bg,
        border: `1px solid ${c.br}`,
        borderRadius: radius,
        color: c.fg,
        ...style,
      }}
      {...rest}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, { style: { width: iconSize, height: iconSize, ...(children.props.style || {}) } })
        : children}
    </span>
  );
});

export default AeosIconTile;
