import React from 'react';

/**
 * Typography primitives for the aeos365 design system.
 *
 *   <AeosKicker color="cyan">/ 01 · HR CORE</AeosKicker>
 *   <AeosDisplayHero>Run the company on <em>one platform</em></AeosDisplayHero>
 *   <AeosStatNumber>12,847</AeosStatNumber>
 *   <AeosLabelMono>headcount</AeosLabelMono>
 *
 * @see aeos365-design-system/project/preview/typography.html
 */

export const AeosKicker = React.forwardRef(function AeosKicker(
  { children, color = 'cyan', as: Component = 'div', className = '', style, ...rest },
  ref
) {
  const colorMap = {
    cyan: 'var(--aeos-int-cyan, var(--aeos-cyan, #00E5FF))',
    amber: 'var(--aeos-int-amber, var(--aeos-amber, #FFB347))',
    indigo: 'var(--aeos-int-indigo, var(--aeos-indigo, #6366F1))',
    muted: 'var(--aeos-ink-muted, #8892A4)',
  };
  return (
    <Component
      ref={ref}
      className={`aeos-kicker ${className}`.trim()}
      style={{
        fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: colorMap[color] || colorMap.cyan,
        fontWeight: 500,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const AeosLabelMono = React.forwardRef(function AeosLabelMono(
  { children, as: Component = 'span', className = '', style, ...rest },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`aeos-label-mono ${className}`.trim()}
      style={{
        fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
        fontSize: 'var(--aeos-density-fs-label, 0.72rem)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--aeos-ink-muted, #8892A4)',
        fontWeight: 500,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const AeosDisplayHero = React.forwardRef(function AeosDisplayHero(
  { children, as: Component = 'h1', className = '', style, ...rest },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`aeos-display-hero ${className}`.trim()}
      style={{
        fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
        fontWeight: 800,
        fontSize: 'var(--aeos-fs-display-hero, clamp(2.8rem, 7vw, 5.5rem))',
        lineHeight: 1.04,
        letterSpacing: '-0.03em',
        textWrap: 'balance',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const AeosDisplaySection = React.forwardRef(function AeosDisplaySection(
  { children, as: Component = 'h2', className = '', style, ...rest },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`aeos-display-section ${className}`.trim()}
      style={{
        fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 'var(--aeos-fs-display-sec, clamp(2rem, 4vw, 3.2rem))',
        lineHeight: 1.1,
        letterSpacing: '-0.025em',
        textWrap: 'balance',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const AeosH3 = React.forwardRef(function AeosH3(
  { children, as: Component = 'h3', className = '', style, ...rest },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`aeos-h3 ${className}`.trim()}
      style={{
        fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
        fontSize: 'var(--aeos-density-fs-h3, 1.5rem)',
        fontWeight: 600,
        letterSpacing: '-0.015em',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const AeosStatNumber = React.forwardRef(function AeosStatNumber(
  { children, gradient = true, color, as: Component = 'div', className = '', style, ...rest },
  ref
) {
  const gradientStyle = gradient
    ? {
        background: 'var(--aeos-grad-text)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    : { color: color || 'var(--aeos-ink, #E8EDF5)' };
  return (
    <Component
      ref={ref}
      className={`aeos-stat-number ${className}`.trim()}
      style={{
        fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
        fontSize: 'clamp(2.4rem, 5vw, 4rem)',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        fontFeatureSettings: '"tnum"',
        ...gradientStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const AeosMonoNum = React.forwardRef(function AeosMonoNum(
  { children, as: Component = 'span', className = '', style, ...rest },
  ref
) {
  return (
    <Component
      ref={ref}
      style={{
        fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
        fontFeatureSettings: '"tnum"',
        letterSpacing: '-0.01em',
        ...style,
      }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const AeosTextGradient = React.forwardRef(function AeosTextGradient(
  { children, color = 'cyan', as: Component = 'span', className = '', style, ...rest },
  ref
) {
  const gradMap = {
    cyan: 'var(--aeos-grad-cyan)',
    amber: 'var(--aeos-grad-amber)',
    full: 'var(--aeos-grad-full)',
  };
  return (
    <Component
      ref={ref}
      className={className}
      style={{
        background: gradMap[color] || gradMap.cyan,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export default {
  AeosKicker,
  AeosLabelMono,
  AeosDisplayHero,
  AeosDisplaySection,
  AeosH3,
  AeosStatNumber,
  AeosMonoNum,
  AeosTextGradient,
};
