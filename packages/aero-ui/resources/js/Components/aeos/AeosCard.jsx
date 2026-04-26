import React from 'react';

/**
 * AeosCard — polymorphic card with five variants from the design system.
 *
 *   <AeosCard variant="elevated" as="article" pad="lg">…</AeosCard>
 *
 * Variants:
 *   - "flat"        → .aeos-card           (3% white wash, hairline border)
 *   - "elevated"    → .aeos-card-elevated  (graphite + cyan-tint + warm shadow)
 *   - "outlined"    → minimal cyan-tinted hairline, no background fill
 *   - "glass"       → .aeos-glass          (70% slate translucent, 16px blur)
 *   - "glass-strong"→ .aeos-glass-strong   (85% obsidian, 24px blur — modals)
 *   - "bento"       → .aeos-bento          (cursor-tracked highlight; needs --mx/--my)
 *   - "cta"         → .aeos-cta-glass      (full-spectrum gradient, hero panels)
 *   - "minimalist"  → no chrome, just padding (for inset content)
 *   - "inset"       → recessed: darker than parent, inner hairline border
 *
 * Padding: 'none' | 'sm' | 'md' (default) | 'lg' | 'xl' (token-driven via --aeos-density-pad-card)
 *
 * Style is fully encapsulated — pages should NOT pass className with raw colors.
 *
 * @see aeos365-design-system/project/preview/cards.html
 */
const VARIANT_CLASS = {
  flat: 'aeos-card',
  elevated: 'aeos-card-elevated',
  glass: 'aeos-glass',
  'glass-strong': 'aeos-glass-strong',
  bento: 'aeos-bento',
  cta: 'aeos-cta-glass',
  outlined: '',     // styled via inline below
  minimalist: '',   // styled via inline below
  inset: '',        // styled via inline below
};

const PAD_VAR = {
  none: '0',
  sm:   '0.75rem',
  md:   'var(--aeos-density-pad-card, 1.5rem)',
  lg:   '2rem',
  xl:   '2.5rem',
};

const variantInline = (variant) => {
  switch (variant) {
    case 'outlined':
      return {
        background: 'transparent',
        border: '1px solid rgba(0, 229, 255, calc(var(--aeos-int-border-alpha, 0.20) * 1))',
        borderRadius: 'var(--aeos-r-xl, 16px)',
      };
    case 'minimalist':
      return {
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
      };
    case 'inset':
      return {
        background: 'rgba(0, 0, 0, 0.30)',
        border: '1px solid var(--aeos-divider)',
        borderRadius: 'var(--aeos-r-lg, 12px)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      };
    default:
      return null;
  }
};

const AeosCard = React.forwardRef(function AeosCard(
  {
    as: Component = 'div',
    variant = 'flat',
    pad = 'md',
    interactive = false,
    children,
    className = '',
    style,
    ...rest
  },
  ref
) {
  const variantCls = VARIANT_CLASS[variant] ?? VARIANT_CLASS.flat;
  const inline = variantInline(variant);

  const paddingValue = PAD_VAR[pad] ?? PAD_VAR.md;

  const composedStyle = {
    padding: paddingValue,
    transition:
      'border-color var(--aeos-dur-base) var(--aeos-ease-out), box-shadow var(--aeos-dur-base) var(--aeos-ease-out), background var(--aeos-dur-base) var(--aeos-ease-out)',
    ...(inline || {}),
    ...style,
  };

  // Bento needs cursor tracking
  const bentoTrack = variant === 'bento'
    ? (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
    : undefined;

  return (
    <Component
      ref={ref}
      className={[variantCls, interactive ? 'aeos-card--interactive' : '', className].filter(Boolean).join(' ')}
      style={composedStyle}
      onMouseMove={bentoTrack}
      {...rest}
    >
      {children}
    </Component>
  );
});

export default AeosCard;
