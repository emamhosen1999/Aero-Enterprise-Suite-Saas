/**
 * AEOS UI — Action Components
 * -----------------------------------------------------------------------
 * Exports: Button, IconButton, ButtonGroup, Link
 *
 * All static styles come from CSS classes in app.css.
 * Inline styles are used ONLY for dynamic, prop-driven values.
 * -----------------------------------------------------------------------
 */

import { forwardRef } from 'react';
import { Icon } from '../icons/icons.jsx';
import { cx } from './Primitives.jsx';

/* ── Intent → CSS class maps ──────────────────────────────────────────── */

const BUTTON_INTENT_CLASS = {
  primary: 'aeos-btn-primary',
  ghost:   'aeos-btn-ghost',
  soft:    'aeos-btn-soft',
  amber:   'aeos-btn-amber',
  danger:  'aeos-btn-danger',
};

const BUTTON_SIZE_CLASS = {
  sm:   'aeos-btn-sm',
  md:   'aeos-btn-md',
  lg:   'aeos-btn-lg',
  icon: 'aeos-btn-icon',
};

/* ════════════════════════════════════════════════════════════════════
   BUTTON
   ════════════════════════════════════════════════════════════════════ */

/**
 * `Button` — interactive action element.
 *
 * Polymorphic via the `as` prop. When `href` is provided and no `as` is set,
 * renders as an anchor automatically.
 *
 * @param {object}   props
 * @param {'primary'|'ghost'|'soft'|'amber'|'danger'} [props.intent='primary']
 * @param {'sm'|'md'|'lg'|'icon'} [props.size='md']
 * @param {string}   [props.leftIcon]   - Icon name rendered before text
 * @param {string}   [props.rightIcon]  - Icon name rendered after text
 * @param {boolean}  [props.loading]    - Shows spinner, disables interaction
 * @param {boolean}  [props.disabled]
 * @param {boolean}  [props.fullWidth]  - Stretches to container width
 * @param {React.ElementType} [props.as] - Polymorphic element override
 * @param {string}   [props.href]       - If set, renders as <a>
 * @param {string}   [props.className]
 */
export const Button = forwardRef(function Button(
  {
    intent = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    loading = false,
    disabled = false,
    fullWidth = false,
    as: Tag,
    href,
    className,
    children,
    onClick,
    type = 'button',
    ...rest
  },
  ref
) {
  // Determine element type
  const Element = Tag ?? (href ? 'a' : 'button');

  const intentClass = BUTTON_INTENT_CLASS[intent] ?? 'aeos-btn-primary';
  const sizeClass   = BUTTON_SIZE_CLASS[size] ?? 'aeos-btn-md';
  const isDisabled  = disabled || loading;

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  // For icon-only size, derive aria-label from children if it's a string
  const buttonProps = {
    ref,
    className: cx(
      'aeos-btn',
      intentClass,
      sizeClass,
      fullWidth && 'aeos-btn-full',
      loading && 'aeos-btn-loading',
      isDisabled && 'aeos-btn-disabled',
      className
    ),
    ...(Element === 'button' && { type, disabled: isDisabled }),
    ...(href && { href }),
    ...(isDisabled && Element !== 'button' && { 'aria-disabled': true, tabIndex: -1 }),
    onClick: isDisabled ? undefined : onClick,
    ...rest,
  };

  return (
    <Element {...buttonProps}>
      {loading && (
        <span className="aeos-spinner" aria-hidden="true" />
      )}
      {!loading && leftIcon && (
        <Icon name={leftIcon} size={iconSize} className="aeos-btn-icon-left" />
      )}
      {children && <span className="aeos-btn-label">{children}</span>}
      {!loading && rightIcon && (
        <Icon name={rightIcon} size={iconSize} className="aeos-btn-icon-right" />
      )}
    </Element>
  );
});

/* ════════════════════════════════════════════════════════════════════
   ICON BUTTON
   ════════════════════════════════════════════════════════════════════ */

/**
 * `IconButton` — square action button with a single centered icon.
 *
 * @param {object}   props
 * @param {string}   props.icon        - Icon name (required)
 * @param {string}   props.label       - aria-label (required for accessibility)
 * @param {'ghost'|'soft'|'primary'} [props.intent='ghost']
 * @param {'sm'|'md'} [props.size='md']
 * @param {boolean}  [props.disabled]
 * @param {string}   [props.className]
 */
export const IconButton = forwardRef(function IconButton(
  {
    icon,
    label,
    intent = 'ghost',
    size = 'md',
    disabled = false,
    className,
    type = 'button',
    ...rest
  },
  ref
) {
  const intentClass = BUTTON_INTENT_CLASS[intent] ?? 'aeos-btn-ghost';
  const iconSize    = size === 'sm' ? 14 : 16;

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cx(
        'aeos-btn',
        intentClass,
        'aeos-btn-icon',
        size === 'sm' && 'aeos-btn-sm',
        disabled && 'aeos-btn-disabled',
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
});

/* ════════════════════════════════════════════════════════════════════
   BUTTON GROUP
   ════════════════════════════════════════════════════════════════════ */

/**
 * `ButtonGroup` — horizontal grouping of buttons.
 *
 * @param {object}   props
 * @param {boolean}  [props.attached] - Merge borders so buttons appear fused
 * @param {string}   [props.className]
 */
export function ButtonGroup({ attached = false, className, children, ...rest }) {
  return (
    <div
      className={cx(
        'aeos-btn-group',
        attached && 'aeos-btn-group-attached',
        className
      )}
      role="group"
      {...rest}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   LINK
   ════════════════════════════════════════════════════════════════════ */

const LINK_INTENT_CLASS = {
  primary: 'aeos-link-primary',
  muted:   'aeos-link-muted',
};

const LINK_UNDERLINE_CLASS = {
  hover:  'aeos-link-underline-hover',
  always: 'aeos-link-underline-always',
  none:   'aeos-link-underline-none',
};

/**
 * `Link` — styled anchor with intent and underline controls.
 *
 * @param {object}   props
 * @param {string}   props.href
 * @param {boolean}  [props.external]             - Adds target="_blank" rel="noopener noreferrer" and external icon
 * @param {string}   [props.leftIcon]
 * @param {string}   [props.rightIcon]
 * @param {'primary'|'muted'} [props.intent='primary']
 * @param {'hover'|'always'|'none'} [props.underline='hover']
 * @param {string}   [props.className]
 */
export const Link = forwardRef(function Link(
  {
    href,
    external = false,
    leftIcon,
    rightIcon,
    intent = 'primary',
    underline = 'hover',
    className,
    children,
    ...rest
  },
  ref
) {
  const intentClass    = LINK_INTENT_CLASS[intent] ?? 'aeos-link-primary';
  const underlineClass = LINK_UNDERLINE_CLASS[underline] ?? 'aeos-link-underline-hover';

  return (
    <a
      ref={ref}
      href={href}
      className={cx('aeos-link', intentClass, underlineClass, className)}
      {...(external && {
        target:   '_blank',
        rel:      'noopener noreferrer',
      })}
      {...rest}
    >
      {leftIcon && <Icon name={leftIcon} size={14} className="aeos-link-icon" />}
      {children}
      {external && !rightIcon && (
        <Icon name="external" size={12} className="aeos-link-icon aeos-link-icon-external" />
      )}
      {rightIcon && <Icon name={rightIcon} size={14} className="aeos-link-icon" />}
    </a>
  );
});
