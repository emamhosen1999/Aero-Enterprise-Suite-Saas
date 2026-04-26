import React from 'react';

/**
 * AeosDivider — horizontal rule. Variants:
 *   - "default" → 1px var(--aeos-divider)
 *   - "glow"    → cyan-glow gradient line (decorative)
 */
const AeosDivider = React.forwardRef(function AeosDivider(
  { variant = 'default', orientation = 'horizontal', className = '', style, ...rest },
  ref
) {
  const isGlow = variant === 'glow';
  const isVertical = orientation === 'vertical';
  const baseStyle = isGlow
    ? {
        height: isVertical ? 'auto' : 1,
        width: isVertical ? 1 : 'auto',
        background: isVertical
          ? 'linear-gradient(180deg, transparent, rgba(0, 229, 255, 0.4), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.4), transparent)',
        border: 0,
      }
    : {
        height: isVertical ? 'auto' : 1,
        width: isVertical ? 1 : 'auto',
        background: 'var(--aeos-divider)',
        border: 0,
      };
  return (
    <hr
      ref={ref}
      className={`aeos-divider ${isGlow ? 'aeos-divider--glow' : ''} ${className}`.trim()}
      style={{ ...baseStyle, ...style }}
      {...rest}
    />
  );
});

export default AeosDivider;
