import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * AeosButton — polymorphic button matching aeos365 spec.
 *
 *   <AeosButton variant="primary" size="md" leftIcon={<Icon/>}>Run payroll</AeosButton>
 *   <AeosButton as={Link} href="/foo" variant="ghost">Docs</AeosButton>
 *
 * Variants (from preview/buttons.html):
 *   - "primary"  → cyan→indigo gradient + glow  (dominant CTA)
 *   - "ghost"    → transparent + 15% white border (secondary CTA)
 *   - "soft"     → cyan-tinted bg + border + label (tertiary inside cards)
 *   - "amber"    → amber→coral gradient + glow (payroll/finance)
 *   - "danger"   → coral fill (destructive)
 *   - "icon"     → square icon-only button (32 / 36 / 40)
 *   - "icon-soft"→ icon-only with cyan-tint background (default for topbar)
 *
 * Size: 'sm' | 'md' (default) | 'lg' | 'xl' — token-driven via density.
 *
 * @see aeos365-design-system/project/preview/buttons.html
 */
const SIZE_MAP = {
  sm: { h: '2.1rem', px: '1rem', fontSize: '0.8rem', radius: 'var(--aeos-r-sm, 6px)' },
  md: { h: 'var(--aeos-density-control-h, 2.5rem)', px: 'var(--aeos-density-control-px, 1.75rem)', fontSize: '0.925rem', radius: 'var(--aeos-r-md, 8px)' },
  lg: { h: '2.9rem', px: '2.5rem', fontSize: '1rem', radius: 'var(--aeos-r-md, 8px)' },
  xl: { h: '3.2rem', px: '3rem', fontSize: '1.05rem', radius: 'var(--aeos-r-md, 8px)' },
};

const ICON_SIZE_MAP = {
  sm: '2rem',
  md: '2.25rem',
  lg: '2.5rem',
  xl: '3rem',
};

const variantStyles = (variant) => {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--aeos-grad-cyan)',
        color: 'var(--aeos-obsidian, #03040A)',
        border: 'none',
        boxShadow: '0 0 24px rgba(0, 229, 255, calc(var(--aeos-int-glow-alpha, 0.30) * 1))',
      };
    case 'amber':
      return {
        background: 'var(--aeos-grad-amber)',
        color: 'var(--aeos-obsidian, #03040A)',
        border: 'none',
        boxShadow: '0 0 24px rgba(255, 179, 71, calc(var(--aeos-int-glow-alpha, 0.30) * 0.8))',
      };
    case 'danger':
      return {
        background: 'var(--aeos-coral, #FF6B6B)',
        color: '#FFFFFF',
        border: 'none',
        boxShadow: '0 0 18px rgba(255, 107, 107, 0.30)',
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--aeos-ink, #E8EDF5)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        fontWeight: 500,
      };
    case 'soft':
      return {
        background: 'rgba(0, 229, 255, 0.08)',
        color: 'var(--aeos-int-cyan, var(--aeos-cyan, #00E5FF))',
        border: '1px solid rgba(0, 229, 255, calc(var(--aeos-int-border-alpha, 0.20) * 1))',
        fontWeight: 500,
      };
    case 'icon-soft':
      return {
        background: 'rgba(0, 229, 255, 0.08)',
        color: 'var(--aeos-int-cyan, var(--aeos-cyan, #00E5FF))',
        border: '1px solid rgba(0, 229, 255, calc(var(--aeos-int-border-alpha, 0.20) * 1))',
      };
    case 'icon':
    default:
      return {
        background: 'rgba(255, 255, 255, 0.03)',
        color: 'var(--aeos-ink-muted, #8892A4)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      };
  }
};

const AeosButton = React.forwardRef(function AeosButton(
  {
    as,
    href,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    children,
    className = '',
    style,
    fullWidth = false,
    disabled = false,
    type = 'button',
    onClick,
    ...rest
  },
  ref
) {
  const isIconOnly = (variant === 'icon' || variant === 'icon-soft') && !children;
  const sizeCfg = SIZE_MAP[size] ?? SIZE_MAP.md;
  const iconBox = ICON_SIZE_MAP[size] ?? ICON_SIZE_MAP.md;
  const variantCss = variantStyles(variant);

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    borderRadius: sizeCfg.radius,
    fontSize: sizeCfg.fontSize,
    height: isIconOnly ? iconBox : sizeCfg.h,
    width: isIconOnly ? iconBox : (fullWidth ? '100%' : undefined),
    padding: isIconOnly ? 0 : `0 ${sizeCfg.px}`,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    transition:
      'transform var(--aeos-dur-fast, 180ms) var(--aeos-ease-out), box-shadow var(--aeos-dur-fast) var(--aeos-ease-out), opacity var(--aeos-dur-fast) var(--aeos-ease-out), background var(--aeos-dur-fast) var(--aeos-ease-out), border-color var(--aeos-dur-fast) var(--aeos-ease-out)',
    ...variantCss,
    ...style,
  };

  const handleHoverIn = (e) => {
    if (disabled) return;
    if (variant === 'primary' || variant === 'amber' || variant === 'danger') {
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.opacity = '0.92';
      e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 229, 255, 0.50)';
    } else if (variant === 'ghost') {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
      e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.30)';
    } else if (variant === 'soft' || variant === 'icon-soft') {
      e.currentTarget.style.background = 'rgba(0, 229, 255, 0.14)';
    } else {
      e.currentTarget.style.color = 'var(--aeos-cyan, #00E5FF)';
      e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.20)';
    }
  };

  const handleHoverOut = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.opacity = disabled ? '0.5' : '1';
    Object.assign(e.currentTarget.style, variantCss);
  };

  const Tag = as ?? (href ? Link : 'button');
  const passProps = href ? { href, ref, ...rest } : { type, ref, disabled, ...rest };

  return (
    <Tag
      className={['aeos-btn', `aeos-btn--${variant}`, `aeos-btn--${size}`, className].filter(Boolean).join(' ')}
      style={baseStyle}
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
      onClick={onClick}
      {...passProps}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Tag>
  );
});

export default AeosButton;
